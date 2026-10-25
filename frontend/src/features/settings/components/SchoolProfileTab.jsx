import React from 'react'
import {
  School,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sliders,
} from 'lucide-react'
import Button from '../../../components/ui/Button'

export default function SchoolProfileTab({ profile, setProfile, onSave, savingProfile }) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Institution Identification & Contact Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              These details appear on official report cards, fee receipts, and payroll slips.
            </p>
          </div>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={savingProfile}
          >
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">School / College Name *</label>
            <input
              required
              value={profile?.schoolName || ''}
              onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Registration / Affiliation Code</label>
            <input
              value={profile?.regNo || ''}
              onChange={(e) => setProfile({ ...profile, regNo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Official Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="email"
                value={profile?.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Primary Phone / Mobile</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profile?.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Emergency Hotline</label>
            <input
              value={profile?.hotline || ''}
              onChange={(e) => setProfile({ ...profile, hotline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profile?.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Campus Physical Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                rows={2}
                value={profile?.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">School Tagline / Motto</label>
            <input
              value={profile?.motto || ''}
              onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 italic"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Primary Brand Color (PDFs & Official Documents)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile?.primaryColor || '#3730A3'}
                onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                className="w-10 h-10 p-0.5 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={profile?.primaryColor || '#3730A3'}
                onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                placeholder="#3730A3"
                className="w-32 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <span className="text-xs text-gray-500 dark:text-slate-400">Used for PDF banners, receipts, report cards & payslips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional & Localization */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Regional & Formatting Preferences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Operating Currency</label>
            <select
              value={profile?.currency || 'PKR'}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="PKR">PKR — Pakistani Rupee (Rs.)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="SAR">SAR — Saudi Riyal (SR)</option>
              <option value="AED">AED — UAE Dirham (AED)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Timezone</label>
            <select
              value={profile?.timezone || 'Asia/Karachi (GMT+5)'}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="Asia/Karachi (GMT+5)">Asia/Karachi (GMT+5)</option>
              <option value="Asia/Dubai (GMT+4)">Asia/Dubai (GMT+4)</option>
              <option value="Asia/Riyadh (GMT+3)">Asia/Riyadh (GMT+3)</option>
              <option value="Europe/London (GMT+0/+1)">Europe/London (GMT+0/+1)</option>
              <option value="America/New_York (GMT-5)">America/New_York (GMT-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Date Display Format</label>
            <select
              value={profile?.dateFormat || 'DD/MM/YYYY'}
              onChange={(e) => setProfile({ ...profile, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/03/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-03)</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  )
}
