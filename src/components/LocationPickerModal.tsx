import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CustomSelect } from './CustomSelect';
import { MapPin, X, CheckCircle2, Search, Compass, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ubigeoApi } from '../services/api';

interface LocationPickerModalProps {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onConfirmLocation: (confirmedAddress: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  address,
  onClose,
  onConfirmLocation
}) => {
  if (!isOpen) return null;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentAddress, setCurrentAddress] = useState(address || '');
  const [country, setCountry] = useState('Perú');
  const [department, setDepartment] = useState('Lima');
  const [province, setProvince] = useState('Lima');
  const [district, setDistrict] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: -12.0950,
    lng: -77.0340
  });
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Database Ubigeo State
  const [dbDepartments, setDbDepartments] = useState<{ id: number; code: string; name: string; active: boolean }[]>([]);
  const [dbProvinces, setDbProvinces] = useState<{ id: number; code: string; name: string; departmentId?: number; departmentName?: string; active: boolean }[]>([]);
  const [dbDistricts, setDbDistricts] = useState<{ id: number; code: string; name: string; provinceId?: number; provinceName?: string; departmentId?: number; departmentName?: string; active: boolean }[]>([]);

  // Fetch Ubigeo from MySQL Database when Modal Opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchDbUbigeo = async () => {
      try {
        const [deptRes, provRes, distRes] = await Promise.all([
          ubigeoApi.getDepartments().catch(() => null),
          ubigeoApi.getProvinces().catch(() => null),
          ubigeoApi.getDistricts().catch(() => null)
        ]);
        if (deptRes?.data) setDbDepartments(deptRes.data);
        if (provRes?.data) setDbProvinces(provRes.data);
        if (distRes?.data) setDbDistricts(distRes.data);
      } catch (err) {
        console.error('Error al cargar ubigeo de la base de datos para punto de entrega:', err);
      }
    };
    fetchDbUbigeo();
  }, [isOpen]);

  // Cascading lists dynamically populated from MySQL Database
  const selectedDeptObj = dbDepartments.find(d => d.name.toLowerCase() === department.toLowerCase());

  const availableProvinces = selectedDeptObj
    ? dbProvinces.filter(p => p.departmentId === selectedDeptObj.id || (p.departmentName && p.departmentName.toLowerCase() === selectedDeptObj.name.toLowerCase()))
    : dbProvinces;

  const selectedProvObj = availableProvinces.find(p => p.name.toLowerCase() === province.toLowerCase());

  const availableDistricts = selectedProvObj
    ? dbDistricts.filter(dist => dist.provinceId === selectedProvObj.id || (dist.provinceName && dist.provinceName.toLowerCase() === selectedProvObj.name.toLowerCase()))
    : selectedDeptObj
    ? dbDistricts.filter(dist => dist.departmentId === selectedDeptObj.id || (dist.departmentName && dist.departmentName.toLowerCase() === selectedDeptObj.name.toLowerCase()))
    : dbDistricts;

  // Reverse Geocoding Function (Map Pin -> Address Text)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
        const dist = addr.suburb || addr.city_district || addr.town || addr.city || 'Lima';

        let formatted = `${road}${houseNumber}`;
        if (dist && !formatted.includes(dist)) {
          formatted += formatted ? `, ${dist}` : dist;
        }
        if (!formatted) {
          formatted = data.display_name.split(',').slice(0, 2).join(',').trim();
        }
        if (formatted) {
          setCurrentAddress(formatted);
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Forward Geocoding Function (Address Text + Filters -> Map Pin)
  const geocodeAddress = async (
    streetQuery?: string,
    overrideDept?: string,
    overrideProv?: string,
    overrideDist?: string,
    isFilterChange: boolean = false
  ) => {
    const mainAddress = streetQuery !== undefined ? streetQuery : currentAddress;
    const activeDept = overrideDept !== undefined ? overrideDept : department;
    const activeProv = overrideProv !== undefined ? overrideProv : province;
    const activeDist = overrideDist !== undefined ? overrideDist : district;

    const cleanStreet = mainAddress ? mainAddress.trim() : '';
    const cleanDist = activeDist ? activeDist.trim() : '';
    const cleanProv = activeProv ? activeProv.trim() : '';
    const cleanDept = activeDept ? activeDept.trim() : '';
    const cleanCountry = country || 'Perú';

    setIsSearching(true);
    try {
      let query = '';
      let targetZoom = 15;

      if (isFilterChange) {
        // Build clean query centered specifically on the selected location filter
        const locationParts: string[] = [];
        if (cleanDist) {
          locationParts.push(cleanDist);
          targetZoom = 15;
        } else if (cleanProv) {
          locationParts.push(cleanProv);
          targetZoom = 13;
        } else if (cleanDept) {
          locationParts.push(cleanDept);
          targetZoom = 11;
        }

        if (cleanProv && !locationParts.includes(cleanProv)) locationParts.push(cleanProv);
        if (cleanDept && !locationParts.includes(cleanDept)) locationParts.push(cleanDept);
        locationParts.push(cleanCountry);

        query = locationParts.join(', ');
      } else {
        // Build full address search query
        const partsSet = new Set<string>();
        if (cleanStreet) partsSet.add(cleanStreet);
        if (cleanDist) partsSet.add(cleanDist);
        if (cleanProv) partsSet.add(cleanProv);
        if (cleanDept) partsSet.add(cleanDept);
        partsSet.add(cleanCountry);

        query = Array.from(partsSet).join(', ');
      }

      // Tier 1: Primary search query
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pe&limit=3`;
      let res = await fetch(searchUrl);
      let data = await res.json();

      // Tier 2: Fallback query centered on District / Province / Department
      if ((!data || data.length === 0) && (cleanDist || cleanProv || cleanDept)) {
        const fallbackParts: string[] = [];
        if (cleanDist) fallbackParts.push(cleanDist);
        else if (cleanProv) fallbackParts.push(cleanProv);
        else if (cleanDept) fallbackParts.push(cleanDept);

        if (cleanDept && !fallbackParts.includes(cleanDept)) fallbackParts.push(cleanDept);
        fallbackParts.push(cleanCountry);

        const fallbackQuery = fallbackParts.join(', ');
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&countrycodes=pe&limit=3`);
        data = await res.json();
      }

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setSelectedCoords({ lat, lng: lon });

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], targetZoom);
          markerRef.current.setLatLng([lat, lon]);
          markerRef.current.openPopup();
        }

        if (isFilterChange) {
          const displayAddr = [cleanDist, cleanProv, cleanDept].filter(Boolean).join(', ');
          if (displayAddr) {
            setCurrentAddress(displayAddr);
          }
        }
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handlers for cascading dropdowns
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const deptObj = dbDepartments.find(d => d.name === newDept);
    const deptProvs = deptObj
      ? dbProvinces.filter(p => p.departmentId === deptObj.id || (p.departmentName && p.departmentName.toLowerCase() === deptObj.name.toLowerCase()))
      : dbProvinces;
    const firstProv = deptProvs.length > 0 ? deptProvs[0].name : '';
    setProvince(firstProv);
    setDistrict('');
    geocodeAddress('', newDept, firstProv, '', true);
  };

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    setDistrict('');
    geocodeAddress('', department, newProv, '', true);
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    geocodeAddress('', department, province, newDist, true);
  };

  // Initialize Map & Auto-Detect Ubigeo from Address String
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = -12.0950;
    const initialLng = -77.0340;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background-color: #1b4332;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        ">
          <div style="
            width: 14px;
            height: 14px;
            background-color: #52b788;
            border-radius: 50%;
            margin: auto;
          "></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    marker.bindPopup(`<b>Punto de Entrega</b><br/>${currentAddress || 'Ubicación seleccionada'}`).openPopup();

    // Map click moves marker and reverse geocodes
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Marker drag end reverse geocodes
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setSelectedCoords({ lat: position.lat, lng: position.lng });
      reverseGeocode(position.lat, position.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Smart Ubigeo Detection from address string
    if (address && address.trim()) {
      const lowerAddr = address.toLowerCase();
      let matchedDist = '';
      let matchedProv = '';
      let matchedDept = '';

      for (const dist of dbDistricts) {
        if (lowerAddr.includes(dist.name.toLowerCase())) {
          matchedDist = dist.name;
          matchedProv = dist.provinceName || '';
          matchedDept = dist.departmentName || '';
          break;
        }
      }

      if (matchedDist) {
        setDepartment(matchedDept);
        setProvince(matchedProv);
        setDistrict(matchedDist);
        geocodeAddress(address, matchedDept, matchedProv, matchedDist);
      } else {
        geocodeAddress(address);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update popup when address changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPopupContent(`<b>Punto de Entrega</b><br/>${currentAddress || 'Ubicación seleccionada'}`);
    }
  }, [currentAddress]);

  // Handle GPS location click
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por su navegador.');
      return;
    }

    setIsLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setIsLoadingGps(false);
        const { latitude, longitude } = position.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.openPopup();
        }
        reverseGeocode(latitude, longitude);
      },
      () => {
        setIsLoadingGps(false);
        alert('No se pudo obtener su ubicación actual.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress(currentAddress, department, province, district);
  };

  const handleConfirm = () => {
    onConfirmLocation(currentAddress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-[92vh] sm:h-[88vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vivero-soft text-vivero-dark flex items-center justify-center">
              <MapPin className="w-5 h-5 text-vivero-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Validar Punto de Entrega</h3>
              <p className="text-xs text-slate-400">Ubica la dirección exacta filtrando por Departamento, Provincia y Distrito.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Input & Cascading Ubigeo Filter Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-100 space-y-2.5 z-10">
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={currentAddress}
                  onChange={e => setCurrentAddress(e.target.value)}
                  placeholder="Calle, avenida, jirón o número..."
                  className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary shadow-2xs"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 text-vivero-primary animate-spin" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 bg-vivero-primary text-vivero-mint hover:bg-vivero-dark rounded-xl text-xs font-extrabold transition-colors shadow-2xs flex-shrink-0"
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs flex-shrink-0 ${
                  showAdvancedFilters || district || province
                    ? 'bg-vivero-soft text-vivero-dark border-vivero-primary/40 font-extrabold'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="Filtros por Departamento, Provincia y Distrito"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ubigeo</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLoadingGps}
                className="px-2.5 py-2 bg-white hover:bg-vivero-soft border border-slate-200 text-vivero-dark rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs flex-shrink-0"
                title="Usar GPS actual"
              >
                {isLoadingGps ? (
                  <div className="w-3.5 h-3.5 border-2 border-vivero-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Compass className="w-3.5 h-3.5 text-vivero-primary" />
                )}
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Cascading Location Filters Bar (Departamento -> Provincia -> Distrito) */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                <div>
                  <CustomSelect
                    label="País"
                    value={country}
                    onChange={val => setCountry(val)}
                    options={[{ value: 'Perú', label: '🇵🇪 Perú' }]}
                    size="sm"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Departamento"
                    value={department}
                    onChange={val => handleDepartmentChange(val)}
                    options={[
                      { value: '', label: '(Todos)' },
                      ...dbDepartments.map(d => ({ value: d.name, label: d.name }))
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Provincia"
                    value={province}
                    onChange={val => handleProvinceChange(val)}
                    options={[
                      { value: '', label: '(Todas las provincias)' },
                      ...availableProvinces.map(p => ({ value: p.name, label: p.name }))
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Distrito"
                    value={district}
                    onChange={val => handleDistrictChange(val)}
                    options={[
                      { value: '', label: '(Todos los distritos)' },
                      ...availableDistricts.map(d => ({ value: d.name, label: d.name }))
                    ]}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </form>

          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            💡 <span>Toca cualquier punto del mapa o mueve el marcador para fijar la dirección exacta.</span>
          </p>
        </div>

        {/* Interactive Leaflet Map */}
        <div className="flex-1 relative bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Address Badge on Map */}
          <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-10 max-w-sm bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-black text-slate-800">Dirección Marcada</span>
              </div>
              {isSearching && (
                <span className="text-[10px] font-bold text-vivero-primary animate-pulse">Buscando...</span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-extrabold truncate">{currentAddress || 'Selecciona un punto en el mapa'}</p>
            <p className="text-[10px] text-slate-400 font-bold">
              GPS: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Punto de Entrega</span>
          </button>
        </div>
      </div>
    </div>
  );
};
