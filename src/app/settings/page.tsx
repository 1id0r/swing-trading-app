// app/settings/page.tsx - FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/app/contexts/AuthContext'
import { useSettingsStore, Theme } from '@/stores/useSettingsStore'
import { Palette, DollarSign, Globe, Percent, Bell, Smartphone, Moon, Sun, Save, RefreshCw } from 'lucide-react'

// Default settings to prevent undefined values
const DEFAULT_SETTINGS = {
  id: '',
  defaultCurrency: 'USD',
  displayCurrency: 'USD',
  taxRate: 25.0,
  defaultFee: 9.99,
  dateFormat: 'MM/dd/yyyy',
  theme: 'dark' as Theme,
  notifyTrades: true,
  notifyPriceAlerts: false,
  notifyMonthly: true,
  createdAt: '',
  updatedAt: '',
}

function SettingsPageContent() {
  const { user } = useAuth() // ✅ Make sure user is authenticated
  const { settings, currencies, isLoading, error, fetchSettings, updateSettings, fetchCurrencies, clearError } =
    useSettingsStore()

  // Always use defined values
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // ✅ FIXED: Only fetch settings when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('🔐 User authenticated, fetching settings for:', user.email)
      fetchSettings()
      fetchCurrencies()
    }
  }, [user, fetchSettings, fetchCurrencies])

  // Update local settings when store settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ...DEFAULT_SETTINGS,
        ...settings, // Override defaults with actual settings
      })
    }
  }, [settings])

  const handleChange = (field: keyof typeof localSettings, value: any) => {
    const newSettings = { ...localSettings, [field]: value }
    setLocalSettings(newSettings)
    setHasChanges(true)
    clearError()
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    try {
      await updateSettings(localSettings)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        ...DEFAULT_SETTINGS,
        ...settings,
      })
    }
    setHasChanges(false)
    clearError()
  }

  // ✅ Show loading state when user is not yet authenticated
  if (!user) {
    return (
      <MobileLayout title='Settings' subtitle='Personalize your app'>
        <div className='theme-card p-6 text-center'>
          <div className='futuristic-avatar mx-auto mb-4 !w-16 !h-16'>
            <div className='w-8 h-8 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin'></div>
          </div>
          <p className='theme-text-primary font-medium'>Loading user session...</p>
        </div>
      </MobileLayout>
    )
  }

  if (isLoading && !settings) {
    return (
      <MobileLayout title='Settings' subtitle='Personalize your app'>
        <div className='space-y-8'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='theme-card p-6 animate-pulse'>
              <div className='h-5 bg-gray-700 rounded-xl mb-3 w-1/3'></div>
              <div className='h-4 bg-gray-800 rounded-lg w-2/3'></div>
            </div>
          ))}
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title='Settings' subtitle='Personalize your app'>
      <div className='space-y-8'>
        {/* Error Display */}
        {error && (
          <div className='theme-card p-4 border-l-4 border-red-500 bg-red-500/10'>
            <div className='flex items-center justify-between'>
              <p className='text-red-400 text-sm font-medium'>{error}</p>
              <button onClick={clearError} className='text-red-400 hover:text-red-300 text-xs'>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Save/Reset Actions - Fixed at top when changes exist */}
        {hasChanges && (
          <div className='theme-card p-4 border border-blue-500/30 bg-blue-500/5'>
            <div className='flex items-center justify-between'>
              <p className='text-blue-400 text-sm font-medium'>You have unsaved changes</p>
              <div className='flex gap-2'>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className='px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors rounded-lg border border-gray-700 hover:border-gray-600'
                >
                  <RefreshCw className='w-3 h-3 inline mr-1' />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50'
                >
                  {saving ? (
                    <>
                      <RefreshCw className='w-3 h-3 inline mr-1 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-3 h-3 inline mr-1' />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='futuristic-avatar !w-10 !h-10'>
              <Palette className='w-5 h-5 text-blue-400' />
            </div>
            <div>
              <h3 className='theme-text-primary font-semibold text-lg'>Appearance</h3>
              <p className='theme-text-secondary text-sm'>Customize your app's visual theme</p>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium theme-text-primary mb-3'>Theme</label>
              <div className='grid grid-cols-3 gap-3'>
                {(['light', 'dark', 'oled'] as Theme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleChange('theme', theme)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      localSettings.theme === theme
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className='flex flex-col items-center gap-2'>
                      {theme === 'light' && <Sun className='w-5 h-5 text-yellow-400' />}
                      {theme === 'dark' && <Moon className='w-5 h-5 text-blue-400' />}
                      {theme === 'oled' && <Smartphone className='w-5 h-5 text-purple-400' />}
                      <span className='text-sm font-medium theme-text-primary capitalize'>{theme}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='futuristic-avatar !w-10 !h-10'>
              <DollarSign className='w-5 h-5 text-green-400' />
            </div>
            <div>
              <h3 className='theme-text-primary font-semibold text-lg'>Currency & Finance</h3>
              <p className='theme-text-secondary text-sm'>Set your preferred currencies and trading defaults</p>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium theme-text-primary mb-2'>Default Currency</label>
                <select
                  value={localSettings.defaultCurrency}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  {currencies.length > 0 ? (
                    currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))
                  ) : (
                    <option value='USD'>USD - US Dollar</option>
                  )}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium theme-text-primary mb-2'>Display Currency</label>
                <select
                  value={localSettings.displayCurrency}
                  onChange={(e) => handleChange('displayCurrency', e.target.value)}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  {currencies.length > 0 ? (
                    currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))
                  ) : (
                    <option value='USD'>USD - US Dollar</option>
                  )}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium theme-text-primary mb-2'>Tax Rate (%)</label>
                <input
                  type='number'
                  min='0'
                  max='100'
                  step='0.1'
                  value={localSettings.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium theme-text-primary mb-2'>Default Fee</label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={localSettings.defaultFee}
                  onChange={(e) => handleChange('defaultFee', parseFloat(e.target.value) || 0)}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='futuristic-avatar !w-10 !h-10'>
              <Globe className='w-5 h-5 text-purple-400' />
            </div>
            <div>
              <h3 className='theme-text-primary font-semibold text-lg'>Regional</h3>
              <p className='theme-text-secondary text-sm'>Configure date and number formats</p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium theme-text-primary mb-2'>Date Format</label>
            <select
              value={localSettings.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='MM/dd/yyyy'>MM/dd/yyyy (US)</option>
              <option value='dd/MM/yyyy'>dd/MM/yyyy (EU)</option>
              <option value='yyyy-MM-dd'>yyyy-MM-dd (ISO)</option>
            </select>
          </div>
        </div>

        {/* Notification Settings */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='futuristic-avatar !w-10 !h-10'>
              <Bell className='w-5 h-5 text-orange-400' />
            </div>
            <div>
              <h3 className='theme-text-primary font-semibold text-lg'>Notifications</h3>
              <p className='theme-text-secondary text-sm'>Choose what notifications to receive</p>
            </div>
          </div>

          <div className='space-y-4'>
            {[
              { key: 'notifyTrades', label: 'Trade Confirmations', desc: 'Get notified when trades are added' },
              { key: 'notifyPriceAlerts', label: 'Price Alerts', desc: 'Alerts for significant price movements' },
              { key: 'notifyMonthly', label: 'Monthly Reports', desc: 'Monthly portfolio performance summaries' },
            ].map(({ key, label, desc }) => (
              <div key={key} className='flex items-center justify-between p-3 bg-gray-800/50 rounded-lg'>
                <div>
                  <p className='theme-text-primary font-medium'>{label}</p>
                  <p className='theme-text-secondary text-sm'>{desc}</p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onChange={(e) => handleChange(key as keyof typeof localSettings, e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* User Info Display */}
        <div className='theme-card p-6'>
          <h3 className='theme-text-primary font-semibold text-lg mb-4'>Account Information</h3>
          <div className='space-y-2'>
            <p className='theme-text-secondary text-sm'>
              <span className='font-medium'>Email:</span> {user.email}
            </p>
            <p className='theme-text-secondary text-sm'>
              <span className='font-medium'>Display Name:</span> {user.displayName || 'Not set'}
            </p>
            {settings && (
              <p className='theme-text-secondary text-sm'>
                <span className='font-medium'>Settings ID:</span> {settings.id}
              </p>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}

// ✅ FIXED: Wrap the entire page in ProtectedRoute
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}
