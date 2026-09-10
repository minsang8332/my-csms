import React from 'react'
import { ArrowDownUp, ChevronDown, ChevronUp } from 'lucide-react'

export type TableColumn<T> = {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  widthClassName?: string
}

type TableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: any) => void
  renderRow: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  minWidth?: string
}

export default function Table<T>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  renderRow,
  emptyMessage = '일치하는 데이터가 없습니다.',
  minWidth = 'min-w-[750px]'
}: TableProps<T>) {
  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ArrowDownUp size={14} />
    }
    return sortDirection === 'asc' ? <ChevronUp size={15} /> : <ChevronDown size={15} />
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'left':
        return 'text-left'
      case 'right':
        return 'text-right'
      case 'center':
      default:
        return 'text-center'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} border-t border-emerald-100/80 text-center text-sm dark:border-emerald-900/60`}>
        <thead className="bg-emerald-50/70 text-xs uppercase text-slate-600 dark:bg-emerald-400/10 dark:text-slate-300">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-5 py-3 ${getAlignClass(column.align)} font-semibold ${column.widthClassName || ''}`}
              >
                {column.sortable && onSort ? (
                  <button
                    className="inline-flex items-center justify-center gap-1 rounded px-2 py-1 transition hover:bg-emerald-100/70 focus:outline-none focus-visible:outline-none dark:hover:bg-emerald-400/10"
                    type="button"
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    {renderSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100/70 dark:divide-emerald-900/60">
          {data.map((item, index) => renderRow(item, index))}

          {data.length === 0 ? (
            <tr>
              <td
                className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
