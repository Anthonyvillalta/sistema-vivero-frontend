import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order, OrderStatus } from '../types';
import { deliveryApi, companySettingsApi } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Phone,
  MessageSquare,
  Truck,
  MapPin,
  CheckCircle2,
  Timer,
  ShieldCheck,
  X,
  ArrowLeft,
  Radio,
  Layers,
  Map as MapIcon,
  Database,
  Crosshair,
  Save,
  Navigation2,
  Gauge,
  PackageCheck
} from 'lucide-react';

interface RealTimeMapProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
}

export const RealTimeMap: React.FC<RealTimeMapProps> = ({ order, onClose, onUpdateStatus }) => {
  const { companyName } = useCompanySettings();
  if (!order) return null;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastGpsSaveRef = useRef<number>(0);
  const pendingGpsRef = useRef<{ lat: number; lng: number; accuracy: number; speed: number } | null>(null);

  // Map Provider View Mode inside the modal: 'leaflet' (Interactive Vector Map) or 'google' (Embedded Google Maps)
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'google'>('leaflet');
  const [useRealDeviceGps, setUseRealDeviceGps] = useState<boolean>(true);
  const [realGpsCoords, setRealGpsCoords] = useState<{ lat: number; lng: number; accuracy: number; speed: number | null } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSyncStatus, setGpsSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [isPickingDestination, setIsPickingDestination] = useState<boolean>(false);
  // Advertencia al marcar entregado antes de tiempo / lejos del destino
  const [deliveryWarn, setDeliveryWarn] = useState<string | null>(null);

  // Warehouse (Vivero) location from Company Settings in MySQL
  const [warehouseCoord, setWarehouseCoord] = useState<[number, number] | null>(null);
  // Customer destination coordinates from deliveries table in MySQL
  const [destinationCoord, setDestinationCoord] = useState<[number, number] | null>(null);
  // ETA recalculada localmente al reposicionar el destino (persistida en MySQL)
  const [localEta, setLocalEta] = useState<Date | null>(null);
  // Estado del geocoding de la dirección registrada del pedido
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'geocoding' | 'done' | 'error'>('idle');

  const orderDelivery = order.delivery;
  const dbDriverCoord: [number, number] | null =
    orderDelivery?.currentLatitude != null && orderDelivery?.currentLongitude != null
      ? [Number(orderDelivery.currentLatitude), Number(orderDelivery.currentLongitude)]
      : null;
  const dbDestinationCoord: [number, number] | null =
    orderDelivery?.destinationLatitude != null && orderDelivery?.destinationLongitude != null
      ? [Number(orderDelivery.destinationLatitude), Number(orderDelivery.destinationLongitude)]
      : null;
  const etaDate = localEta ?? (orderDelivery?.estimatedArrival ? new Date(orderDelivery.estimatedArrival) : null);

  // Haversine distance in km between two coordinates
  const haversineKm = (a: [number, number], b: [number, number]): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return Number((2 * R * Math.asin(Math.sqrt(s))).toFixed(1));
  };

  // Resolve an address string into coordinates using OpenStreetMap Nominatim
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(address + ', Lima, Peru')}`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (err) {
      console.error('Error al geocodificar la dirección:', err);
      return null;
    }
  };

  // Recalculate ETA from distance (avg 25 km/h, min 8 min) and persist to MySQL
  const computeEtaAndSave = async (dest: [number, number]) => {
    const from: [number, number] | null = realGpsCoords
      ? [realGpsCoords.lat, realGpsCoords.lng]
      : dbDriverCoord ?? warehouseCoord;
    if (!from) return;
    const km = haversineKm(from, dest);
    const minutes = Math.max(8, Math.round((km / 25) * 60));
    const eta = new Date(Date.now() + minutes * 60000);
    setLocalEta(eta);
    try {
      await deliveryApi.updateEta(order.id, { estimatedArrival: eta.toISOString() });
    } catch (err) {
      console.error('Error al guardar ETA recalculada en MySQL:', err);
    }
  };

  // Set destination from the order's registered address (geocoding) and persist to MySQL
  const locateRegisteredAddress = async () => {
    // Pedido ya entregado: no se fija destino ni se persiste posición/Destino.
    if (currentStatus === 'ENTREGADO') return;
    const addr = order.deliveryAddress;
    if (!addr || addr.toLowerCase().includes('recojo en tienda')) return;
    setGeocodingStatus('geocoding');
    const coords = await geocodeAddress(addr);
    if (coords) {
      setDestinationCoord(coords);
      setGeocodingStatus('done');
      deliveryApi
        .updateDestination(order.id, { latitude: coords[0], longitude: coords[1] })
        .then(() => computeEtaAndSave(coords))
        .catch(err => {
          console.error('Error al guardar destino geocodificado en MySQL:', err);
          setGpsSyncStatus('error');
        });
    } else {
      setGeocodingStatus('error');
    }
  };

  // Load warehouse location and destination from MySQL
  useEffect(() => {
    let mounted = true;
    companySettingsApi
      .getSettings()
      .then(res => {
        if (!mounted) return;
        const s = res.data;
        if (s.warehouseLatitude != null && s.warehouseLongitude != null) {
          setWarehouseCoord([Number(s.warehouseLatitude), Number(s.warehouseLongitude)]);
        }
      })
      .catch(err => console.error('Error al cargar ubicación del vivero desde MySQL:', err));

    if (order.id) {
      deliveryApi
        .getDeliveryByOrder(order.id)
        .then(res => {
          if (!mounted || !res.data) return;
          const d = res.data;
          if (d.destinationLatitude != null && d.destinationLongitude != null) {
            setDestinationCoord([Number(d.destinationLatitude), Number(d.destinationLongitude)]);
          } else {
            // Sin destino en BD: ubicar automáticamente la dirección registrada del pedido
            locateRegisteredAddress();
          }
        })
        .catch(() => {
          // Aún no existe registro de delivery en BD: se crea geocodificando la dirección
          // Pero si el pedido ya fue entregado, no se fija ni usa la dirección registrada.
          if (currentStatus !== 'ENTREGADO') {
            locateRegisteredAddress();
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [order.id]);

  // Persist latest GPS position to MySQL (throttled every 5s inside the watcher)
  const saveGpsToDb = (data: { lat: number; lng: number; accuracy: number; speed: number }) => {
    if (currentStatus === 'ENTREGADO') return; // pedido entregado: nada que rastrear
    setGpsSyncStatus('saving');
    deliveryApi
      .updateGpsPosition(order.id, { latitude: data.lat, longitude: data.lng, accuracy: data.accuracy, speed: data.speed })
      .then(() => {
        lastGpsSaveRef.current = Date.now();
        setGpsSyncStatus('saved');
      })
      .catch(err => {
        console.error('Error al guardar posición GPS en MySQL:', err);
        setGpsSyncStatus('error');
      });
  };

  const isPickingDestinationRef = useRef<boolean>(false);

  // Leaflet Map Initialization (creates map only once)
  useEffect(() => {
    if (mapProvider !== 'leaflet' || !mapContainerRef.current) return;

    if (!mapRef.current) {
      const initialView: [number, number] = realGpsCoords
        ? [realGpsCoords.lat, realGpsCoords.lng]
        : dbDriverCoord ?? warehouseCoord ?? [-12.0464, -77.0428];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(initialView, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom Leaflet Icons
      const warehouseIcon = L.divIcon({
        className: 'custom-warehouse-icon',
        html: `<div style="background-color:#1b4332; color:#52b788; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 6px 16px rgba(0,0,0,0.3); font-weight:bold; font-size:18px;">🌱</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const customerIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `<div style="background-color:#ef4444; color:white; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 6px 16px rgba(0,0,0,0.3); font-weight:bold; font-size:18px;">📍</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `<div style="background-color:#2d6a4f; color:#ffffff; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 8px 20px rgba(0,0,0,0.4); font-size:20px;" class="animate-bounce">🚚</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const deliveredIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `<div style="background-color:#059669; color:#ffffff; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 8px 20px rgba(0,0,0,0.4); font-size:22px;">📦</div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      });

      // Warehouse marker only when location configured in MySQL
      if (warehouseCoord) {
        L.marker(warehouseCoord, { icon: warehouseIcon })
          .addTo(map)
          .bindPopup(`<b>${companyName}</b><br/>Almacén Central (Vivero)`);
      }

      // Customer destination marker (from deliveries table in MySQL)
      if (destinationCoord) {
        destinationMarkerRef.current = L.marker(destinationCoord, { icon: customerIcon })
          .addTo(map)
          .bindPopup(`<b>${order.customerName}</b><br/>${order.deliveryAddress}`);
      }

      // Driver marker: starts at last position saved in MySQL
      const initialDriverPos = realGpsCoords
        ? [realGpsCoords.lat, realGpsCoords.lng] as [number, number]
        : dbDriverCoord ?? warehouseCoord ?? [-12.0464, -77.0428];
      const driverMarker = L.marker(initialDriverPos, {
        icon: currentStatus === 'ENTREGADO' ? deliveredIcon : driverIcon
      }).addTo(map)
        .bindPopup(
          currentStatus === 'ENTREGADO'
            ? `<b>📦 Pedido Entregado</b><br/>${order.customerName}`
            : `<b>${order.assignedDriverName || 'Repartidor'}</b><br/>En ruta GPS`
        );
      driverMarkerRef.current = driverMarker;

      // Click on map to set customer destination (persisted to MySQL)
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isPickingDestinationRef.current) return;
        const { lat, lng } = e.latlng;
        const newDest: [number, number] = [lat, lng];
        setDestinationCoord(newDest);
        isPickingDestinationRef.current = false;
        setIsPickingDestination(false);

        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.setLatLng(newDest);
        } else {
          destinationMarkerRef.current = L.marker(newDest, { icon: customerIcon })
            .addTo(map)
            .bindPopup(`<b>${order.customerName}</b><br/>${order.deliveryAddress}`);
        }

        deliveryApi
          .updateDestination(order.id, { latitude: lat, longitude: lng })
          .then(() => setGpsSyncStatus('saved'))
          .catch(err => {
            console.error('Error al guardar destino en MySQL:', err);
            setGpsSyncStatus('error');
          });

        // Recalcular distancia (estado) y ETA (persistida en MySQL) con el nuevo destino
        computeEtaAndSave(newDest);
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapProvider, order]);

  // Sync picking mode to ref so the map click handler always sees the latest value
  useEffect(() => {
    isPickingDestinationRef.current = isPickingDestination;
  }, [isPickingDestination]);

  // When order is delivered, driver marker becomes a delivered box icon
  useEffect(() => {
    if (!mapRef.current || !driverMarkerRef.current) return;
    const deliveredIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `<div style="background-color:#059669; color:#ffffff; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 8px 20px rgba(0,0,0,0.4); font-size:22px;">📦</div>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });
    const driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `<div style="background-color:#2d6a4f; color:#ffffff; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 8px 20px rgba(0,0,0,0.4); font-size:20px;" class="animate-bounce">🚚</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
    driverMarkerRef.current.setIcon(currentStatus === 'ENTREGADO' ? deliveredIcon : driverIcon);
    driverMarkerRef.current.bindPopup(
      currentStatus === 'ENTREGADO'
        ? `<b>📦 Pedido Entregado</b><br/>${order.customerName}`
        : `<b>${order.assignedDriverName || 'Repartidor'}</b><br/>En ruta GPS`
    );
  }, [currentStatus, order]);

  // When destination arrives/changes from MySQL, add or move its marker
  useEffect(() => {
    if (!mapRef.current || !destinationCoord) return;
    const map = mapRef.current;
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLatLng(destinationCoord);
    } else {
      const customerIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `<div style="background-color:#ef4444; color:white; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 6px 16px rgba(0,0,0,0.3); font-weight:bold; font-size:18px;">📍</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
      destinationMarkerRef.current = L.marker(destinationCoord, { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${order.customerName}</b><br/>${order.deliveryAddress}`);
    }
  }, [destinationCoord, order]);

  // Real Device Geolocation Watcher
  useEffect(() => {
if (!useRealDeviceGps || currentStatus === 'ENTREGADO') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsError('El navegador o dispositivo no admite lectura de GPS.');
      setUseRealDeviceGps(false);
      return;
    }

    setGpsError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const currentCoord: [number, number] = [latitude, longitude];

        setRealGpsCoords({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          speed: speed ? Math.round(speed * 3.6) : 0
        });

        if (mapRef.current && driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng(currentCoord);
          mapRef.current.panTo(currentCoord);

          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(currentCoord);
            accuracyCircleRef.current.setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle(currentCoord, {
              radius: accuracy,
              color: '#52b788',
              fillColor: '#52b788',
              fillOpacity: 0.2
            }).addTo(mapRef.current);
          }
        }

        // Queue latest position to persist into MySQL (throttled every 5s)
        pendingGpsRef.current = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy), speed: speed ? Math.round(speed * 3.6) : 0 };
        if (Date.now() - lastGpsSaveRef.current > 5000 && pendingGpsRef.current) {
          saveGpsToDb(pendingGpsRef.current);
        }
      },
      (err) => {
        setGpsError('Conectando a sensores GPS... ' + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [useRealDeviceGps, order.id, currentStatus]);

  const handleWhatsApp = () => {
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const formatted = phone.length === 9 ? '51' + phone : phone;
    const msg = `Hola ${order.customerName} 👋\nSoy ${order.assignedDriverName || 'Carlos'}, tu repartidor de ${companyName.toUpperCase()} 🌱.\n\nEstoy en camino con tu pedido ${order.orderNumber} a la dirección: ${order.deliveryAddress}.\n¡Llego pronto!`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkDelivered = () => {
    // Validar distancia y ETA antes de confirmar la entrega
    const warnings: string[] = [];
    const from: [number, number] | null = realGpsCoords
      ? [realGpsCoords.lat, realGpsCoords.lng]
      : dbDriverCoord;

    if (from) {
      if (destinationCoord) {
        const meters = haversineKm(from, destinationCoord) * 1000;
        if (meters > 500) {
          warnings.push(`Estás a ${(meters / 1000).toFixed(1)} km del destino.`);
        } else if (meters > 150) {
          warnings.push(`Aún estás a ${Math.round(meters)} m del destino.`);
        }
      } else {
        warnings.push('El pedido no tiene un destino fijado en el mapa.');
      }
    }

    if (remainingEtaMinutes != null && remainingEtaMinutes > 5) {
      warnings.push(`La llegada estimada es en ${remainingEtaMinutes} min.`);
    }

    if (warnings.length > 0 && !deliveryWarn) {
      setDeliveryWarn(warnings.join(' '));
      return;
    }

    setDeliveryWarn(null);
    setCurrentStatus('ENTREGADO');
    onUpdateStatus(order.id, 'ENTREGADO');
  };

  const saveCurrentPositionToDb = () => {
    if (!realGpsCoords) return;
    saveGpsToDb({
      lat: realGpsCoords.lat,
      lng: realGpsCoords.lng,
      accuracy: realGpsCoords.accuracy,
      speed: realGpsCoords.speed ?? 0
    });
  };

  // Haversine distance (real, from DB coordinates + device GPS)
  const distanceKm =
    destinationCoord && (realGpsCoords || dbDriverCoord)
      ? haversineKm(
          realGpsCoords ? [realGpsCoords.lat, realGpsCoords.lng] : dbDriverCoord!,
          destinationCoord
        )
      : null;

  const remainingEtaMinutes = etaDate
    ? Math.max(0, Math.round((etaDate.getTime() - Date.now()) / 60000))
    : null;

  const statusText =
    currentStatus === 'ENTREGADO'
      ? '¡Pedido Entregado!'
      : realGpsCoords
        ? `${etaDate ? remainingEtaMinutes + ' min restantes (ETA BD)' : 'En ruta'} • ${distanceKm != null ? distanceKm + ' km al destino' : 'Destino: ' + (destinationCoord ? 'en BD' : 'sin fijar')}`
        : dbDriverCoord
          ? `Última posición GPS desde BD: ${dbDriverCoord[0].toFixed(4)}, ${dbDriverCoord[1].toFixed(4)}`
          : warehouseCoord
            ? 'En almacén central (Vivero)'
            : 'Configura la ubicación del vivero en Configuración';

  // Google Maps Embedded Iframe URL with Live Lat,Lng Coordinates or Address Query
  const googleMapsIframeUrl = realGpsCoords
    ? `https://maps.google.com/maps?q=${realGpsCoords.lat},${realGpsCoords.lng}&t=m&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(order.deliveryAddress + ', Lima, Peru')}&t=m&z=15&output=embed`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300 sm:items-center sm:justify-center sm:bg-slate-900/80 sm:backdrop-blur-md sm:p-4">
      <div className="relative flex-1 sm:flex-none sm:w-full sm:max-w-lg sm:h-[92vh] sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl flex flex-col bg-slate-950">

        {/* ================= MAP AREA ================= */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-100">

          {mapProvider === 'leaflet' ? (
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
          ) : (
            <iframe
              title="Google Maps GPS En Vivo Incrustado"
              src={googleMapsIframeUrl}
              className="absolute inset-0 w-full h-full border-0 z-0"
              loading="lazy"
              allowFullScreen
            />
          )}

          {/* Top Gradient Overlay + Glass Header */}
          <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-[#0f2e1f]/95 via-[#0f2e1f]/55 to-transparent px-3.5 pt-3.5 pb-16 pointer-events-none">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-sm truncate">Rastreo GPS</h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/95 rounded-full text-[9px] font-black text-white uppercase tracking-wider flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    En Vivo
                  </span>
                </div>
                <p className="text-[10px] text-white/70 font-medium truncate">
                  {order.orderNumber} • {order.customerName}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 text-white/90 flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live Coordinates Card + Provider Switcher */}
          <div className="absolute top-20 inset-x-3.5 z-20 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 bg-white/95 backdrop-blur-xl rounded-2xl px-3 py-2.5 shadow-2xl border border-white/60 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint flex items-center justify-center shadow-lg flex-shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wide">
                  {realGpsCoords ? 'GPS Dispositivo' : 'Última posición (BD)'}
                </span>
                <span className="text-[11px] font-black text-slate-800 block truncate">
                  {realGpsCoords
                    ? `${realGpsCoords.lat.toFixed(4)}, ${realGpsCoords.lng.toFixed(4)}`
                    : statusText}
                </span>
              </div>
              {realGpsCoords && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black flex-shrink-0">
                  ±{realGpsCoords.accuracy}m
                </span>
              )}
            </div>

            <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl p-1 rounded-2xl shadow-2xl border border-white/60 flex items-center gap-1">
              <button
                onClick={() => setMapProvider('leaflet')}
                className={`p-2 rounded-xl transition-all ${
                  mapProvider === 'leaflet'
                    ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title="Mapa Interactivo"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapProvider('google')}
                className={`p-2 rounded-xl transition-all ${
                  mapProvider === 'google'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title="Google Maps En Vivo"
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* GPS Error Toast */}
          {gpsError && (
            <div className="absolute top-[8.6rem] left-3.5 right-3.5 z-20 bg-amber-500/95 backdrop-blur-xl text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-2xl">
              {gpsError}
            </div>
          )}

          {/* Destination Picker + GPS Sync Status */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 space-y-2">
            {isPickingDestination && (
              <div className="bg-[#1b4332]/95 backdrop-blur-xl text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-2xl border border-vivero-mint/30 text-center">
                <Crosshair className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5 text-vivero-mint" />
                Toca el mapa para fijar el destino del cliente
              </div>
            )}

            {geocodingStatus === 'geocoding' && (
              <div className="bg-[#1b4332]/95 backdrop-blur-xl text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-2xl border border-vivero-mint/30 text-center">
                <Navigation2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5 text-vivero-mint animate-pulse" />
                Ubicando la dirección del pedido en el mapa...
              </div>
            )}

            {geocodingStatus === 'error' && (
              <div className="bg-amber-500/95 backdrop-blur-xl text-white px-3.5 py-2.5 rounded-2xl text-[11px] font-bold shadow-2xl text-center">
                No se pudo ubicar la dirección automáticamente. Fija el destino en el mapa.
              </div>
            )}

            {!isPickingDestination && currentStatus !== 'ENTREGADO' && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setIsPickingDestination(true)}
                  className="px-3.5 py-2.5 bg-white/95 hover:bg-white text-vivero-dark text-[11px] font-extrabold rounded-2xl shadow-2xl border border-white/60 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Crosshair className="w-3.5 h-3.5 text-vivero-primary" />
                  <span>{destinationCoord ? 'Reposicionar destino' : 'Fijar destino'}</span>
                </button>
                <button
                  onClick={locateRegisteredAddress}
                  disabled={geocodingStatus === 'geocoding'}
                  className="px-3.5 py-2.5 bg-white/95 hover:bg-white text-vivero-dark text-[11px] font-extrabold rounded-2xl shadow-2xl border border-white/60 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Navigation2 className="w-3.5 h-3.5 text-vivero-primary" />
                  <span>Usar dirección registrada</span>
                </button>
                {realGpsCoords && (
                  <button
                    onClick={saveCurrentPositionToDb}
                    className="px-3.5 py-2.5 bg-white/95 hover:bg-white text-vivero-dark text-[11px] font-extrabold rounded-2xl shadow-2xl border border-white/60 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-vivero-primary" />
                    <span>Guardar GPS en BD</span>
                  </button>
                )}
              </div>
            )}

            {gpsSyncStatus === 'saving' && (
              <div className="bg-amber-500/95 backdrop-blur-xl text-white p-2.5 rounded-2xl text-[11px] font-extrabold shadow-2xl text-center flex items-center justify-center gap-1.5">
                <Database className="w-3.5 h-3.5 animate-pulse" />
                Guardando posición en MySQL...
              </div>
            )}
            {gpsSyncStatus === 'error' && (
              <div className="bg-rose-600/95 backdrop-blur-xl text-white p-2.5 rounded-2xl text-[11px] font-extrabold shadow-2xl text-center flex items-center justify-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Error al guardar en la base de datos MySQL
              </div>
            )}
          </div>
        </div>

        {/* ================= BOTTOM SHEET ================= */}
        <div className="bg-white rounded-t-[2rem] shadow-[0_-16px_48px_rgba(0,0,0,0.35)] z-20 px-4 pt-2.5 pb-4 sm:pb-5 space-y-3 max-h-[46vh] overflow-y-auto">

          {/* Drag Handle */}
          <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-1" />

          {/* Driver Card */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                    currentStatus === 'ENTREGADO'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                      : 'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint'
                  }`}
                >
                  {currentStatus === 'ENTREGADO' ? (
                    <PackageCheck className="w-6 h-6" />
                  ) : (
                    <Truck className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    currentStatus === 'ENTREGADO' ? 'bg-emerald-600' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-slate-800 text-sm truncate">
                    {order.assignedDriverName || 'Por asignar'}
                  </h4>
                  {currentStatus === 'ENTREGADO' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-md flex items-center gap-0.5 flex-shrink-0">
                      <PackageCheck className="w-3 h-3" /> Entregado
                    </span>
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Repartidor {companyName} •{' '}
                  {currentStatus === 'ENTREGADO' ? 'Pedido entregado' : 'En ruta GPS'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleWhatsApp}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg flex items-center justify-center transition-all active:scale-90"
                title="Enviar WhatsApp al cliente"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <a
                href={`tel:${order.customerPhone}`}
                className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 shadow-sm flex items-center justify-center transition-all active:scale-90"
                title="Llamar al cliente"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Live Trip Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-100 rounded-2xl p-2.5">
              <Timer className="w-4 h-4 text-vivero-primary mb-1" />
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wide">ETA</span>
              <span className="text-[11px] font-black text-slate-800 block">
                {etaDate
                  ? `${etaDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}${
                      remainingEtaMinutes != null ? ` • ${remainingEtaMinutes} min` : ''
                    }`
                  : '—'}
              </span>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-100 rounded-2xl p-2.5">
              <Navigation2 className="w-4 h-4 text-vivero-primary mb-1" />
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wide">Distancia</span>
              <span className="text-[11px] font-black text-slate-800 block">
                {distanceKm != null ? `${distanceKm} km` : '—'}
              </span>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-100 rounded-2xl p-2.5">
              <Gauge className="w-4 h-4 text-vivero-primary mb-1" />
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wide">Velocidad</span>
              <span className="text-[11px] font-black text-slate-800 block">
                {realGpsCoords?.speed ? `${realGpsCoords.speed} km/h` : '—'}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start gap-2.5 bg-vivero-soft/50 rounded-2xl p-3 border border-vivero-mint/20">
            <MapPin className="w-4 h-4 text-vivero-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-vivero-primary block tracking-wide">
                Dirección de entrega
              </span>
              <span className="text-[11px] font-bold text-slate-700 block leading-snug">
                {order.deliveryAddress}
              </span>
            </div>
          </div>

          {/* Warning: confirm delivery early / far from destination */}
          {deliveryWarn && currentStatus !== 'ENTREGADO' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="text-[11px] font-bold text-amber-800 leading-snug">
                ⚠️ {deliveryWarn}
              </p>
              <p className="text-[10px] text-amber-600 font-medium mt-1">
                ¿Seguro que deseas confirmar la entrega de todas formas?
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setDeliveryWarn(null);
                    setCurrentStatus('ENTREGADO');
                    onUpdateStatus(order.id, 'ENTREGADO');
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold shadow-md transition-all active:scale-95"
                >
                  Sí, confirmar entrega
                </button>
                <button
                  onClick={() => setDeliveryWarn(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-extrabold transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleMarkDelivered}
            disabled={currentStatus === 'ENTREGADO'}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              currentStatus === 'ENTREGADO'
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-vivero-mint'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{currentStatus === 'ENTREGADO' ? '¡Pedido Entregado con Éxito!' : 'Confirmar y Marcar como Entregado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
