// app/settings/page.tsx (Futuristic Version)
'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useSettingsStore, Theme } from '@/stores/useSettingsStore'
import {
  Palette,
  DollarSign,
  Globe,
  Percent,
  Bell,
  Calendar,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Save,
  RefreshCw,
} from 'lucide-react'

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

export default function SettingsPage() {
  const { settings, currencies, isLoading, error, fetchSettings, updateSettings, fetchCurrencies, clearError } =
    useSettingsStore()

  // Always use defined values
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initialize settings
  useEffect(() => {
    fetchSettings()
    fetchCurrencies()
  }, [fetchSettings, fetchCurrencies])

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

  if (isLoading && !settings) {
    return (
      <MobileLayout title='Settings' subtitle='Personalize your app'>
        <div className='space-y-8'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='theme-card p-6 animate-pulse'>
              <div className='h-5 bg-gray-700 rounded-xl mb-3 w-1/3'></div>
              <div className='h-12 bg-gray-700 rounded-xl'></div>
            </div>
          ))}
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title='Settings' subtitle='Personalize your app'>
      <div className='space-y-8'>
        {/* Error Message */}
        {error && (
          <div className='theme-card !border-red-500/30 !bg-red-500/10 p-4'>
            <p className='text-red-400 text-sm font-medium'>{error}</p>
          </div>
        )}

        {/* Save Changes Bar */}
        {hasChanges && (
          <div className='theme-card !border-blue-500/30 !bg-blue-500/10 p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-blue-400 text-sm font-medium'>You have unsaved changes</p>
              <div className='flex gap-3'>
                <button onClick={handleReset} className='theme-button-secondary !py-2 !px-4 text-sm'>
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='theme-button-primary !py-2 !px-4 text-sm flex items-center gap-2'
                >
                  {saving ? <RefreshCw className='w-3 h-3 animate-spin' /> : <Save className='w-3 h-3' />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        <div className='theme-card'>
          <div className='p-6 border-b theme-border'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Palette className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Appearance</h3>
            </div>
          </div>

          <div className='p-6'>
            <label className='text-sm font-semibold theme-text-primary mb-4 block'>Theme</label>
            <div className='grid grid-cols-3 gap-4'>
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'oled', label: 'OLED', icon: Smartphone },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleChange('theme', value)}
                  className={`theme-selector-button ${localSettings.theme === value ? 'active' : ''}`}
                >
                  <Icon className='w-6 h-6 mx-auto mb-2 opacity-80' />
                  <div className='text-sm font-medium theme-text-primary'>{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className='theme-card'>
          <div className='p-6 border-b theme-border'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Globe className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Currency</h3>
            </div>
          </div>

          <div className='p-6 space-y-6'>
            <div>
              <label className='text-sm font-semibold theme-text-primary mb-3 block'>Default Currency</label>
              <select
                value={localSettings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className='theme-select w-full'
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className='text-xs theme-text-secondary mt-2 opacity-80'>
                Currency will be auto-detected from stock exchange
              </p>
            </div>

            <div>
              <label className='text-sm font-semibold theme-text-primary mb-3 block'>Display Currency</label>
              <select
                value={localSettings.displayCurrency}
                onChange={(e) => handleChange('displayCurrency', e.target.value)}
                className='theme-select w-full'
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className='text-xs theme-text-secondary mt-2 opacity-80'>
                Currency for portfolio summaries and reports
              </p>
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className='theme-card'>
          <div className='p-6 border-b theme-border'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <DollarSign className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Trading</h3>
            </div>
          </div>

          <div className='p-6 space-y-6'>
            <div>
              <label className='text-sm font-semibold theme-text-primary mb-3 block'>Default Commission Fee</label>
              <div className='relative'>
                <DollarSign className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  type='number'
                  value={localSettings.defaultFee}
                  onChange={(e) => handleChange('defaultFee', parseFloat(e.target.value) || 0)}
                  step='0.01'
                  min='0'
                  className='theme-input w-full pl-12'
                  placeholder='9.99'
                />
              </div>
              <p className='text-xs theme-text-secondary mt-2 opacity-80'>Default commission for new trades</p>
            </div>

            <div>
              <label className='text-sm font-semibold theme-text-primary mb-3 block'>Capital Gains Tax Rate</label>
              <div className='relative'>
                <Percent className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  type='number'
                  value={localSettings.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  step='0.1'
                  min='0'
                  max='100'
                  className='theme-input w-full pl-12'
                  placeholder='25.0'
                />
              </div>
              <p className='text-xs theme-text-secondary mt-2 opacity-80'>
                Tax rate for calculating after-tax P&L (0-100%)
              </p>
            </div>
          </div>
        </div>

        {/* Date Format */}
        <div className='theme-card'>
          <div className='p-6 border-b theme-border'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Calendar className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Date Format</h3>
            </div>
          </div>

          <div className='p-6'>
            <select
              value={localSettings.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className='theme-select w-full'
            >
              <option value='MM/dd/yyyy'>MM/DD/YYYY (US)</option>
              <option value='dd/MM/yyyy'>DD/MM/YYYY (EU)</option>
              <option value='yyyy-MM-dd'>YYYY-MM-DD (ISO)</option>
            </select>
            <p className='text-xs theme-text-secondary mt-2 opacity-80'>
              Example: {new Date().toLocaleDateString('en-US')}
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className='theme-card'>
          <div className='p-6 border-b theme-border'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Bell className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Notifications</h3>
            </div>
          </div>

          <div className='p-6 space-y-5'>
            {[
              { key: 'notifyTrades', label: 'Trade confirmations', desc: 'Get notified when trades are added' },
              { key: 'notifyPriceAlerts', label: 'Price alerts', desc: 'Notifications for price targets' },
              { key: 'notifyMonthly', label: 'Monthly reports', desc: 'Monthly performance summaries' },
            ].map(({ key, label, desc }) => (
              <div key={key} className='flex items-center justify-between py-2'>
                <div className='flex-1'>
                  <div className='theme-text-primary font-medium'>{label}</div>
                  <div className='text-sm theme-text-secondary opacity-80'>{desc}</div>
                </div>
                <button
                  onClick={() =>
                    handleChange(key as keyof typeof localSettings, !localSettings[key as keyof typeof localSettings])
                  }
                  className={`futuristic-toggle ${localSettings[key as keyof typeof localSettings] ? 'active' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button (Mobile) */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className='theme-button-primary w-full flex items-center justify-center gap-2'
          >
            {saving ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Save className='w-4 h-4' />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </MobileLayout>
  )
}
