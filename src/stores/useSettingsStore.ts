// stores/useSettingsStore.ts - FIXED VERSION
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase';

export type Theme = 'light' | 'dark' | 'oled';

export interface UserSettings {
  id: string;
  defaultCurrency: string;
  displayCurrency: string;
  taxRate: number;
  defaultFee: number;
  dateFormat: string;
  theme: Theme;
  notifyTrades: boolean;
  notifyPriceAlerts: boolean;
  notifyMonthly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

interface SettingsState {
  settings: UserSettings | null;
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
}

interface SettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  fetchCurrencies: () => Promise<void>;
  setTheme: (theme: Theme) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

// ✅ FIXED: Helper function to get Firebase ID token headers (same as useTradeStore)
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Get the Firebase ID token
    const idToken = await currentUser.getIdToken()
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`, // ✅ This is what your API expects
    }
  } catch (error) {
    console.error('❌ Error getting auth headers:', error)
    throw new Error('Authentication failed')
  }
}

const initialState: SettingsState = {
  settings: null,
  currencies: [],
  isLoading: false,
  error: null,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ✅ FIXED: Fetch settings with Firebase authentication
        fetchSettings: async () => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('🚀 Fetching settings with Firebase auth...');
            
            const headers = await getAuthHeaders(); // ✅ Get Firebase token
            const response = await fetch('/api/settings', {
              method: 'GET',
              headers,
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch settings: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Settings fetched successfully:', data);
            
            set({ 
              settings: data.settings, 
              isLoading: false 
            });

            // Apply theme immediately
            if (data.settings?.theme) {
              get().setTheme(data.settings.theme);
            }
          } catch (error) {
            console.error('❌ Error fetching settings:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch settings',
              isLoading: false,
            });
          }
        },

        // ✅ FIXED: Update settings with Firebase authentication
        updateSettings: async (updates) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('🚀 Updating settings with Firebase auth:', updates);
            
            const headers = await getAuthHeaders(); // ✅ Get Firebase token
            const response = await fetch('/api/settings', {
              method: 'PUT',
              headers,
              body: JSON.stringify(updates),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to update settings: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Settings updated successfully:', data);
            
            set({ 
              settings: data.settings, 
              isLoading: false 
            });

            // Apply theme if it was updated
            if (updates.theme) {
              get().setTheme(updates.theme);
            }
          } catch (error) {
            console.error('❌ Error updating settings:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to update settings',
              isLoading: false,
            });
            throw error;
          }
        },

        // ✅ Fetch currencies (this doesn't need auth, so keep it as-is)
        fetchCurrencies: async () => {
          try {
            console.log('🚀 Fetching currencies...');
            
            const response = await fetch('/api/currencies', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch currencies: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Currencies fetched successfully:', data);
            
            set({ currencies: data.currencies || [] });
          } catch (error) {
            console.error('❌ Error fetching currencies:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch currencies',
            });
          }
        },

        // Set theme (client-side theme application)
        setTheme: (theme: Theme) => {
          try {
            console.log('🎨 Applying theme:', theme);
            
            // Apply theme to document
            const root = document.documentElement;
            
            // Remove existing theme classes
            root.classList.remove('light', 'dark', 'oled');
            
            // Add new theme class
            root.classList.add(theme);
            
            // Update CSS variables based on theme
            switch (theme) {
              case 'light':
                root.style.setProperty('--bg-primary', '#ffffff');
                root.style.setProperty('--bg-secondary', '#f8fafc');
                root.style.setProperty('--text-primary', '#1e293b');
                root.style.setProperty('--text-secondary', '#64748b');
                break;
              case 'dark':
                root.style.setProperty('--bg-primary', '#0f172a');
                root.style.setProperty('--bg-secondary', '#1e293b');
                root.style.setProperty('--text-primary', '#f1f5f9');
                root.style.setProperty('--text-secondary', '#94a3b8');
                break;
              case 'oled':
                root.style.setProperty('--bg-primary', '#000000');
                root.style.setProperty('--bg-secondary', '#111111');
                root.style.setProperty('--text-primary', '#ffffff');
                root.style.setProperty('--text-secondary', '#888888');
                break;
            }
            
            console.log('✅ Theme applied successfully:', theme);
          } catch (error) {
            console.error('❌ Error applying theme:', error);
          }
        },

        // Utility functions
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'settings-storage',
        version: 1,
        // Only persist theme for quick loading
        partialize: (state) => ({ 
          settings: state.settings ? { theme: state.settings.theme } : null 
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);

// Utility functions for settings
export const settingsUtils = {
  formatCurrency: (amount: number, currencyCode: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  },

  formatDate: (date: Date | string, format: string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    try {
      switch (format) {
        case 'MM/dd/yyyy':
          return d.toLocaleDateString('en-US');
        case 'dd/MM/yyyy':
          return d.toLocaleDateString('en-GB');
        case 'yyyy-MM-dd':
          return d.toISOString().split('T')[0];
        default:
          return d.toLocaleDateString();
      }
    } catch (error) {
      return d.toString();
    }
  },

  calculateTax: (profit: number, taxRate: number): number => {
    return profit > 0 ? (profit * taxRate) / 100 : 0;
  },
};