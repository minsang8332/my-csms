import React, { useState, useEffect } from 'react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageNumbers(currentPage: number, totalPages: number, maxVisible: number): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  let start = currentPage - Math.floor(maxVisible / 2)
  let end = start + maxVisible - 1

  if (start < 1) {
    start = 1
    end = maxVisible
  }

  if (end > totalPages) {
    end = totalPages
    start = Math.max(1, totalPages - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (totalPages <= 1) return null

  // Max 5 buttons on mobile screens, 7 on desktop
  const maxVisible = isMobile ? 5 : 7
  const visiblePages = getPageNumbers(currentPage, totalPages, maxVisible)

  return (
    <div className="flex items-center justify-center gap-1 px-3 sm:px-5 py-3 sm:py-4 border-t border-emerald-100/80 dark:border-emerald-900/60 bg-white/30 dark:bg-slate-950/20">
      {!isMobile && currentPage > 3 && totalPages > 7 && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          className="inline-flex h-8 min-w-[32px] px-2 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-xs font-medium text-slate-700 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
        >
          1..
        </button>
      )}

      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-slate-700 transition hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white/70 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
        aria-label="이전 페이지"
      >
        &lt;
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
            currentPage === page
              ? 'bg-emerald-600 text-white shadow-md dark:bg-emerald-500'
              : 'border border-emerald-100/80 bg-white/70 text-slate-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-slate-700 transition hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white/70 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
        aria-label="다음 페이지"
      >
        &gt;
      </button>

      {!isMobile && currentPage < totalPages - 2 && totalPages > 7 && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className="inline-flex h-8 min-w-[32px] px-2 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-xs font-medium text-slate-700 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
        >
          ..{totalPages}
        </button>
      )}
    </div>
  )
}
