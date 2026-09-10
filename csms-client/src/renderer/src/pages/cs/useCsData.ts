import { useState, useEffect, useMemo } from 'react'
import type { CsBranch } from '../../../../shared/api'
import { useAlertStore } from '../../stores/useAlertStore'

type SortKey = 'name' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const ALL_STATUSES = ['문의접수', '입고요청', '처리중', '출고대기', '출고완료', '접수취소']

export function useCsData() {
  const showAlert = useAlertStore((state) => state.showAlert)
  const [items, setItems] = useState<CsBranch[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  // Default selected statuses to ALL
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUSES)
  const [currentPage, setCurrentPage] = useState(1)

  const loadCss = async () => {
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

  const loadStatuses = async () => {
    if (!window.api || !window.api.cs) return
    try {
      const data = await window.api.cs.getStatuses()
      const filtered = Array.isArray(data) ? data.filter((s: string) => s !== '처리완료') : []
      setStatuses(filtered)
    } catch (error) {
      console.error('Failed to load statuses:', error)
    }
  }

  useEffect(() => {
    loadCss()
    loadStatuses()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, selectedStatuses])

  const stats = useMemo(() => {
    return {
      total: items.length,
      received: items.filter((b) => b.status === '문의접수').length,
      requestStock: items.filter((b) => b.status === '입고요청').length,
      repairing: items.filter((b) => b.status === '처리중').length,
      shipping: items.filter((b) => b.status === '출고대기').length,
      completed: items.filter((b) => b.status === '출고완료').length,
      cancelled: items.filter((b) => b.status === '접수취소').length
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const statusFiltered = items.filter((item) => selectedStatuses.includes(item.status))
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return statusFiltered

    return statusFiltered.filter((item) =>
      [item.name, item.address || '', item.contact, item.status].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    )
  }, [items, selectedStatuses, search])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((left, right) => {
      const valLeft = left[sortKey] ?? ''
      const valRight = right[sortKey] ?? ''
      const comparison = String(valLeft).localeCompare(String(valRight), 'ko')
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredItems, sortKey, sortDirection])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize))
  }, [filteredItems.length, pageSize])

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

  return {
    items,
    statuses,
    pageSize,
    setPageSize,
    search,
    setSearch,
    sortKey,
    sortDirection,
    selectedStatuses,
    setSelectedStatuses,
    currentPage,
    setCurrentPage,
    stats,
    totalPages,
    displayedItems,
    toggleSort,
    loadCss
  }
}
