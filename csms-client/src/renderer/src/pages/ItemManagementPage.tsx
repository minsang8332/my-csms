import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { ItemInput, StoredItem } from '../../../shared/api'
import BaseModal from '../components/modal/BaseModal'
import PageHeader from '../components/layout/PageHeader'
import { useAlertStore } from '../stores/useAlertStore'
import Table, { TableColumn } from '../components/common/Table'
import Pagination from '../components/common/Pagination'

type ItemManagementPageProps = {
  title?: string
  subLabel?: string | null
}

type ItemFormState = {
  name: string
  price: string
  count: string
}

const pageSizeOptions = [5, 10, 20, 50, 100]

const emptyForm: ItemFormState = {
  name: '',
  price: '',
  count: ''
}

type SortKey = 'name' | 'price' | 'count'
type SortDirection = 'asc' | 'desc'

function toFormState(item: StoredItem): ItemFormState {
  return {
    name: item.name,
    price: String(item.price),
    count: String(item.count)
  }
}

function toItemInput(form: ItemFormState): ItemInput {
  return {
    name: form.name,
    price: Number(form.price),
    count: Number(form.count)
  }
}

function isValidItemInput(item: ItemInput): boolean {
  return (
    item.name.trim().length > 0 &&
    Number.isInteger(item.price) &&
    item.price >= 0 &&
    Number.isInteger(item.count) &&
    item.count >= 0
  )
}

export default function ItemManagementPage({ title = '재고 관리', subLabel }: ItemManagementPageProps) {
  const isWeb = window.api?.isWeb ?? false
  const showAlert = useAlertStore((state) => state.showAlert)
  const [items, setItems] = useState<StoredItem[]>([])
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<ItemFormState>(emptyForm)
  const [editingItem, setEditingItem] = useState<StoredItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<StoredItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const loadItems = async () => {
    setLoading(true)
    try {
      if (window.api && window.api.item) {
        setItems(await window.api.item.readAll())
      }
    } catch {
      showAlert('품목 목록을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return items

    return items.filter((item) =>
      [item.name, item.price, item.count].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    )
  }, [items, search])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((left, right) => {
      let comparison = 0
      if (sortKey === 'name') {
        comparison = left.name.localeCompare(right.name, 'ko')
      } else {
        comparison = left[sortKey] - right[sortKey]
      }
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditModal = (item: StoredItem) => {
    setEditingItem(item)
    setForm(toFormState(item))
    setFormOpen(true)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const itemInput = toItemInput(form)
    if (!isValidItemInput(itemInput)) {
      showAlert('올바른 값을 입력해주세요.', 'error')
      return
    }

    try {
      if (editingItem) {
        await window.api.item.edit({
          id: editingItem.id,
          ...itemInput
        })
        showAlert('품목 정보를 수정했습니다.', 'success')
      } else {
        await window.api.item.create(itemInput)
        showAlert('품목을 추가했습니다.', 'success')
      }

      closeFormModal()
      await loadItems()
    } catch {
      showAlert('품목 저장에 실패했습니다.', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deletingItem) return

    try {
      await window.api.item.remove(deletingItem.id)
      showAlert('품목을 삭제했습니다.', 'success')
      setDeletingItem(null)
      await loadItems()
    } catch {
      showAlert('품목 삭제에 실패했습니다.', 'error')
    }
  }

  const columns: TableColumn<StoredItem>[] = [
    { key: 'name', label: '품목명', sortable: true, align: 'center' },
    { key: 'price', label: '가격', sortable: true, align: 'center' },
    { key: 'count', label: '수량', sortable: true, align: 'center' },
    { key: 'actions', label: '작업', sortable: false, align: 'center', widthClassName: 'w-28' }
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
              추가
            </button>
          ) : null
        }
      />

      <section className="glass-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
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

          <label className="relative block w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
              placeholder="검색"
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
          onSort={handleSort as any}
          emptyMessage={loading ? '불러오는 중...' : '데이터가 없습니다.'}
          minWidth="min-w-[680px]"
          renderRow={(item) => (
            <tr
              key={item.id}
              className="text-slate-800 transition hover:bg-emerald-50/50 dark:text-slate-100 dark:hover:bg-emerald-400/10"
            >
              <td className="px-5 py-3 text-center">{item.name}</td>
              <td className="px-5 py-3 text-center">{item.price.toLocaleString()}원</td>
              <td className="px-5 py-3 text-center">{item.count.toLocaleString()}개</td>
              <td className="px-5 py-3 text-center">
                <div className="flex justify-center gap-1">
                  <button
                    aria-label={isWeb ? '품목 상세 보기' : '품목 수정'}
                    title={isWeb ? '상세 보기' : '수정'}
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                    type="button"
                    onClick={() => openEditModal(item)}
                  >
                    {isWeb ? <Eye size={16} /> : <Pencil size={16} />}
                  </button>
                  {!isWeb && (
                    <button
                      aria-label="품목 삭제"
                      title="삭제"
                      className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                      type="button"
                      onClick={() => setDeletingItem(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
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

      <BaseModal
        open={formOpen}
        title={isWeb ? '품목 상세 정보' : (editingItem ? '품목 수정' : '품목 추가')}
        widthClassName="max-w-lg"
        onClose={closeFormModal}
      >
        <form className="space-y-4" onSubmit={submitForm}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            품목명
            <input
              className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100 disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
              required
              disabled={isWeb}
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            가격 (원)
            <input
              className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100 disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
              min={0}
              required
              disabled={isWeb}
              type="number"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            수량 (개)
            <input
              className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100 disabled:bg-slate-50 disabled:text-slate-600 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400"
              min={0}
              required
              disabled={isWeb}
              type="number"
              value={form.count}
              onChange={(event) =>
                setForm((current) => ({ ...current, count: event.target.value }))
              }
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-md border border-emerald-100/80 bg-white/50 px-4 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
              type="button"
              onClick={closeFormModal}
            >
              {isWeb ? '닫기' : '취소'}
            </button>
            {!isWeb && (
              <button
                className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                type="submit"
              >
                저장
              </button>
            )}
          </div>
        </form>
      </BaseModal>

      <BaseModal
        open={Boolean(deletingItem)}
        title="품목 삭제"
        widthClassName="max-w-md"
        onClose={() => setDeletingItem(null)}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {deletingItem ? `정말로 [${deletingItem.name}] 품목을 삭제하시겠습니까?` : ''}
          </p>

          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-md border border-emerald-100/80 bg-white/50 px-4 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
              type="button"
              onClick={() => setDeletingItem(null)}
            >
              취소
            </button>
            <button
              className="h-10 rounded-md bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700"
              type="button"
              onClick={confirmDelete}
            >
              확인
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  )
}
