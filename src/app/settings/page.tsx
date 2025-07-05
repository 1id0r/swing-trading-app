// app/settings/page.tsx (Fixed Controlled Inputs)
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
        <div className='space-y-6'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='bg-gray-800/50 rounded-xl p-4 border border-gray-700 animate-pulse'>
              <div className='h-4 bg-gray-700 rounded mb-2 w-1/3'></div>
              <div className='h-8 bg-gray-700 rounded'></div>
            </div>
          ))}
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title='Settings' subtitle='Personalize your app'>
      <div className='space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Save Changes Bar */}
        {hasChanges && (
          <div className='bg-blue-500/20 border border-blue-500 rounded-lg p-3 flex items-center justify-between'>
            <p className='text-blue-400 text-sm'>You have unsaved changes</p>
            <div className='flex gap-2'>
              <button onClick={handleReset} className='text-gray-400 hover:text-white text-sm px-3 py-1 rounded'>
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm px-3 py-1 rounded flex items-center gap-1'
              >
                {saving ? <RefreshCw className='w-3 h-3 animate-spin' /> : <Save className='w-3 h-3' />}
                Save
              </button>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
          <div className='p-4 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <Palette className='w-5 h-5 text-blue-400' />
              <h3 className='text-lg font-semibold text-white'>Appearance</h3>
            </div>
          </div>

          <div className='p-4'>
            <label className='text-sm font-medium text-gray-400 mb-3 block'>Theme</label>
            <div className='grid grid-cols-3 gap-3'>
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'oled', label: 'OLED', icon: Smartphone },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleChange('theme', value)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    localSettings.theme === value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Icon className='w-5 h-5 mx-auto mb-1 text-gray-400' />
                  <div className='text-sm text-white'>{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
          <div className='p-4 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <Globe className='w-5 h-5 text-blue-400' />
              <h3 className='text-lg font-semibold text-white'>Currency</h3>
            </div>
          </div>

          <div className='p-4 space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-400 mb-2 block'>Default Currency</label>
              <select
                value={localSettings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none'
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className='text-xs text-gray-500 mt-1'>Currency will be auto-detected from stock exchange</p>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-400 mb-2 block'>Display Currency</label>
              <select
                value={localSettings.displayCurrency}
                onChange={(e) => handleChange('displayCurrency', e.target.value)}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none'
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className='text-xs text-gray-500 mt-1'>Currency for portfolio summaries and reports</p>
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
          <div className='p-4 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <DollarSign className='w-5 h-5 text-blue-400' />
              <h3 className='text-lg font-semibold text-white'>Trading</h3>
            </div>
          </div>

          <div className='p-4 space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-400 mb-2 block'>Default Commission Fee</label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                <input
                  type='number'
                  value={localSettings.defaultFee}
                  onChange={(e) => handleChange('defaultFee', parseFloat(e.target.value) || 0)}
                  step='0.01'
                  min='0'
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-blue-500 focus:outline-none'
                  placeholder='9.99'
                />
              </div>
              <p className='text-xs text-gray-500 mt-1'>Default commission for new trades</p>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-400 mb-2 block'>Capital Gains Tax Rate</label>
              <div className='relative'>
                <Percent className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                <input
                  type='number'
                  value={localSettings.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  step='0.1'
                  min='0'
                  max='100'
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-blue-500 focus:outline-none'
                  placeholder='25.0'
                />
              </div>
              <p className='text-xs text-gray-500 mt-1'>Tax rate for calculating after-tax P&L (0-100%)</p>
            </div>
          </div>
        </div>

        {/* Date Format */}
        <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
          <div className='p-4 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-blue-400' />
              <h3 className='text-lg font-semibold text-white'>Date Format</h3>
            </div>
          </div>

          <div className='p-4'>
            <select
              value={localSettings.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none'
            >
              <option value='MM/dd/yyyy'>MM/DD/YYYY (US)</option>
              <option value='dd/MM/yyyy'>DD/MM/YYYY (EU)</option>
              <option value='yyyy-MM-dd'>YYYY-MM-DD (ISO)</option>
            </select>
            <p className='text-xs text-gray-500 mt-1'>Example: {new Date().toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* Notifications */}
        <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
          <div className='p-4 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <Bell className='w-5 h-5 text-blue-400' />
              <h3 className='text-lg font-semibold text-white'>Notifications</h3>
            </div>
          </div>

          <div className='p-4 space-y-3'>
            {[
              { key: 'notifyTrades', label: 'Trade confirmations', desc: 'Get notified when trades are added' },
              { key: 'notifyPriceAlerts', label: 'Price alerts', desc: 'Notifications for price targets' },
              { key: 'notifyMonthly', label: 'Monthly reports', desc: 'Monthly performance summaries' },
            ].map(({ key, label, desc }) => (
              <div key={key} className='flex items-center justify-between'>
                <div>
                  <div className='text-white font-medium'>{label}</div>
                  <div className='text-sm text-gray-400'>{desc}</div>
                </div>
                <button
                  onClick={() =>
                    handleChange(key as keyof typeof localSettings, !localSettings[key as keyof typeof localSettings])
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings[key as keyof typeof localSettings] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings[key as keyof typeof localSettings] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button (Mobile) */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            {saving ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Save className='w-4 h-4' />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </MobileLayout>
  )
}
