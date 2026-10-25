import React, { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Inbox,
  X,
} from 'lucide-react'
import EmptyState from './EmptyState'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  searchable = true,
  searchPlaceholder = 'Search in records...',
  selectable = false,
  onSelectionChange,
  bulkActions,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [isCompact, setIsCompact] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Handle Sort
  const handleSort = (key) => {
    if (!key) return
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        return { key: null, direction: 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  // Filter Data by Search Term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const query = searchTerm.toLowerCase().trim()
    return data.filter((row) =>
      Object.entries(row).some(([_, val]) => {
        if (val === null || val === undefined) return false
        if (typeof val === 'object') return false
        return String(val).toLowerCase().includes(query)
      })
    )
  }, [data, searchTerm])

  // Sort Filtered Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [filteredData, sortConfig])

  // Paginate Sorted Data
  const totalRecords = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedData.map((row, idx) => row._id || String(idx)))
      setSelectedIds(allIds)
      onSelectionChange && onSelectionChange(Array.from(allIds))
    } else {
      setSelectedIds(new Set())
      onSelectionChange && onSelectionChange([])
    }
  }

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      onSelectionChange && onSelectionChange(Array.from(next))
      return next
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3">Loading records...</p>
      </div>
    )
  }

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, idx) => selectedIds.has(row._id || String(idx)))

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Toolbar Header */}
      {(searchable || selectable || bulkActions) && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Right Toolbar Controls: Selection Count / Density Toggle */}
          <div className="flex items-center gap-2 justify-end">
            {selectedIds.size > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {selectedIds.size} selected
              </span>
            )}
            {bulkActions && selectedIds.size > 0 && bulkActions(Array.from(selectedIds))}

            {/* Density Toggle Button */}
            <button
              onClick={() => setIsCompact((c) => !c)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-xs"
              title={isCompact ? 'Comfortable Density' : 'Compact Density'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        {totalRecords === 0 ? (
          <EmptyState
            icon={Inbox}
            title={emptyMessage}
            description={
              searchTerm ? `No records matched your search query "${searchTerm}".` : 'No data available in this table.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  {selectable && (
                    <th className="px-4 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20"
                      />
                    </th>
                  )}
                  {columns.map((col, index) => {
                    const sortKey = col.accessorKey || col.key
                    const isSorted = sortConfig.key === sortKey
                    const isSortable = col.sortable !== false && !!sortKey

                    return (
                      <th
                        key={index}
                        onClick={() => isSortable && handleSort(sortKey)}
                        className={`px-5 py-3 select-none ${
                          isSortable ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.header}</span>
                          {isSortable && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                )
                              ) : (
                                <ChevronsUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {paginatedData.map((row, rowIndex) => {
                  const rowId = row._id || String(rowIndex)
                  const isSelected = selectedIds.has(rowId)

                  return (
                    <tr
                      key={rowId}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {selectable && (
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(rowId)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20"
                          />
                        </td>
                      )}
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-5 ${
                            isCompact ? 'py-2' : 'py-3.5'
                          } whitespace-nowrap transition-all`}
                        >
                          {col.cell ? col.cell(row) : row[col.accessorKey]}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                {pageSizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              <span className="tabular-nums ml-2">
                Showing <strong className="text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
                <strong className="text-slate-700 dark:text-slate-200">{totalRecords}</strong>
              </span>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
