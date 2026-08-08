import React, { createContext, useContext, useState, useEffect } from 'react';

interface CompanySettings {
  companyName: string;
  companyRuc: string;
  companyPhone: string;
  companyAddress: string;
}

interface CompanyContextType extends CompanySettings {
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Vivero',
  companyRuc: '20601234567',
  companyPhone: '+51 987 654 321',
  companyAddress: 'Av. Los Jardines 123, San Isidro, Lima, Perú'
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('vivero_company_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_COMPANY_SETTINGS,
          ...parsed
        };
      }
    } catch (e) {
      console.error('Error reading company settings from localStorage:', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('vivero_company_settings', JSON.stringify(settings));
      if (settings.companyName) {
        document.title = `${settings.companyName} | ERP & PWA Empresarial`;
      }
    } catch (e) {
      console.error('Error saving company settings to localStorage:', e);
    }
  }, [settings]);

  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <CompanyContext.Provider value={{ ...settings, updateCompanySettings }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanySettings = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    return {
      ...DEFAULT_COMPANY_SETTINGS,
      updateCompanySettings: () => {}
    };
  }
  return context;
};
