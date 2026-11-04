import React, { useState, useEffect } from 'react'
import { FileSpreadsheet, Sparkles, BarChart3 } from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import api from '../../lib/axios'
import ExportReportsTab from './components/ExportReportsTab'
import CustomReportBuilderTab from './components/CustomReportBuilderTab'
import AnalyticsIntelligenceTab from './components/AnalyticsIntelligenceTab'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('export') // 'export' | 'custom' | 'analytics'
  const [classesList, setClassesList] = useState([])

  useEffect(() => {
    api.get('/classes')
      .then(res => {
        if (res.data?.success) setClassesList(res.data.data || [])
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <Breadcrumb
        title="Reports & Analytics Center"
        subtitle="Export institutional ledgers, design dynamic custom reports, and explore revenue analytics."
      />

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 space-x-3 mb-6">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Data Reports (.xlsx)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Dynamic Custom Report Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial & Institutional Analytics</span>
        </button>
      </div>

      {activeTab === 'export' && <ExportReportsTab />}
      {activeTab === 'custom' && <CustomReportBuilderTab classesList={classesList} />}
      {activeTab === 'analytics' && <AnalyticsIntelligenceTab />}
    </div>
  )
}
