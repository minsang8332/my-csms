import { Calendar, Package, Search, ClipboardList, Boxes } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import PageHeader from '../components/layout/PageHeader'
import { useAlertStore } from '../stores/useAlertStore'
import type { CsBranch } from '../../../shared/api'
import Table, { TableColumn } from '../components/common/Table'
import Pagination from '../components/common/Pagination'

dayjs.extend(isBetween)

type SortKey = 'name' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const pageSizeOptions = [5, 10, 20, 50, 100]

type CsHistoryPageProps = {
  title?: string
  subLabel?: string | null
}

export default function CsHistoryPage({ title = 'CS 히스토리', subLabel }: CsHistoryPageProps) {
  const showAlert = useAlertStore((state) => state.showAlert)
  const [items, setItems] = useState<CsBranch[]>([])
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Date filter states (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>(
    dayjs().subtract(1, 'week').day(5).format('YYYY-MM-DD')
  )
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Repair Status states
  const [repairSortKey, setRepairSortKey] = useState<SortKey>('createdAt')
  const [repairSortDirection, setRepairSortDirection] = useState<SortDirection>('desc')
  const [repairPageSize, setRepairPageSize] = useState(5)
  const [repairCurrentPage, setRepairCurrentPage] = useState(1)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''

    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
      if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }

    if (numbers.startsWith('0')) {
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }

    if (numbers.startsWith('1') && numbers.length <= 8) {
      if (numbers.length <= 4) return numbers
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    }

    return numbers
  }

  const loadServiceCenters = async () => {
    if (!window.api || !window.api.cs) {
      console.warn('CS API를 아직 사용할 수 없습니다.')
      return
    }
    try {
      const data = await window.api.cs.readAll()
      if (Array.isArray(data)) {
        setItems(data)
      } else {
        setItems([])
      }
    } catch (error: any) {
      console.error('Failed to load CS data:', error)
      const errorMsg = error?.message || String(error)
      if (!errorMsg.includes('No handler registered') && !errorMsg.includes('Handler already registered')) {
        showAlert('지점 목록을 불러오는데 실패했습니다.', 'error')
      }
    }
  }

  useEffect(() => {
    loadServiceCenters()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, startDate, endDate])

  // Presets handler
  const applyDatePreset = (preset: 'today' | 'week' | 'month' | 'threeMonths' | 'all') => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    switch (preset) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        setStartDate(dayjs().subtract(7, 'day').format('YYYY-MM-DD'))
        setEndDate(todayStr)
        break
      case 'month':
        setStartDate(dayjs().subtract(1, 'month').format('YYYY-MM-DD'))
        setEndDate(todayStr)
        break
      case 'threeMonths':
        setStartDate(dayjs().subtract(3, 'month').format('YYYY-MM-DD'))
        setEndDate(todayStr)
        break
      case 'all':
      default:
        setStartDate('')
        setEndDate('')
        break
    }
  }

  // Filter source items by selected date range
  const periodItems = useMemo(() => {
    if (!startDate && !endDate) return items

    return items.filter((item) => {
      if (!item.createdAt) return false
      const itemDateStr = item.createdAt.slice(0, 10) // YYYY-MM-DD
      
      if (startDate && endDate) {
        return itemDateStr >= startDate && itemDateStr <= endDate
      } else if (startDate) {
        return itemDateStr >= startDate
      } else if (endDate) {
        return itemDateStr <= endDate
      }
      return true
    })
  }, [items, startDate, endDate])

  // Filter receipt items by selected date range and search query, excluding '접수취소' status
  const filteredReceiptItems = useMemo(() => {
    let result = periodItems.filter((item) => item.status !== '접수취소')

    // Filter by search query
    const normalizedSearch = search.trim().toLowerCase()
    if (normalizedSearch) {
      result = result.filter((item) =>
        [item.name, item.address || '', item.contact, item.status].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch)
        )
      )
    }

    return result
  }, [periodItems, search])

  const sortedItems = useMemo(() => {
    return [...filteredReceiptItems].sort((left, right) => {
      const valLeft = left[sortKey] ?? ''
      const valRight = right[sortKey] ?? ''
      const comparison = String(valLeft).localeCompare(String(valRight), 'ko')
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredReceiptItems, sortKey, sortDirection])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredReceiptItems.length / pageSize))
  }, [filteredReceiptItems.length, pageSize])

  const displayedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextSortKey)
    setSortDirection('asc')
  }

  const repairItems = useMemo(() => {
    return items.filter(item => item.status === '처리중' || item.status === '출고대기')
  }, [items])

  const sortedRepairItems = useMemo(() => {
    return [...repairItems].sort((left, right) => {
      const valLeft = left[repairSortKey] ?? ''
      const valRight = right[repairSortKey] ?? ''
      const comparison = String(valLeft).localeCompare(String(valRight), 'ko')
      return repairSortDirection === 'asc' ? comparison : -comparison
    })
  }, [repairItems, repairSortKey, repairSortDirection])

  const repairTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRepairItems.length / repairPageSize))
  }, [sortedRepairItems.length, repairPageSize])

  const displayedRepairItems = useMemo(() => {
    const start = (repairCurrentPage - 1) * repairPageSize
    return sortedRepairItems.slice(start, start + repairPageSize)
  }, [sortedRepairItems, repairCurrentPage, repairPageSize])

  const toggleRepairSort = (nextSortKey: SortKey) => {
    if (repairSortKey === nextSortKey) {
      setRepairSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setRepairSortKey(nextSortKey)
    setRepairSortDirection('asc')
  }

  // Aggregate shipped items from filtered CS branches ('출고완료') AND repairItems ('처리중', '출고대기')
  const aggregatedItems = useMemo(() => {
    const agg: Record<string, { name: string; count: number; price: number }> = {}
    
    // 1. 선택 기간 내의 출고 완료 건
    for (const item of periodItems) {
      if (item.status === '출고완료' && item.items && item.items.length > 0) {
        for (const shipped of item.items) {
          const priceVal = shipped.price || 0
          const key = `${shipped.name}_${priceVal}`
          if (!agg[key]) {
            agg[key] = { name: shipped.name, count: 0, price: priceVal }
          }
          agg[key].count += shipped.count || 0
        }
      }
    }

    // 2. 전체 기간의 처리중 / 출고대기 건
    for (const item of repairItems) {
      if (item.items && item.items.length > 0) {
        for (const shipped of item.items) {
          const priceVal = shipped.price || 0
          const key = `${shipped.name}_${priceVal}`
          if (!agg[key]) {
            agg[key] = { name: shipped.name, count: 0, price: priceVal }
          }
          agg[key].count += shipped.count || 0
        }
      }
    }

    return Object.values(agg)
      .map((data) => ({
        name: data.price === 0 ? `${data.name} (무상)` : data.name,
        count: data.count,
        price: data.price,
        total: data.count * data.price
      }))
      .sort((a, b) => b.count - a.count) // Sort by quantity descending
  }, [periodItems, repairItems])

  const aggregateTotalValue = useMemo(() => {
    return aggregatedItems.reduce((sum, item) => sum + item.total, 0)
  }, [aggregatedItems])

  const aggregateTotalCount = useMemo(() => {
    return aggregatedItems.reduce((sum, item) => sum + item.count, 0)
  }, [aggregatedItems])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '문의접수':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300'
      case '입고요청':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'
      case '처리중':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-400/10 dark:text-purple-300'
      case '처리완료':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-300'
      case '출고대기':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300'
      case '출고완료':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300'
      case '접수취소':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getStatusItemBadgeClass = (status: string) => {
    switch (status) {
      case '처리중':
        return 'bg-purple-50 border-purple-100 text-purple-800 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300'
      case '출고대기':
        return 'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-300'
      default:
        return 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
    }
  }

  const getStatusItemCountBadgeClass = (status: string) => {
    switch (status) {
      case '처리중':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-400/10'
      case '출고대기':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-400/10'
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-400/10'
    }
  }

  const columns: TableColumn<CsBranch>[] = [
    { key: 'name', label: '지점명', sortable: true },
    { key: 'status', label: '상태', sortable: true },
    { key: 'address', label: '주소', sortable: false, align: 'left' },
    { key: 'contact', label: '연락처', sortable: false },
    { key: 'items', label: '출고 항목 (수량 및 단가)', sortable: false, align: 'center' },
    { key: 'createdAt', label: '접수일자', sortable: true },
    { key: 'receivedAt', label: '입고일자', sortable: false },
    { key: 'shippedAt', label: '출고일자', sortable: false }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header with Calendar Range Controls */}
      <PageHeader
        title={title}
        subLabel={subLabel}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center bg-white/45 p-3 rounded-lg border border-emerald-100/50 dark:bg-slate-900/40 dark:border-emerald-900/30 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">접수일자</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                className="h-8 rounded border border-emerald-100/80 bg-white/70 px-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 cursor-pointer dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
              />
              <span className="text-slate-400 text-xs">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                className="h-8 rounded border border-emerald-100/80 bg-white/70 px-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 cursor-pointer dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-1">
              {(['today', 'week', 'month', 'threeMonths', 'all'] as const).map((preset) => {
                const labelMap = {
                  today: '오늘',
                  week: '1주일',
                  month: '1개월',
                  threeMonths: '3개월',
                  all: '전체'
                }
                return (
                  <button
                    key={preset}
                    onClick={() => applyDatePreset(preset)}
                    className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-[10px] font-medium text-emerald-800 transition dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
                    type="button"
                  >
                    {labelMap[preset]}
                  </button>
                )
              })}
            </div>
          </div>
        }
      />

      {/* 출고 집계 Card Section */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-emerald-100/30 dark:border-emerald-900/30 pb-3">
          <Boxes size={18} className="text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">출고 집계</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (선택 기간의 출고 완료 및 전체 기간의 수리/출고 대기 합산)
          </span>
        </div>

        {aggregatedItems.length > 0 ? (
          <div className="space-y-6">
            {/* Grid of Item Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {aggregatedItems.map((item) => (
                <div
                  key={item.name}
                  className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white/45 p-4 transition duration-200 hover:scale-[1.02] hover:shadow-md dark:border-slate-800 dark:bg-slate-950/25 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                        품목
                      </div>
                      <div className="text-base font-bold text-slate-950 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                      <Package size={18} />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">총 출고 수량</span>
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {item.count} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">개</span>
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between items-center text-[11px] text-slate-400">
                    <span>단가: {item.price.toLocaleString()}원</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      합계: {item.total.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Summary Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">총 출고 품목 가짓수</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {aggregatedItems.length} <span className="text-xs font-normal">종류</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">총 출고 품목 수량</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {aggregateTotalCount.toLocaleString()} <span className="text-xs font-normal">개</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block text-right">총 출고 합계 금액 (VAT 별도)</span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 text-right">
                  {aggregateTotalValue.toLocaleString()} <span className="text-sm font-normal">원</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Package size={36} className="mb-2 opacity-50" />
            <p className="text-sm">선택된 기간 또는 조건에 출고된 품목이 없습니다.</p>
          </div>
        )}
      </section>

      {/* 처리 현황 테이블 Section */}
      <section className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-emerald-100/30 dark:border-emerald-900/30 bg-purple-50/20 dark:bg-purple-950/5">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-purple-700 dark:text-purple-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">처리 현황</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (처리중 또는 출고대기 상태)
            </span>
            <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 text-[11px] font-semibold px-2 py-0.5 rounded-full dark:bg-purple-400/10 dark:text-purple-300 ml-2">
              {repairItems.length}건
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <select
                className="h-8 rounded border border-purple-100/80 bg-white/70 px-2 text-xs text-slate-800 outline-none transition focus:border-purple-500 dark:border-purple-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                value={repairPageSize}
                onChange={(event) => {
                  setRepairPageSize(Number(event.target.value))
                  setRepairCurrentPage(1)
                }}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}개씩
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <Table
          columns={columns}
          data={displayedRepairItems}
          sortKey={repairSortKey}
          sortDirection={repairSortDirection}
          onSort={toggleRepairSort as any}
          emptyMessage="현재 수리 중이거나 출고 대기 중인 내역이 없습니다."
          minWidth="min-w-[750px]"
          renderRow={(item) => (
            <tr
              key={item.id}
              className="text-slate-800 transition hover:bg-purple-50/50 dark:text-slate-100 dark:hover:bg-purple-400/10"
            >
              <td className="px-5 py-3 text-center font-medium">{item.name}</td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-5 py-3 text-left max-w-xs truncate" title={item.address || ''}>
                {item.address || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">{formatPhoneNumber(item.contact)}</td>
              <td className="px-5 py-3 text-center">
                {item.items && item.items.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
                    {item.items.map((it: any, idx: number) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${getStatusItemBadgeClass(item.status)}`}
                        title={`단가: ${it.price.toLocaleString()}원 | 합계: ${(it.price * it.count).toLocaleString()}원`}
                      >
                        <span className="font-medium">{it.name}</span>
                        <span className={`font-bold px-1 rounded-sm text-[10px] ${getStatusItemCountBadgeClass(item.status)}`}>
                          {it.count}개
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.createdAt ? item.createdAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.receivedAt ? item.receivedAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.shippedAt ? item.shippedAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
            </tr>
          )}
        />

        <Pagination
          currentPage={repairCurrentPage}
          totalPages={repairTotalPages}
          onPageChange={setRepairCurrentPage}
        />
      </section>

      {/* 접수 내역 테이블 Section */}
      <section className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-emerald-100/30 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/5">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">접수 내역</h2>
            <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full dark:bg-emerald-400/10 dark:text-emerald-300">
              {filteredReceiptItems.length}건
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <select
                className="h-8 rounded border border-emerald-100/80 bg-white/70 px-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}개씩
                  </option>
                ))}
              </select>
            </label>

            <label className="relative block w-48">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                className="h-8 w-full rounded border border-emerald-100/80 bg-white/70 pl-8 pr-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                placeholder="지점명, 주소, 연락처 검색"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </div>

        <Table
          columns={columns}
          data={displayedItems}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort as any}
          emptyMessage="조건에 일치하는 접수 내역이 없습니다."
          minWidth="min-w-[750px]"
          renderRow={(item) => (
            <tr
              key={item.id}
              className="text-slate-800 transition hover:bg-emerald-50/50 dark:text-slate-100 dark:hover:bg-emerald-400/10"
            >
              <td className="px-5 py-3 text-center font-medium">{item.name}</td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-5 py-3 text-left max-w-xs truncate" title={item.address || ''}>
                {item.address || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">{formatPhoneNumber(item.contact)}</td>
              <td className="px-5 py-3 text-center">
                {item.items && item.items.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
                    {item.items.map((it: any, idx: number) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${getStatusItemBadgeClass(item.status)}`}
                        title={`단가: ${it.price.toLocaleString()}원 | 합계: ${(it.price * it.count).toLocaleString()}원`}
                      >
                        <span className="font-medium">{it.name}</span>
                        <span className={`font-bold px-1 rounded-sm text-[10px] ${getStatusItemCountBadgeClass(item.status)}`}>
                          {it.count}개
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.createdAt ? item.createdAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.receivedAt ? item.receivedAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.shippedAt ? item.shippedAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
            </tr>
          )}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  )
}
