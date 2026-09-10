import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/layout/PageHeader'
import { useAlertStore } from '../stores/useAlertStore'
import type { CsBranch } from '../../../shared/api'
import Table, { TableColumn } from '../components/common/Table'
import Pagination from '../components/common/Pagination'

import { useCsData } from './cs/useCsData'
import CsStats from './cs/CsStats'
import CsDeleteModal from './cs/CsDeleteModal'
import CsFormModal from './cs/CsFormModal'

const pageSizeOptions = [5, 10, 20, 50, 100]

type CsPageProps = {
  title?: string
  subLabel?: string | null
}

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

export default function CsPage({ title = 'CS 관리', subLabel }: CsPageProps) {
  const isWeb = window.api?.isWeb ?? false
  const showAlert = useAlertStore((state) => state.showAlert)
  
  // Data State Hook
  const {
    statuses,
    pageSize, setPageSize,
    search, setSearch,
    sortKey, sortDirection, toggleSort,
    selectedStatuses, setSelectedStatuses,
    currentPage, setCurrentPage,
    stats, totalPages, displayedItems,
    loadCss
  } = useCsData()

  // Modal States
  const [formOpen, setFormOpen] = useState(false)
  const [editingCs, setEditingCs] = useState<CsBranch | null>(null)
  const [deletingCs, setDeletingCs] = useState<CsBranch | null>(null)

  const openCreateModal = () => {
    setEditingCs(null)
    setFormOpen(true)
  }

  const openEditModal = (cs: CsBranch) => {
    setEditingCs(cs)
    setFormOpen(true)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    setEditingCs(null)
  }

  const confirmDelete = async () => {
    if (!deletingCs) return
    try {
      await window.api.cs.remove(deletingCs.id)
      showAlert('지점이 삭제되었습니다.', 'success')
      await loadCss()
    } catch (error) {
      console.error('Failed to delete CS branch:', error)
      showAlert('지점 삭제에 실패했습니다.', 'error')
    } finally {
      setDeletingCs(null)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '문의접수': return 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300'
      case '입고요청': return 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'
      case '처리중': return 'bg-purple-100 text-purple-800 dark:bg-purple-400/10 dark:text-purple-300'
      case '처리완료': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-300'
      case '출고대기': return 'bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300'
      case '출고완료': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300'
      case '접수취소': return 'bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const columns: TableColumn<CsBranch>[] = [
    { key: 'name', label: '지점명', sortable: true },
    { key: 'status', label: '상태', sortable: true },
    { key: 'address', label: '주소', sortable: false, align: 'left' },
    { key: 'contact', label: '연락처', sortable: false },
    { key: 'items', label: '출고 항목', sortable: false },
    { key: 'createdAt', label: '접수일자', sortable: true },
    { key: 'receivedAt', label: '입고일자', sortable: false },
    { key: 'shippedAt', label: '출고일자', sortable: false },
    { key: 'actions', label: '작업', sortable: false, widthClassName: 'w-28' }
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subLabel={subLabel}
        action={
          !isWeb ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              type="button"
              onClick={openCreateModal}
            >
              <Plus size={17} />
              지점 추가
            </button>
          ) : null
        }
      />

      <CsStats 
        stats={stats} 
        selectedStatuses={selectedStatuses} 
        setSelectedStatuses={setSelectedStatuses} 
      />

      <section className="glass-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <select
                className="h-10 rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              개씩 보기
            </label>
          </div>

          <label className="relative block w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              className="h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
              placeholder="지점명, 주소, 연락처 검색"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <Table
          columns={columns}
          data={displayedItems}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort as any}
          emptyMessage="일치하는 지점 데이터가 없습니다."
          minWidth="min-w-[750px]"
          renderRow={(item) => (
            <tr
              key={item.id}
              className="cursor-pointer text-slate-800 transition hover:bg-emerald-50/50 dark:text-slate-100 dark:hover:bg-emerald-400/10"
              onClick={() => openEditModal(item)}
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
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {(() => {
                  if (!item.items || item.items.length === 0) return <span className="text-slate-400">-</span>
                  const subtotal = item.items.reduce((sum, i) => sum + (i.price || 0) * (i.count || 0), 0)
                  const vat = Math.floor(subtotal * 0.1)
                  const total = subtotal + vat
                  return (
                    <span className="cursor-help underline decoration-dotted" title={item.items.map((i) => `${i.name} (단가: ${i.price.toLocaleString()}원, ${i.count}개)`).join(', ')}>
                      {item.items.length}개 항목 (총 {total.toLocaleString()}원)
                    </span>
                  )
                })()}
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
              <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center gap-1">
                  <button
                    aria-label={isWeb ? '지점 상세 보기' : '지점 수정'}
                    title={isWeb ? '상세 보기' : '수정'}
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                    type="button"
                    onClick={() => openEditModal(item)}
                  >
                    {isWeb ? <Eye size={16} /> : <Pencil size={16} />}
                  </button>
                  {!isWeb && (
                    <button
                      aria-label="지점 삭제"
                      title="삭제"
                      className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                      type="button"
                      onClick={() => setDeletingCs(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </section>

      {/* Extracted Modals */}
      <CsFormModal 
        open={formOpen} 
        editingCs={editingCs} 
        statuses={statuses} 
        onClose={closeFormModal} 
        onSuccess={loadCss} 
      />
      <CsDeleteModal 
        deletingCs={deletingCs} 
        setDeletingCs={setDeletingCs} 
        onConfirm={confirmDelete} 
      />
    </div>
  )
}
