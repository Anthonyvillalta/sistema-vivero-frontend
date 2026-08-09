import React, { useState, useEffect } from 'react';
import { CustomSelect } from '../components/CustomSelect';
import { ubigeoApi, deliveryMethodApi, productApi, companySettingsApi } from '../services/api';
import { LeavesLoader } from '../components/LeavesLoader';
import { DeliveryMethod, Product, getProductPricing } from '../types';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Settings,
  MapPin,
  Building2,
  Phone,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Globe,
  Save,
  Printer,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  Loader2,
  Truck,
  Tag,
  Percent,
  RefreshCw,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { companyName, companyRuc, companyPhone, companyAddress, updateCompanySettings } = useCompanySettings();

  const [inputCompName, setInputCompName] = useState(companyName);
  const [inputCompRuc, setInputCompRuc] = useState(companyRuc);
  const [inputCompPhone, setInputCompPhone] = useState(companyPhone);
  const [inputCompAddress, setInputCompAddress] = useState(companyAddress);
  const [inputWarehouseLat, setInputWarehouseLat] = useState('');
  const [inputWarehouseLng, setInputWarehouseLng] = useState('');
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  useEffect(() => {
    setInputCompName(companyName);
    setInputCompRuc(companyRuc);
    setInputCompPhone(companyPhone);
    setInputCompAddress(companyAddress);
  }, [companyName, companyRuc, companyPhone, companyAddress]);

  const handleSaveCompanyData = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(inputWarehouseLat);
    const lng = parseFloat(inputWarehouseLng);
    updateCompanySettings({
      companyName: inputCompName.trim() || 'Vivero',
      companyRuc: inputCompRuc.trim(),
      companyPhone: inputCompPhone.trim(),
      companyAddress: inputCompAddress.trim()
    });
    try {
      await companySettingsApi.updateSettings({
        companyName: inputCompName.trim() || 'Vivero',
        companyRuc: inputCompRuc.trim(),
        companyPhone: inputCompPhone.trim(),
        companyAddress: inputCompAddress.trim(),
        warehouseLatitude: !isNaN(lat) ? lat : undefined,
        warehouseLongitude: !isNaN(lng) ? lng : undefined
      });
    } catch (err) {
      console.error('Error al guardar configuración de empresa en MySQL:', err);
    }
    setCompanySaveSuccess(true);
    setTimeout(() => setCompanySaveSuccess(false), 3000);
  };

  // IA & Scanner (Gemini API Key)
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiKeyLoading, setGeminiKeyLoading] = useState(true);
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [geminiKeyError, setGeminiKeyError] = useState<string | null>(null);

  useEffect(() => {
    companySettingsApi
      .getSettings()
      .then(res => {
        if (res.data?.geminiApiKey) setGeminiApiKey(res.data.geminiApiKey);
        if (res.data?.warehouseLatitude != null) setInputWarehouseLat(String(res.data.warehouseLatitude));
        if (res.data?.warehouseLongitude != null) setInputWarehouseLng(String(res.data.warehouseLongitude));
      })
      .catch(err => console.error('Error al cargar configuración de IA:', err))
      .finally(() => setGeminiKeyLoading(false));
  }, []);

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiKeyError(null);
    setGeminiKeySaved(false);
    try {
      await companySettingsApi.updateSettings({ geminiApiKey: geminiApiKey.trim() });
      setGeminiKeySaved(true);
      setTimeout(() => setGeminiKeySaved(false), 3000);
    } catch (err: any) {
      setGeminiKeyError(err?.response?.data?.message || 'Error al guardar la clave API de Gemini.');
    }
  };
  const [activeSection, setActiveTab] = useState<'ubigeo' | 'general' | 'whatsapp' | 'delivery' | 'discounts' | 'taxes' | 'ai'>('ubigeo');
  const [ubigeoSubTab, setUbigeoSubTab] = useState<'departments' | 'provinces' | 'districts'>('departments');
  const [mobileSubScreen, setMobileSubScreen] = useState<'main' | 'ubigeo' | 'general' | 'whatsapp' | 'delivery' | 'discounts' | 'taxes' | 'ai'>('main');

  // Product Discounts Management State
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [loadingDiscountProducts, setLoadingDiscountProducts] = useState(false);
  const [discountSearch, setDiscountSearch] = useState('');
  const [discountCatFilter, setDiscountCatFilter] = useState('TODOS');
  const [discountStatusFilter, setDiscountStatusFilter] = useState<'ALL' | 'WITH_DISCOUNT' | 'NO_DISCOUNT'>('ALL');

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [discountMode, setDiscountMode] = useState<'PERCENT' | 'PROMO_PRICE'>('PERCENT');
  const [inputOriginalPrice, setInputOriginalPrice] = useState('0.00');
  const [inputDiscountPercentage, setInputDiscountPercentage] = useState('0');
  const [inputPromoPrice, setInputPromoPrice] = useState('0.00');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const fetchDiscountProducts = async () => {
    setLoadingDiscountProducts(true);
    try {
      const res = await productApi.getAllProducts().catch(() => null);
      if (res?.data && res.data.length > 0) {
        setDiscountProducts(res.data);
      } else {
        setDiscountProducts([]);
      }
    } catch (err) {
      console.error('Error al cargar productos para descuentos:', err);
      setDiscountProducts([]);
    } finally {
      setLoadingDiscountProducts(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'discounts') {
      fetchDiscountProducts();
    }
    const handleBackendOnline = () => {
      if (activeSection === 'discounts') {
        fetchDiscountProducts();
      }
      fetchDeliveryMethods();
      fetchUbigeoData();
    };
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, [activeSection]);

  const openDiscountModal = (prod: Product) => {
    setSelectedProductForDiscount(prod);
    const pricing = getProductPricing(prod);

    setInputOriginalPrice(pricing.basePrice.toFixed(2));
    setInputDiscountPercentage(pricing.discountPercentage.toString());
    setInputPromoPrice(pricing.sellingPrice.toFixed(2));
    setDiscountMode('PERCENT');
    setDiscountError(null);
    setIsDiscountModalOpen(true);
  };

  const handlePercentageChange = (valStr: string) => {
    setInputDiscountPercentage(valStr);
    const pct = parseFloat(valStr) || 0;
    const orig = parseFloat(inputOriginalPrice) || 0;
    if (orig > 0) {
      const calcPromo = Math.max(0, orig * (1 - pct / 100));
      setInputPromoPrice(calcPromo.toFixed(2));
    }
  };

  const handlePromoPriceChange = (valStr: string) => {
    setInputPromoPrice(valStr);
    const promo = parseFloat(valStr) || 0;
    const orig = parseFloat(inputOriginalPrice) || 0;
    if (orig > 0 && promo < orig) {
      const calcPct = Math.round(((orig - promo) / orig) * 100);
      setInputDiscountPercentage(calcPct.toString());
    } else {
      setInputDiscountPercentage('0');
    }
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForDiscount) return;

    setSavingDiscount(true);
    setDiscountError(null);

    const pricing = getProductPricing(selectedProductForDiscount);
    const basePrice = parseFloat(inputOriginalPrice) || pricing.basePrice;
    let promoPrice = parseFloat(inputPromoPrice) || basePrice;
    let pct = parseInt(inputDiscountPercentage) || 0;

    if (pct === 0 && basePrice > promoPrice) {
      pct = Math.round(((basePrice - promoPrice) / basePrice) * 100);
    } else if (pct > 0 && (promoPrice === basePrice || promoPrice <= 0)) {
      promoPrice = basePrice * (1 - pct / 100);
    }

    if (promoPrice > basePrice) {
      setDiscountError('El precio con descuento no puede ser mayor al precio original.');
      setSavingDiscount(false);
      return;
    }

    const isDiscounted = pct > 0 || promoPrice < basePrice;
    const finalDiscountPercentage = isDiscounted ? pct : 0;

    const updatedDiscountProduct: Product = {
      ...selectedProductForDiscount,
      price: basePrice,
      originalPrice: undefined,
      discountPercentage: finalDiscountPercentage
    };

    // 1. Update React state immediately! MAINTAIN BASE PRICE INTACT!
    setDiscountProducts(prev =>
      prev.map(p =>
        p.id === selectedProductForDiscount.id
          ? {
              ...p,
              price: basePrice,
              originalPrice: undefined,
              discountPercentage: finalDiscountPercentage
            }
          : p
      )
    );

    try {
      // 3. Persist update in MySQL database via API
      const res = await productApi.updateProduct(selectedProductForDiscount.id, {
        code: selectedProductForDiscount.code,
        name: selectedProductForDiscount.name,
        variety: selectedProductForDiscount.variety,
        brand: selectedProductForDiscount.brand,
        description: selectedProductForDiscount.description,
        categoryId: selectedProductForDiscount.categoryId,
        unitType: selectedProductForDiscount.unitType,
        price: basePrice, // <--- MAINTAIN BASE PRICE ASSIGNED!
        originalPrice: undefined,
        discountPercentage: finalDiscountPercentage,
        costPrice: selectedProductForDiscount.costPrice,
        stock: selectedProductForDiscount.stock,
        minStock: selectedProductForDiscount.minStock,
        imageUrl: selectedProductForDiscount.imageUrl
      });

      if (res?.data) {
        setDiscountProducts(prev =>
          prev.map(p => (p.id === res.data.id ? { ...res.data, price: basePrice, originalPrice: undefined, discountPercentage: finalDiscountPercentage } : p))
        );
      }
    } catch (err: any) {
      console.error('Error al guardar descuento en MySQL:', err);
    } finally {
      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      window.dispatchEvent(new CustomEvent('vivero_cart_prices_updated', { detail: { product: updatedDiscountProduct } }));
      setIsDiscountModalOpen(false);
      setSavingDiscount(false);
    }
  };

  const handleRemoveDiscount = async (prod: Product) => {
    const pricing = getProductPricing(prod);
    const basePrice = pricing.basePrice;

    const updatedNoDiscountProduct: Product = {
      ...prod,
      price: basePrice,
      originalPrice: undefined,
      discountPercentage: 0
    };

    // 1. Update React state immediately for instant UI response!
    setDiscountProducts(prev =>
      prev.map(p =>
        p.id === prod.id
          ? {
              ...p,
              price: basePrice,
              originalPrice: undefined,
              discountPercentage: 0
            }
          : p
      )
    );

    try {
      // 3. Persist update in MySQL database via API
      const res = await productApi.updateProduct(prod.id, {
        code: prod.code,
        name: prod.name,
        variety: prod.variety,
        brand: prod.brand,
        description: prod.description,
        categoryId: prod.categoryId,
        unitType: prod.unitType,
        price: basePrice,
        originalPrice: undefined,
        discountPercentage: 0,
        costPrice: prod.costPrice,
        stock: prod.stock,
        minStock: prod.minStock,
        imageUrl: prod.imageUrl
      });

      if (res?.data) {
        setDiscountProducts(prev =>
          prev.map(p => (p.id === res.data.id ? { ...res.data, price: basePrice, originalPrice: undefined, discountPercentage: 0 } : p))
        );
      }
    } catch (err) {
      console.error('Error al quitar descuento:', err);
    } finally {
      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      window.dispatchEvent(new CustomEvent('vivero_cart_prices_updated', { detail: { product: updatedNoDiscountProduct } }));
      if (isDiscountModalOpen) setIsDiscountModalOpen(false);
    }
  };

  // Delivery Methods Database CRUD State
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(false);
  const [isDeliveryMethodModalOpen, setIsDeliveryMethodModalOpen] = useState(false);
  const [editingDeliveryMethod, setEditingDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [dmSearch, setDmSearch] = useState('');
  const [dmTypeFilter, setDmTypeFilter] = useState<'ALL' | 'DELIVERY' | 'STORE'>('ALL');

  // Modal form fields
  const [dmName, setDmName] = useState('');
  const [dmType, setDmType] = useState<'DELIVERY' | 'STORE'>('DELIVERY');
  const [dmPrice, setDmPrice] = useState('15.00');
  const [dmEstimatedTime, setDmEstimatedTime] = useState('24 a 48 horas');
  const [dmDescription, setDmDescription] = useState('');
  const [savingDm, setSavingDm] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);

  const fetchDeliveryMethods = async () => {
    setLoadingDeliveryMethods(true);
    try {
      const res = await deliveryMethodApi.getAll();
      if (res.data) setDeliveryMethods(res.data);
    } catch (err) {
      console.error('Error al cargar métodos de entrega desde MySQL:', err);
    } finally {
      setLoadingDeliveryMethods(false);
    }
  };

  useEffect(() => {
    fetchDeliveryMethods();
  }, []);

  const openCreateDmModal = () => {
    setEditingDeliveryMethod(null);
    setDmName('');
    setDmType('DELIVERY');
    setDmPrice('15.00');
    setDmEstimatedTime('24 a 48 horas');
    setDmDescription('');
    setDmError(null);
    setIsDeliveryMethodModalOpen(true);
  };

  const openEditDmModal = (method: DeliveryMethod) => {
    setEditingDeliveryMethod(method);
    setDmName(method.name);
    setDmType(method.type || 'DELIVERY');
    setDmPrice(method.price.toString());
    setDmEstimatedTime(method.estimatedTime || '');
    setDmDescription(method.description || '');
    setDmError(null);
    setIsDeliveryMethodModalOpen(true);
  };

  const handleSaveDmModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmName.trim()) {
      setDmError('Por favor ingresa el nombre del método de entrega.');
      return;
    }

    setSavingDm(true);
    setDmError(null);

    const payload = {
      name: dmName.trim(),
      type: dmType,
      price: parseFloat(dmPrice) || 0,
      estimatedTime: dmEstimatedTime.trim(),
      description: dmDescription.trim(),
      active: editingDeliveryMethod ? editingDeliveryMethod.active : true
    };

    try {
      if (editingDeliveryMethod) {
        await deliveryMethodApi.update(editingDeliveryMethod.id, payload);
      } else {
        await deliveryMethodApi.create(payload);
      }
      await fetchDeliveryMethods();
      setIsDeliveryMethodModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar método de entrega en MySQL:', err);
      setDmError('No se pudo guardar el método de entrega en la base de datos MySQL.');
    } finally {
      setSavingDm(false);
    }
  };

  const handleToggleDmStatus = async (id: number) => {
    try {
      await deliveryMethodApi.toggleStatus(id);
      await fetchDeliveryMethods();
    } catch (err) {
      console.error('Error al cambiar estado del método de entrega:', err);
    }
  };

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState('');

  // Selected filter parents for sub-tabs
  const [filterDept, setFilterDept] = useState('Lima');
  const [filterProv, setFilterProv] = useState('Lima');

  // API Ubigeo State (strictly loaded from DB)
  const [departments, setDepartments] = useState<{ id: number; code: string; name: string; active: boolean }[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; code: string; name: string; departmentId?: number; departmentName: string; active: boolean }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; code: string; name: string; provinceId?: number; provinceName: string; departmentId?: number; departmentName: string; active: boolean }[]>([]);
  const [loadingUbigeo, setLoadingUbigeo] = useState(false);
  const [ubigeoError, setUbigeoError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsMapModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'department' | 'province' | 'district'>('department');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [savingUbigeo, setSavingUbigeo] = useState(false);

  // Excel Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importParsedItems, setImportParsedItems] = useState<Array<{
    departmentCode: string;
    departmentName: string;
    provinceCode?: string;
    provinceName?: string;
    districtCode?: string;
    districtName?: string;
  }>>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDeptId, setFormDeptId] = useState<number | null>(null);
  const [formProvId, setFormProvId] = useState<number | null>(null);

  const fetchUbigeoData = async () => {
    setLoadingUbigeo(true);
    setUbigeoError(null);
    try {
      const [deptRes, provRes, distRes] = await Promise.all([
        ubigeoApi.getDepartments(),
        ubigeoApi.getProvinces(),
        ubigeoApi.getDistricts()
      ]);
      setDepartments(deptRes.data || []);
      setProvinces(provRes.data || []);
      setDistricts(distRes.data || []);
    } catch (err: any) {
      console.error('Error al cargar datos de Ubigeo desde la base de datos:', err);
      setUbigeoError('No se pudieron cargar los datos desde la base de datos. Verifica que el servicio backend esté activo.');
    } finally {
      setLoadingUbigeo(false);
    }
  };

  useEffect(() => {
    fetchUbigeoData();
  }, []);

  const openCreateModal = (type: 'department' | 'province' | 'district') => {
    setModalType(type);
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setModalError(null);
    setSavingUbigeo(false);

    const defaultDept = departments.find(d => d.name.toLowerCase() === (filterDept || 'lima').toLowerCase()) || departments[0];
    setFormDeptId(defaultDept ? defaultDept.id : null);

    const defaultProv = provinces.find(p => p.name.toLowerCase() === (filterProv || 'lima').toLowerCase()) || provinces[0];
    setFormProvId(defaultProv ? defaultProv.id : null);

    setIsMapModalOpen(true);
  };

  const openEditModal = (type: 'department' | 'province' | 'district', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setModalError(null);
    setSavingUbigeo(false);
    setFormDeptId(item.departmentId || (departments.find(d => d.name === item.departmentName)?.id ?? null));
    setFormProvId(item.provinceId || (provinces.find(p => p.name === item.provinceName)?.id ?? null));
    setIsMapModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = formCode.trim();
    const name = formName.trim();
    if (!code || !name) {
      setModalError('Por favor ingrese tanto el código ubigeo como el nombre.');
      return;
    }

    setSavingUbigeo(true);
    setModalError(null);

    try {
      if (modalType === 'department') {
        if (editingItem) {
          await ubigeoApi.updateDepartment(editingItem.id, {
            code,
            name,
            active: editingItem.active
          });
        } else {
          await ubigeoApi.createDepartment({ code, name });
        }
      } else if (modalType === 'province') {
        const targetDeptId = formDeptId || (departments.length > 0 ? departments[0].id : 1);
        if (editingItem) {
          await ubigeoApi.updateProvince(editingItem.id, {
            code,
            name,
            departmentId: targetDeptId,
            active: editingItem.active
          });
        } else {
          await ubigeoApi.createProvince({
            code,
            name,
            departmentId: targetDeptId
          });
        }
      } else if (modalType === 'district') {
        const targetProvId = formProvId || (provinces.length > 0 ? provinces[0].id : 1);
        if (editingItem) {
          await ubigeoApi.updateDistrict(editingItem.id, {
            code,
            name,
            provinceId: targetProvId,
            active: editingItem.active
          });
        } else {
          await ubigeoApi.createDistrict({
            code,
            name,
            provinceId: targetProvId
          });
        }
      }
      await fetchUbigeoData();
      setIsMapModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar en MySQL:', err);
      let friendlyMessage = 'No se pudo guardar el registro en la base de datos MySQL.';
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        friendlyMessage = 'Acceso denegado (Error 403/401). Verifica los permisos o vuelve a iniciar sesión.';
      } else if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          friendlyMessage = data.message;
        } else if (data.validationErrors) {
          friendlyMessage = Object.values(data.validationErrors).join('. ');
        } else if (data.error) {
          friendlyMessage = data.error;
        }
      } else if (err.message) {
        if (err.message.includes('Network Error')) {
          friendlyMessage = 'No hay conexión con el servicio Backend (puerto 8080). Asegúrate de iniciar el backend antes de guardar.';
        } else {
          friendlyMessage = err.message;
        }
      }

      setModalError(friendlyMessage);
    } finally {
      setSavingUbigeo(false);
    }
  };

  const handleToggleStatus = async (type: 'department' | 'province' | 'district', id: number) => {
    try {
      if (type === 'department') {
        await ubigeoApi.toggleDepartmentStatus(id);
      } else if (type === 'province') {
        await ubigeoApi.toggleProvinceStatus(id);
      } else if (type === 'district') {
        await ubigeoApi.toggleDistrictStatus(id);
      }
      await fetchUbigeoData();
    } catch (err: any) {
      console.error('Error al cambiar estado en la base de datos:', err);
      alert('No se pudo actualizar el estado en la base de datos.');
    }
  };

  const handleDownloadExcelTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [
      {
        Codigo_Departamento: '15',
        Nombre_Departamento: 'Lima',
        Codigo_Provincia: '1501',
        Nombre_Provincia: 'Lima',
        Codigo_Distrito: '150122',
        Nombre_Distrito: 'Miraflores'
      },
      {
        Codigo_Departamento: '15',
        Nombre_Departamento: 'Lima',
        Codigo_Provincia: '1501',
        Nombre_Provincia: 'Lima',
        Codigo_Distrito: '150131',
        Nombre_Distrito: 'San Isidro'
      },
      {
        Codigo_Departamento: '07',
        Nombre_Departamento: 'Callao',
        Codigo_Provincia: '0701',
        Nombre_Provincia: 'Callao',
        Codigo_Distrito: '070102',
        Nombre_Distrito: 'Bellavista'
      },
      {
        Codigo_Departamento: '04',
        Nombre_Departamento: 'Arequipa',
        Codigo_Provincia: '0401',
        Nombre_Provincia: 'Arequipa',
        Codigo_Distrito: '040101',
        Nombre_Distrito: 'Arequipa'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ubigeo_Plantilla');
    XLSX.writeFile(workbook, 'Plantilla_Ubigeo_Vivero.xlsx');
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          setImportErrorMsg('El archivo Excel seleccionado está vacío.');
          return;
        }

        const parsedItems = rawJson.map((row) => {
          const keys = Object.keys(row);
          const getVal = (...possibleHeaders: string[]) => {
            for (const h of possibleHeaders) {
              const matchedKey = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === h.toLowerCase().replace(/[^a-z0-9]/g, ''));
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const deptCode = getVal('Codigo_Departamento', 'codigo_departamento', 'cod_dept', 'cod_departamento', 'departamento_codigo');
          const deptName = getVal('Nombre_Departamento', 'nombre_departamento', 'departamento_nombre', 'departamento', 'dept_nombre');
          const provCode = getVal('Codigo_Provincia', 'codigo_provincia', 'cod_prov', 'cod_provincia', 'provincia_codigo');
          const provName = getVal('Nombre_Provincia', 'nombre_provincia', 'provincia_nombre', 'provincia', 'prov_nombre');
          const distCode = getVal('Codigo_Distrito', 'codigo_distrito', 'cod_dist', 'cod_distrito', 'distrito_codigo');
          const distName = getVal('Nombre_Distrito', 'nombre_distrito', 'distrito_nombre', 'distrito', 'dist_nombre');

          return {
            departmentCode: deptCode.padStart(2, '0'),
            departmentName: deptName || `Departamento ${deptCode}`,
            provinceCode: provCode ? provCode.padStart(4, '0') : undefined,
            provinceName: provName || undefined,
            districtCode: distCode ? distCode.padStart(6, '0') : undefined,
            districtName: distName || undefined
          };
        }).filter(item => item.departmentCode && item.departmentCode !== '00');

        if (parsedItems.length === 0) {
          setImportErrorMsg('No se pudieron reconocer columnas válidas de Ubigeo. Usa la plantilla de ejemplo.');
          return;
        }

        setImportParsedItems(parsedItems);
        setIsImportModalOpen(true);
      } catch (err) {
        console.error('Error al leer Excel:', err);
        setImportErrorMsg('No se pudo procesar el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmBulkImport = async () => {
    if (importParsedItems.length === 0) return;

    setIsImporting(true);
    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const res = await ubigeoApi.bulkImport(importParsedItems);
      const data = res.data;
      setImportSuccessMsg(`✅ ¡Importación exitosa a MySQL! Se procesaron ${data.importedDepartments} Departamentos, ${data.importedProvinces} Provincias y ${data.importedDistricts} Distritos.`);
      await fetchUbigeoData();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      console.error('Error al importar masivamente:', err);
      let errorMsg = 'Error al procesar la importación masiva en MySQL.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setImportErrorMsg(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered lists for Ubigeo table/card rendering
  const currentSearch = (searchQuery || mobileSearch).toLowerCase();

  const filteredDepartments = departments.filter(d => d.name.toLowerCase().includes(currentSearch) || d.code.includes(currentSearch));
  
  const filteredProvinces = provinces.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(currentSearch) || p.code.includes(currentSearch);
    const matchesDept = !filterDept || (p.departmentName && p.departmentName.toLowerCase() === filterDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const filteredDistricts = districts.filter(dis => {
    const matchesSearch = dis.name.toLowerCase().includes(currentSearch) || dis.code.includes(currentSearch);
    const matchesProv = !filterProv || (dis.provinceName && dis.provinceName.toLowerCase() === filterProv.toLowerCase());
    return matchesSearch && matchesProv;
  });

  // Mobile Settings Menu Items Definitions & Search Filter Logic
  const allSettingItems = [
    {
      id: 'empresa',
      section: 'general' as const,
      group: 'Vivero & Empresa',
      title: 'Datos de la Empresa',
      subtitle: companyName,
      icon: Building2,
      iconBg: 'bg-blue-500',
      keywords: ['empresa', 'vivero', 'nombre', 'ruc', 'razon social', 'general', 'datos']
    },
    {
      id: 'igv',
      section: 'taxes' as const,
      group: 'Vivero & Empresa',
      title: 'Impuestos e IGV',
      subtitle: '18% IGV • Soles (S/)',
      icon: Printer,
      iconBg: 'bg-amber-500',
      keywords: ['igv', 'impuestos', 'tasa', 'moneda', 'soles', 'dolares', 'facturacion', 'tributos']
    },
    {
      id: 'ubigeo',
      section: 'ubigeo' as const,
      subTab: 'departments' as const,
      group: 'Territorio & Ubigeo',
      title: 'Ubigeo & Territorio',
      subtitle: 'Departamentos, Provincias y Distritos',
      icon: MapPin,
      iconBg: 'bg-emerald-500',
      keywords: ['ubigeo', 'territorio', 'departamento', 'provincia', 'distrito', 'lima', 'callao', 'bellavista']
    },
    {
      id: 'delivery',
      section: 'delivery' as const,
      group: 'Logística & Despacho',
      title: 'Métodos de Entrega',
      subtitle: 'Configuración Carrito',
      icon: Truck,
      iconBg: 'bg-emerald-600',
      keywords: ['delivery', 'entrega', 'metodo', 'envio', 'tarifa', 'recojo', 'tienda', 'carrito']
    },
    {
      id: 'discounts',
      section: 'discounts' as const,
      group: 'Promociones & Ventas',
      title: 'Descuentos de Productos',
      subtitle: 'Configuración de Ofertas',
      icon: Tag,
      iconBg: 'bg-rose-500',
      keywords: ['descuento', 'descuentos', 'oferta', 'promocion', 'precio', 'porcentaje', 'rebaja', 'productos']
    },
    {
      id: 'whatsapp',
      section: 'whatsapp' as const,
      group: 'Integraciones',
      title: 'WhatsApp Business',
      subtitle: 'Conectado',
      icon: Phone,
      iconBg: 'bg-green-600',
      keywords: ['whatsapp', 'business', 'chat', 'api', 'mensaje', 'confirmacion', 'telefono', 'celular']
    },
    {
      id: 'ai',
      section: 'ai' as const,
      group: 'Integraciones',
      title: 'IA & Escáner de Productos',
      subtitle: 'Google Gemini',
      icon: Sparkles,
      iconBg: 'bg-violet-500',
      keywords: ['ia', 'gemini', 'scanner', 'escaner', 'inteligencia', 'artificial', 'api key', 'productos', 'camara', 'violeta']
    }
  ];

  // Filter mobile setting items dynamically
  const term = mobileSearch.trim().toLowerCase();
  const filteredSettingItems = allSettingItems.filter(item => {
    if (!term) return true;
    const matchTitle = item.title.toLowerCase().includes(term);
    const matchSubtitle = item.subtitle.toLowerCase().includes(term);
    const matchGroup = item.group.toLowerCase().includes(term);
    const matchKeywords = item.keywords.some(k => k.includes(term));
    return matchTitle || matchSubtitle || matchGroup || matchKeywords;
  });

  // Group filtered items by group name
  const groupedSettingItems = Array.from(new Set(filteredSettingItems.map(i => i.group))).map(groupName => ({
    group: groupName,
    items: filteredSettingItems.filter(i => i.group === groupName)
  }));

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">

      {/* ========================================================= */}
      {/* 📱 MOBILE VIEW: EXACT NATIVE SETTINGS MENU (Matching Image) */}
      {/* ========================================================= */}
      <div className="block sm:hidden space-y-4">

        {/* 1. MOBILE MAIN MENU (WHEN ON MAIN SETTINGS) */}
        {mobileSubScreen === 'main' ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Title */}
            <div className="px-1 pt-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Ajustes
              </h1>
            </div>

            {/* Dynamic Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mobileSearch}
                onChange={e => setMobileSearch(e.target.value)}
                placeholder="Buscar en Ajustes"
                className="w-full pl-10 pr-8 py-2.5 bg-slate-200/70 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-slate-200"
              />
              {mobileSearch && (
                <button
                  onClick={() => setMobileSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grouped Filtered Settings List */}
            {groupedSettingItems.length === 0 ? (
              <div className="text-center py-10 space-y-2 bg-white rounded-2xl border border-slate-200/80 p-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">No se encontraron ajustes</h4>
                <p className="text-[11px] text-slate-400">Prueba buscando "ubigeo", "empresa", "distritos" o "whatsapp".</p>
              </div>
            ) : (
              groupedSettingItems.map(groupObj => (
                <div key={groupObj.group} className="space-y-1">
                  <span className="px-3 text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    {groupObj.group}
                  </span>
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                    {groupObj.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.section);
                            if (item.subTab) setUbigeoSubTab(item.subTab);
                            setMobileSubScreen(item.section);
                          }}
                          className="w-full px-3.5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${item.iconBg} text-white flex items-center justify-center shadow-xs flex-shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-extrabold text-xs text-slate-800">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <span className={`text-[11px] font-bold ${item.id === 'whatsapp' ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {item.subtitle}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 2. MOBILE DETAIL SUB-SCREEN WITH TOP BACK BUTTON */
          <div className="space-y-3 animate-in slide-in-from-right duration-200">
            {/* Top Navigation Bar back to Adjusts */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 bg-slate-50/80 sticky top-0 z-10">
              <button
                onClick={() => setMobileSubScreen('main')}
                className="group flex items-center gap-1.5 rounded-full bg-vivero-dark hover:bg-vivero-primary text-vivero-mint pl-1.5 pr-3.5 py-1.5 shadow-md transition-all active:scale-95"
              >
                <span className="w-6 h-6 rounded-full bg-vivero-mint/15 flex items-center justify-center transition-transform duration-200 group-hover:-translate-x-0.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-black tracking-wide">Ajustes</span>
              </button>
              <span className="text-xs font-black text-slate-800">
                {mobileSubScreen === 'ubigeo'
                  ? 'Ubigeo & Territorio'
                  : mobileSubScreen === 'general'
                  ? 'Datos del Vivero'
                  : mobileSubScreen === 'delivery'
                  ? 'Métodos de Entrega'
                  : mobileSubScreen === 'discounts'
                  ? 'Descuentos de Productos'
                  : mobileSubScreen === 'taxes'
                  ? 'Impuestos e IGV'
                  : mobileSubScreen === 'ai'
                  ? 'IA & Escáner de Productos'
                  : 'WhatsApp API'}
              </span>
              <div className="w-[74px]" />
            </div>
        </div>
      )}

      </div>

      {/* ========================================================= */}
      {/* DESKTOP HEADER & REGULAR DETAIL CONTENTS */}
      {/* ========================================================= */}
      
      {/* DESKTOP HEADER (Hidden on mobile screens) */}
      <div className="hidden sm:block bg-white p-3 rounded-3xl border border-slate-200/80 shadow-card">
        {/* Desktop Segmented Tab Switcher */}
        <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-1 bg-slate-100/90 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('ubigeo');
              setMobileSubScreen('ubigeo');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'ubigeo'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ubigeo</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('general');
              setMobileSubScreen('general');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'general'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresa</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('taxes');
              setMobileSubScreen('taxes');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'taxes'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Impuestos e IGV</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('delivery');
              setMobileSubScreen('delivery');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'delivery'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Entrega</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('discounts');
              setMobileSubScreen('discounts');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'discounts'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Descuentos</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('whatsapp');
              setMobileSubScreen('whatsapp');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'whatsapp'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              setMobileSubScreen('ai');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeSection === 'ai'
                ? 'bg-vivero-dark text-vivero-mint shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IA & Scanner</span>
          </button>
        </div>
      </div>

      {/* 🗺️ UBIGEO & TERRITORIO CONTENT */}
      {activeSection === 'ubigeo' && (
        <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 sm:p-6 space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          
          {/* Sub-Tab Segmented Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setUbigeoSubTab('departments')}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center ${
                ubigeoSubTab === 'departments'
                  ? 'bg-vivero-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Deptos ({departments.length})
            </button>

            <button
              onClick={() => setUbigeoSubTab('provinces')}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center ${
                ubigeoSubTab === 'provinces'
                  ? 'bg-vivero-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Provincias ({provinces.length})
            </button>

            <button
              onClick={() => setUbigeoSubTab('districts')}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center ${
                ubigeoSubTab === 'districts'
                  ? 'bg-vivero-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Distritos ({districts.length})
            </button>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 sm:bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <label className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importar Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                title="Descargar Plantilla de Ejemplo"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Plantilla</span>
              </button>

              <button
                onClick={() => openCreateModal(
                  ubigeoSubTab === 'departments' ? 'department' : ubigeoSubTab === 'provinces' ? 'province' : 'district'
                )}
                className="w-full sm:w-auto px-4 py-2 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {ubigeoSubTab === 'departments' ? 'Nuevo Departamento' : ubigeoSubTab === 'provinces' ? 'Nueva Provincia' : 'Nuevo Distrito'}
                </span>
              </button>
            </div>
          </div>

          {/* Parent Filters on Mobile */}
          {ubigeoSubTab === 'provinces' && (
            <div className="w-full">
              <CustomSelect
                label="Filtrar por Departamento"
                value={filterDept}
                onChange={val => setFilterDept(val)}
                options={[
                  { value: '', label: '(Todos los departamentos)' },
                  ...departments.map(d => ({ value: d.name, label: d.name }))
                ]}
                size="sm"
              />
            </div>
          )}

          {ubigeoSubTab === 'districts' && (
            <div className="w-full">
              <CustomSelect
                label="Filtrar por Provincia"
                value={filterProv}
                onChange={val => setFilterProv(val)}
                options={[
                  { value: '', label: '(Todas las provincias)' },
                  ...provinces.map(p => ({ value: p.name, label: `${p.name} (${p.departmentName})` }))
                ]}
                size="sm"
              />
            </div>
          )}

          {/* DEPARTAMENTOS VIEW */}
          {ubigeoSubTab === 'departments' && (
            <>
              {/* Mobile Card List View */}
              <div className="space-y-2 sm:hidden">
                {filteredDepartments.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold flex-shrink-0">
                        <MapPin className="w-4 h-4 text-vivero-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800 truncate">{item.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-200 font-mono text-[9px] font-bold text-slate-600 rounded-md">
                            {item.code}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase inline-block mt-0.5 ${
                          item.active ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          ● {item.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('department', item)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus('department', item.id)}
                        className={`p-2 bg-white rounded-xl border border-slate-200 shadow-2xs ${
                          item.active ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {item.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b border-slate-200">
                      <th className="py-3 px-4">Código Ubigeo</th>
                      <th className="py-3 px-4">Departamento</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                    {filteredDepartments.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.code}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal('department', item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus('department', item.id)}
                            className={`p-1.5 rounded-lg ${
                              item.active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {item.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PROVINCIAS VIEW */}
          {ubigeoSubTab === 'provinces' && (
            <>
              {/* Mobile Card List View */}
              <div className="space-y-2 sm:hidden">
                {filteredProvinces.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold flex-shrink-0">
                        <MapPin className="w-4 h-4 text-vivero-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800 truncate">{item.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-200 font-mono text-[9px] font-bold text-slate-600 rounded-md">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-vivero-primary truncate">{item.departmentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('province', item)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus('province', item.id)}
                        className={`p-2 bg-white rounded-xl border border-slate-200 shadow-2xs ${
                          item.active ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {item.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b border-slate-200">
                      <th className="py-3 px-4">Código Ubigeo</th>
                      <th className="py-3 px-4">Provincia</th>
                      <th className="py-3 px-4">Departamento</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                    {filteredProvinces.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.code}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-vivero-primary font-bold">{item.departmentName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal('province', item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus('province', item.id)}
                            className={`p-1.5 rounded-lg ${
                              item.active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {item.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* DISTRITOS VIEW */}
          {ubigeoSubTab === 'districts' && (
            <>
              {/* Mobile Card List View */}
              <div className="space-y-2 sm:hidden">
                {filteredDistricts.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold flex-shrink-0">
                        <MapPin className="w-4 h-4 text-vivero-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800 truncate">{item.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-200 font-mono text-[9px] font-bold text-slate-600 rounded-md">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 truncate">
                          {item.provinceName}, <span className="text-vivero-primary font-bold">{item.departmentName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('district', item)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus('district', item.id)}
                        className={`p-2 bg-white rounded-xl border border-slate-200 shadow-2xs ${
                          item.active ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {item.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b border-slate-200">
                      <th className="py-3 px-4">Código Ubigeo</th>
                      <th className="py-3 px-4">Distrito</th>
                      <th className="py-3 px-4">Provincia</th>
                      <th className="py-3 px-4">Departamento</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                    {filteredDistricts.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.code}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{item.provinceName}</td>
                        <td className="py-3 px-4 text-vivero-primary font-bold">{item.departmentName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal('district', item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus('district', item.id)}
                            className={`p-1.5 rounded-lg ${
                              item.active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {item.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      )}

      {/* 🏢 VIVERO GENERAL SECTION */}
      {activeSection === 'general' && (
        <div className={`space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          {/* VIEW: DATOS DE LA EMPRESA ONLY */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-vivero-primary" />
                <span>Datos de la Empresa & Vivero</span>
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-vivero-soft text-vivero-dark rounded-full">
                General
              </span>
            </div>

            <form onSubmit={handleSaveCompanyData}>
              <div className="p-4 space-y-3.5 text-xs font-semibold">
                {companySaveSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>¡Datos de la empresa guardados correctamente! Se han actualizado en todo el sistema.</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-500 text-[11px] font-bold block">Nombre Comercial del Vivero</label>
                  <input
                    type="text"
                    value={inputCompName}
                    onChange={e => setInputCompName(e.target.value)}
                    placeholder={`Ej. ${companyName}`}
                    required
                    className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[11px] font-bold block">RUC de la Empresa</label>
                    <input
                      type="text"
                      value={inputCompRuc}
                      onChange={e => setInputCompRuc(e.target.value)}
                      placeholder="Ej. 20601234567"
                      className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 text-[11px] font-bold block">Teléfono Principal de Atención</label>
                    <input
                      type="text"
                      value={inputCompPhone}
                      onChange={e => setInputCompPhone(e.target.value)}
                      placeholder="Ej. +51 987 654 321"
                      className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[11px] font-bold block">Dirección Fiscal / Sede Central</label>
                  <input
                    type="text"
                    value={inputCompAddress}
                    onChange={e => setInputCompAddress(e.target.value)}
                    placeholder="Ej. Av. Los Jardines 123, San Isidro, Lima, Perú"
                    className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                  />
                </div>

                <div className="rounded-xl border border-vivero-mint/40 bg-vivero-soft/40 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-vivero-primary flex-shrink-0" />
                    <div>
                      <p className="text-slate-700 text-[11px] font-extrabold">Ubicación GPS del Vivero (Almacén Central)</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Usada por el mapa de rutas GPS del delivery. Se guarda en la base de datos MySQL.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-slate-500 text-[10px] font-bold block">Latitud</label>
                      <input
                        type="number"
                        step="0.0000001"
                        value={inputWarehouseLat}
                        onChange={e => setInputWarehouseLat(e.target.value)}
                        placeholder="Ej. -12.1385"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 text-[10px] font-bold block">Longitud</label>
                      <input
                        type="number"
                        step="0.0000001"
                        value={inputWarehouseLng}
                        onChange={e => setInputWarehouseLng(e.target.value)}
                        placeholder="Ej. -76.9812"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-3 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos de la Empresa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🧾 IMPUESTOS E IGV SECTION */}
      {activeSection === 'taxes' && (
        <div className={`space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-600" />
                <span>Impuestos & Configuración de IGV</span>
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full uppercase">
                Tributario
              </span>
            </div>

            <div className="p-4 space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[11px] font-bold block">Tasa Impuesto IGV (%)</label>
                  <input
                    type="number"
                    defaultValue="18"
                    className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                  />
                </div>

                <div className="space-y-1">
                  <CustomSelect
                    label="Moneda Principal de Facturación"
                    value="PEN"
                    onChange={() => {}}
                    options={[
                      { value: 'PEN', label: 'Soles Peruanos (S/)', badge: 'PEN' },
                      { value: 'USD', label: 'Dólares Americanos ($)', badge: 'USD' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <CustomSelect
                  label="Comprobante Predeterminado en Ventas POS"
                  value="BOLETA"
                  onChange={() => {}}
                  options={[
                    { value: 'BOLETA', label: 'Boleta de Venta Electrónica', badge: 'SUNAT' },
                    { value: 'FACTURA', label: 'Factura Electrónica', badge: 'RUC' },
                    { value: 'TICKET', label: 'Nota de Venta / Ticket Interno', badge: 'Interno' }
                  ]}
                  size="sm"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
              <button className="w-full sm:w-auto px-5 py-3 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros de Impuestos e IGV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ IA & SCANNER SECTION */}
      {activeSection === 'ai' && (
        <div className={`space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-violet-50/60 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>IA & Escáner de Productos</span>
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-violet-100 text-violet-800 rounded-full uppercase">
                Gemini
              </span>
            </div>

            <form onSubmit={handleSaveGeminiKey}>
              <div className="p-4 space-y-3.5 text-xs font-semibold">
                {geminiKeyLoading ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando configuración de IA...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-500 leading-snug">
                      Conecta el <strong className="text-slate-700">escáner inteligente</strong>: captura una foto del
                      producto con la cámara y la IA (Google Gemini) detecta si es{' '}
                      <strong className="text-vivero-primary">Grass Natural</strong>,{' '}
                      <strong className="text-vivero-primary">Planta Ornamental</strong>,{' '}
                      <strong className="text-vivero-primary">Árbol o Palmera</strong>, o{' '}
                      <strong className="text-vivero-primary">Accesorios e Insumos</strong>, sugiriendo nombre,
                      categoría, unidad de medida e imagen. Tú defines el precio y el stock.
                    </p>

                    <div className="space-y-1">
                      <label className="text-slate-500 text-[11px] font-bold block">Clave API de Google Gemini (IA)</label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-violet-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showGeminiKey ? 'text' : 'password'}
                          value={geminiApiKey}
                          onChange={e => setGeminiApiKey(e.target.value)}
                          placeholder="Pega tu clave API aquí (ej. AIzaSy...)  →  https://aistudio.google.com/apikey"
                          className="w-full pl-9 pr-10 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-violet-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          title={showGeminiKey ? 'Ocultar clave' : 'Mostrar clave'}
                        >
                          {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Obtén tu clave gratis en{' '}
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 font-bold underline"
                        >
                          aistudio.google.com/apikey
                        </a>{' '}
                        (capa gratuita). Se guarda en la base de datos de tu sistema.
                      </p>
                    </div>

                    {geminiKeySaved && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>¡Clave API de IA guardada correctamente!</span>
                      </div>
                    )}

                    {geminiKeyError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{geminiKeyError}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={geminiKeyLoading}
                  className="w-full sm:w-auto px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Guardar Clave API de IA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💬 WHATSAPP BUSINESS SECTION */}
      {activeSection === 'whatsapp' && (
        <div className={`space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-emerald-50/60 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Integración WhatsApp Business API</span>
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                Activo
              </span>
            </div>

            <div className="p-4 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-500 text-[11px] font-bold block">Número Oficial de WhatsApp Business</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    defaultValue="+51 987 654 321"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[11px] font-bold block">Plantilla Mensaje de Confirmación de Pedidos</label>
                <textarea
                  rows={4}
                  defaultValue={`Hola {{cliente}} 👋 Gracias por tu compra en ${companyName.toUpperCase()} 🌱. Confirmamos tu pedido {{pedido}} con dirección de entrega: {{direccion}}.`}
                  className="w-full px-3 py-2 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Variables dinámicas soportadas: <code className="bg-slate-100 px-1 rounded text-slate-600">{"{{cliente}}"}</code>, <code className="bg-slate-100 px-1 rounded text-slate-600">{"{{pedido}}"}</code>, <code className="bg-slate-100 px-1 rounded text-slate-600">{"{{direccion}}"}</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 block">Probar enlace de prueba</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Abre la app de WhatsApp con mensaje preformateado</span>
                  </div>
                </div>
                <a
                  href="https://wa.me/51987654321?text=Hola%20Vivero%20Villa%20Verde%20%F0%9F%8D%B1"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-colors flex-shrink-0"
                >
                  Probar
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
              <button className="w-full sm:w-auto px-5 py-3 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
                <Save className="w-4 h-4" />
                <span>Guardar Configuración WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚚 MÉTODOS DE ENTREGA SECTION */}
      {activeSection === 'delivery' && (
        <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 sm:p-6 space-y-4 animate-in fade-in duration-150 ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          
          {/* Executive Delivery Methods Header Card */}
          <div className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-vivero-soft/20 text-vivero-mint flex items-center justify-center font-bold border border-vivero-mint/30 shadow-xs flex-shrink-0">
                  <Truck className="w-5 h-5 text-vivero-mint" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                    Registro & Configuración de Métodos de Entrega
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Gestión de opciones de Delivery a Domicilio y Recojo en Tienda activas en la tienda y caja POS
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={openCreateDmModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-vivero-mint text-vivero-dark hover:bg-emerald-300 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Método de Entrega</span>
            </button>
          </div>

          {/* Search & Type Filter Bar */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dmSearch}
                onChange={e => setDmSearch(e.target.value)}
                placeholder="Buscar método de entrega por nombre o descripción..."
                className="w-full pl-8 pr-3 py-1.5 bg-white text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:border-vivero-primary focus:outline-none transition-all"
              />
              {dmSearch && (
                <button
                  onClick={() => setDmSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'DELIVERY', label: '🚚 Delivery' },
                { id: 'STORE', label: '🏪 Recojo en Tienda' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDmTypeFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all ${
                    dmTypeFilter === tab.id
                      ? 'bg-[#1b4332] text-vivero-mint shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List of Registered Delivery Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {deliveryMethods
              .filter(m => {
                const query = dmSearch.toLowerCase().trim();
                const matchesSearch = !query || m.name.toLowerCase().includes(query) || (m.description && m.description.toLowerCase().includes(query));
                if (dmTypeFilter === 'ALL') return matchesSearch;
                return matchesSearch && m.type === dmTypeFilter;
              })
              .map(m => (
                <div
                  key={m.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-soft transition-all flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          m.type === 'DELIVERY' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {m.type === 'DELIVERY' ? '🚚 Delivery a Domicilio' : '🏪 Recojo en Tienda'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          m.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black ${
                        m.price > 0 ? 'bg-slate-100 text-[#1b4332]' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.price > 0 ? `+ S/ ${m.price.toFixed(2)}` : 'GRATIS 🎉'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{m.name}</h4>
                      {m.description && <p className="text-xs text-slate-500 font-medium mt-1">{m.description}</p>}
                      {m.estimatedTime && (
                        <p className="text-[11px] text-slate-600 font-bold mt-1.5 flex items-center gap-1">
                          <span>⏱️ Plazo estimado:</span>
                          <strong className="text-slate-800">{m.estimatedTime}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ID: #{m.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditDmModal(m)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleToggleDmStatus(m.id)}
                        className={`py-1.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 border ${
                          m.active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {m.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{m.active ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* MODAL FOR CREATING / EDITING DELIVERY METHOD */}
      {isDeliveryMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4 text-vivero-primary" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  {editingDeliveryMethod ? 'Editar Método de Entrega' : 'Nuevo Método de Entrega'}
                </h3>
              </div>
              <button onClick={() => setIsDeliveryMethodModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDmModal} className="space-y-3.5 text-xs font-semibold">
              {dmError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{dmError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Nombre del Método de Entrega
                </label>
                <input
                  type="text"
                  value={dmName}
                  onChange={e => setDmName(e.target.value)}
                  placeholder="Ej. Delivery Express Grass en Rollos (Lima Sur)"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* Visual Radio Selector for Delivery Type */}
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Tipo de Entrega
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDmType('DELIVERY')}
                    className={`p-2.5 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      dmType === 'DELIVERY'
                        ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-200 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🚚 Delivery a Domicilio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDmType('STORE')}
                    className={`p-2.5 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      dmType === 'STORE'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-200 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏪 Recojo en Tienda</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Costo / Tarifa del Servicio (S/)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dmPrice}
                  onChange={e => setDmPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Plazo / Tiempo Estimado
                </label>
                <input
                  type="text"
                  value={dmEstimatedTime}
                  onChange={e => setDmEstimatedTime(e.target.value)}
                  placeholder="Ej. 24 a 48 horas / Inmediato en Vivero"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-vivero-primary bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Descripción / Instrucciones
                </label>
                <textarea
                  value={dmDescription}
                  onChange={e => setDmDescription(e.target.value)}
                  placeholder="Instrucciones para el cliente al momento de seleccionar este método..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-vivero-primary bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryMethodModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDm}
                  className="px-5 py-2 bg-[#1b4332] text-vivero-mint hover:bg-vivero-primary font-extrabold rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {savingDm ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Método de Entrega</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ PRODUCT DISCOUNTS SECTION */}
      {activeSection === 'discounts' && (
        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-2.5 sm:p-4 shadow-card space-y-2.5 sm:space-y-3 animate-in fade-in duration-200 text-xs ${mobileSubScreen === 'main' ? 'hidden sm:block' : 'block'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-rose-600" />
                <span>Configuración de Descuentos a Productos</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Aplica porcentajes de oferta o precios promocionales en tu catálogo.
              </p>
            </div>
            <button
              onClick={fetchDiscountProducts}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] flex items-center gap-1 transition-all self-start sm:self-auto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar Lista</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={discountSearch}
                onChange={e => setDiscountSearch(e.target.value)}
                placeholder="Buscar por producto, marca o código..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] sm:text-[11px] font-semibold text-slate-800 border border-slate-200/80 focus:outline-none focus:border-vivero-primary"
              />
            </div>

            <CustomSelect
              value={discountCatFilter}
              onChange={val => setDiscountCatFilter(val)}
              options={[
                { value: 'TODOS', label: 'Todas las Categorías' },
                { value: 'Grass', label: 'Grass Natural' },
                { value: 'Plantas', label: 'Plantas Ornamentales' },
                { value: 'Árboles', label: 'Árboles y Palmeras' },
                { value: 'Accesorios', label: 'Accesorios e Insumos' }
              ]}
              size="sm"
            />

            <CustomSelect
              value={discountStatusFilter}
              onChange={val => setDiscountStatusFilter(val as any)}
              options={[
                { value: 'ALL', label: 'Todos los Productos', badge: 'Todos' },
                { value: 'WITH_DISCOUNT', label: '🔥 Solo Con Oferta / Descuento', badge: 'Oferta', badgeColor: 'bg-rose-100 text-rose-800' },
                { value: 'NO_DISCOUNT', label: 'Sin Descuento', badge: 'Normal' }
              ]}
              size="sm"
            />
          </div>

          {/* Table / Cards List */}
          {loadingDiscountProducts ? (
            <LeavesLoader compact message="Cargando catálogo de productos..." />
          ) : (
            <>
              {/* 📱 MOBILE CARD LIST (native mobile compact responsive layout) */}
              <div className="block sm:hidden space-y-2">
                {discountProducts
                  .filter(prod => {
                    const q = discountSearch.toLowerCase().trim();
                    const matchSearch = !q || prod.name.toLowerCase().includes(q) || prod.code.toLowerCase().includes(q) || (prod.brand && prod.brand.toLowerCase().includes(q)) || prod.categoryName.toLowerCase().includes(q);
                    const matchCat = discountCatFilter === 'TODOS' || prod.categoryName.toLowerCase().includes(discountCatFilter.toLowerCase());
                    const hasDisc = Boolean((prod.discountPercentage && prod.discountPercentage > 0) || (prod.originalPrice && prod.originalPrice > prod.price));
                    const matchStatus = discountStatusFilter === 'ALL' || (discountStatusFilter === 'WITH_DISCOUNT' ? hasDisc : !hasDisc);
                    return matchSearch && matchCat && matchStatus;
                  })
                  .map(prod => {
                    const pricing = getProductPricing(prod);
                    const hasDiscount = pricing.hasDiscount;
                    const pct = pricing.discountPercentage;
                    const baseP = pricing.basePrice;
                    const sellingP = pricing.sellingPrice;

                    return (
                      <div
                        key={prod.id}
                        className="bg-slate-50/70 rounded-xl p-2 border border-slate-200/90 space-y-1.5 transition-all text-xs"
                      >
                        {/* Header: Image, Brand, Name, Category */}
                        <div className="flex items-start gap-2">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-slate-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.2">
                              <span className="px-1.5 py-0.2 bg-white text-vivero-dark text-[8px] font-black rounded uppercase border border-slate-200">
                                {prod.categoryName}
                              </span>
                              <span className="text-[8px] text-slate-400 font-extrabold font-mono">
                                {prod.code}
                              </span>
                            </div>

                            {prod.brand && (
                              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block leading-none">
                                {prod.brand}
                              </span>
                            )}

                            <h4 className="font-extrabold text-slate-800 text-[11px] break-words leading-snug">
                              {prod.name}
                            </h4>
                          </div>
                        </div>

                        {/* Middle Info: Price & Live Visual Preview */}
                        <div className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-200/80">
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">
                              Precio Base
                            </span>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-xs font-black text-slate-900">
                                S/ {baseP.toFixed(2)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                /{prod.unitType === 'M2' ? 'm²' : 'und'}
                              </span>
                            </div>
                          </div>

                          {hasDiscount ? (
                            <div className="text-right leading-tight">
                              <span className="bg-[#e11d48] text-white font-black text-[8px] px-1.5 py-0.2 rounded inline-block shadow-2xs">
                                -{pct}%
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-700 block leading-none mt-0.5">
                                S/ {sellingP.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Sin descuento
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            onClick={() => openDiscountModal(prod)}
                            className="flex-1 py-1 bg-vivero-soft hover:bg-vivero-primary hover:text-white text-vivero-dark font-extrabold rounded-lg transition-all text-[10px] flex items-center justify-center gap-1 border border-vivero-primary/20 active:scale-[0.98]"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{hasDiscount ? 'Editar Oferta' : 'Configurar Oferta'}</span>
                          </button>

                          {hasDiscount && (
                            <button
                              onClick={() => handleRemoveDiscount(prod)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg transition-all text-[10px] border border-rose-200 active:scale-[0.98]"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 💻 DESKTOP TABLE VIEW (visible on sm+) */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Producto</th>
                      <th className="py-2 px-2.5">Categoría</th>
                      <th className="py-2 px-2.5">Precio Lista</th>
                      <th className="py-2 px-2.5 text-center">Descuento</th>
                      <th className="py-2 px-2.5">Precio Final</th>
                      <th className="py-2 px-2.5">Vista Previa</th>
                      <th className="py-2 px-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {discountProducts
                      .filter(prod => {
                        const q = discountSearch.toLowerCase().trim();
                        const matchSearch = !q || prod.name.toLowerCase().includes(q) || prod.code.toLowerCase().includes(q) || (prod.brand && prod.brand.toLowerCase().includes(q)) || prod.categoryName.toLowerCase().includes(q);
                        const matchCat = discountCatFilter === 'TODOS' || prod.categoryName.toLowerCase().includes(discountCatFilter.toLowerCase());
                        const hasDisc = Boolean((prod.discountPercentage && prod.discountPercentage > 0) || (prod.originalPrice && prod.originalPrice > prod.price));
                        const matchStatus = discountStatusFilter === 'ALL' || (discountStatusFilter === 'WITH_DISCOUNT' ? hasDisc : !hasDisc);
                        return matchSearch && matchCat && matchStatus;
                      })
                      .map(prod => {
                        const pricing = getProductPricing(prod);
                        const hasDiscount = pricing.hasDiscount;
                        const pct = pricing.discountPercentage;
                        const baseP = pricing.basePrice;
                        const sellingP = pricing.sellingPrice;

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-1.5 px-2.5">
                              <div className="flex items-center gap-2">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200 flex-shrink-0"
                                />
                                <div>
                                  {prod.brand && (
                                    <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block leading-none">
                                      {prod.brand}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-slate-800 block text-[11px] break-words">
                                    {prod.name}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-bold block">
                                    Cód: {prod.code}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-1.5 px-2.5 font-bold text-slate-600">
                              {prod.categoryName}
                            </td>

                            <td className="py-1.5 px-2.5 font-extrabold text-slate-700">
                              S/ {baseP.toFixed(2)}
                            </td>

                            <td className="py-1.5 px-2.5 text-center">
                              {hasDiscount ? (
                                <span className="bg-[#e11d48] text-white font-black text-[9px] px-1.5 py-0.2 rounded shadow-2xs">
                                  -{pct}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[9px] font-bold">Sin rebaja</span>
                              )}
                            </td>

                            <td className="py-1.5 px-2.5 font-black text-slate-900">
                              S/ {sellingP.toFixed(2)}
                            </td>

                            {/* Live Visual Preview matching Image 1 */}
                            <td className="py-1.5 px-2.5">
                              {hasDiscount ? (
                                <div className="bg-slate-50 p-1 px-1.5 rounded-lg border border-slate-200/80 inline-block space-y-0.5">
                                  <span className="bg-[#e11d48] text-white font-black text-[8px] px-1 py-0.2 rounded inline-block">
                                    -{pct}%
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900 block leading-tight">
                                    S/ {sellingP.toFixed(2)}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 line-through block leading-none">
                                    S/ {baseP.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-bold">Precio normal</span>
                              )}
                            </td>

                            <td className="py-1.5 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openDiscountModal(prod)}
                                  className="px-2 py-1 bg-vivero-soft hover:bg-vivero-primary hover:text-white text-vivero-dark font-extrabold rounded-md transition-all text-[10px] flex items-center gap-1 shadow-2xs"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{hasDiscount ? 'Editar' : 'Configurar'}</span>
                                </button>

                                {hasDiscount && (
                                  <button
                                    onClick={() => handleRemoveDiscount(prod)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-md transition-all text-[9px] border border-rose-200"
                                    title="Quitar descuento"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL FOR CREATING / EDITING UBIGEO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingItem ? 'Editar' : 'Nuevo'} {modalType === 'department' ? 'Departamento' : modalType === 'province' ? 'Provincia' : 'Distrito'}
              </h3>
              <button onClick={() => setIsMapModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs font-semibold">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-black text-red-800">No se pudo guardar:</span>
                    <span className="block font-normal mt-0.5">{modalError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-500 block mb-1">Código Ubigeo</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  placeholder="Ej: 15, 1501, 150122"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-vivero-primary bg-slate-50 sm:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Nombre de la ubicación..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-vivero-primary bg-slate-50 sm:bg-white"
                  required
                />
              </div>

              {modalType === 'province' && (
                <div>
                  <CustomSelect
                    label="Departamento Perteneciente"
                    value={(formDeptId ?? (departments[0]?.id || '')).toString()}
                    onChange={val => setFormDeptId(Number(val))}
                    options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                    size="sm"
                  />
                </div>
              )}

              {modalType === 'district' && (
                <div>
                  <CustomSelect
                    label="Provincia Perteneciente"
                    value={(formProvId ?? (provinces[0]?.id || '')).toString()}
                    onChange={val => setFormProvId(Number(val))}
                    options={provinces.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.departmentName})` }))}
                    size="sm"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-4 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUbigeo}
                  className="px-5 py-2.5 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint font-extrabold rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {savingUbigeo ? 'Guardando en DB...' : 'Guardar en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR EXCEL BULK IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Importación Masiva de Ubigeo</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Archivo: <span className="font-bold text-slate-700">{importFileName}</span></p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Badges */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Filas</span>
                <span className="text-sm font-black text-slate-800">{importParsedItems.length}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Deptos</span>
                <span className="text-sm font-black text-emerald-800">
                  {new Set(importParsedItems.map(i => i.departmentCode)).size}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 block uppercase">Provincias</span>
                <span className="text-sm font-black text-blue-800">
                  {new Set(importParsedItems.filter(i => i.provinceCode).map(i => i.provinceCode)).size}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Distritos</span>
                <span className="text-sm font-black text-amber-800">
                  {new Set(importParsedItems.filter(i => i.districtCode).map(i => i.districtCode)).size}
                </span>
              </div>
            </div>

            {/* Alert Messages */}
            {importSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {importErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{importErrorMsg}</span>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-2xl min-h-[200px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Cód. Dept</th>
                    <th className="py-2 px-3">Departamento</th>
                    <th className="py-2 px-3">Cód. Prov</th>
                    <th className="py-2 px-3">Provincia</th>
                    <th className="py-2 px-3">Cód. Dist</th>
                    <th className="py-2 px-3">Distrito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {importParsedItems.slice(0, 12).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">{item.departmentCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.departmentName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{item.provinceCode || '-'}</td>
                      <td className="py-2 px-3 text-slate-800">{item.provinceName || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{item.districtCode || '-'}</td>
                      <td className="py-2 px-3 text-slate-800">{item.districtName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importParsedItems.length > 12 && (
                <div className="p-2 text-center text-[11px] font-bold text-slate-400 bg-slate-50 border-t border-slate-100">
                  ... y {importParsedItems.length - 12} filas más listos para importar.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={isImporting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando a MySQL...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Confirmar e Importar a MySQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR DESCUENTO DE PRODUCTO */}
      {isDiscountModalOpen && selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-xs truncate">
                    Configurar Descuento
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 truncate">
                    {selectedProductForDiscount.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-2.5">
              {discountError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[10px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>{discountError}</span>
                </div>
              )}

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Precio Normal / Lista (S/)
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={inputOriginalPrice}
                  onChange={e => {
                    setInputOriginalPrice(e.target.value);
                    if (discountMode === 'PERCENT') handlePercentageChange(inputDiscountPercentage);
                  }}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black text-slate-800 focus:outline-none"
                />
              </div>

              {/* Discount Mode Selector */}
              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Modo de Cálculo de Oferta
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiscountMode('PERCENT')}
                    className={`py-1 px-1.5 rounded text-[10px] font-black transition-all ${
                      discountMode === 'PERCENT'
                        ? 'bg-vivero-primary text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Por Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode('PROMO_PRICE')}
                    className={`py-1 px-1.5 rounded text-[10px] font-black transition-all ${
                      discountMode === 'PROMO_PRICE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Por Precio Oferta (S/)
                  </button>
                </div>
              </div>

              {discountMode === 'PERCENT' ? (
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                    Porcentaje de Descuento (% OFF)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={inputDiscountPercentage}
                      onChange={e => handlePercentageChange(e.target.value)}
                      required
                      placeholder="Ej. 49"
                      className="w-full px-2.5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black text-slate-800 focus:outline-none border border-slate-200"
                    />
                    <span className="text-xs font-black text-rose-600">%</span>
                  </div>
                  {/* Preset Percentages */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {[10, 20, 30, 40, 49, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentageChange(pct.toString())}
                        className="px-1.5 py-0.2 bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-700 font-extrabold text-[9px] rounded transition-colors"
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                    Precio Oferta Final (S/)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={inputPromoPrice}
                    onChange={e => handlePromoPriceChange(e.target.value)}
                    required
                    placeholder="Ej. 19.90"
                    className="w-full px-2.5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black text-slate-800 focus:outline-none border border-slate-200"
                  />
                </div>
              )}

              {/* Exact Visual Live Preview Card matching Image 1 */}
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Vista Previa en Tarjeta de Producto:
                </span>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 inline-block space-y-0.5">
                  <span className="bg-[#e11d48] text-white font-black text-[9px] px-1.5 py-0.2 rounded inline-block">
                    -{inputDiscountPercentage || '0'}%
                  </span>
                  <div className="text-xs font-black text-slate-900 block leading-tight">
                    S/ {(parseFloat(inputPromoPrice) || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 line-through block leading-none">
                    S/ {(parseFloat(inputOriginalPrice) || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleRemoveDiscount(selectedProductForDiscount)}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-extrabold border border-rose-200"
                >
                  Quitar Descuento
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingDiscount}
                    className="px-3 py-1.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold rounded-lg shadow-sm text-[10px] flex items-center gap-1 transition-all"
                  >
                    {savingDiscount ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
