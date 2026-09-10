import React, { useState, useRef, useLayoutEffect } from 'react'
import { Building2, Download, MapPin, Settings, Trash2, Truck } from 'lucide-react'

type CsStatsProps = {
  stats: {
    total: number
    received: number
    requestStock: number
    repairing: number
    shipping: number
    completed: number
    cancelled: number
  }
  selectedStatuses: string[]
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
}

type CardItem = {
  id: string
  label: string
  statusKey: string | 'ALL'
  getValue: (stats: CsStatsProps['stats']) => number
  Icon: any
  activeColorClass: string
  textColorClass: string
  iconBgClass: string
  iconActiveBgClass: string
}

const ALL_CARDS: CardItem[] = [
  {
    id: 'ALL',
    label: '전체 지점',
    statusKey: 'ALL',
    getValue: (s) => s.total,
    Icon: Building2,
    activeColorClass: 'bg-emerald-600/85 text-white dark:bg-emerald-600/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    textColorClass: 'text-emerald-700 dark:text-emerald-300',
    iconBgClass: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '문의접수',
    label: '문의 접수',
    statusKey: '문의접수',
    getValue: (s) => s.received,
    Icon: MapPin,
    activeColorClass: 'bg-blue-600/85 text-white dark:bg-blue-600/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(37,99,235,0.15)]',
    textColorClass: 'text-blue-600 dark:text-blue-400',
    iconBgClass: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-500 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '입고요청',
    label: '입고 요청',
    statusKey: '입고요청',
    getValue: (s) => s.requestStock,
    Icon: Download,
    activeColorClass: 'bg-amber-500/85 text-white dark:bg-amber-500/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
    textColorClass: 'text-amber-600 dark:text-amber-400',
    iconBgClass: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-500 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '처리중',
    label: '처리 중',
    statusKey: '처리중',
    getValue: (s) => s.repairing,
    Icon: Settings,
    activeColorClass: 'bg-purple-600/85 text-white dark:bg-purple-600/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(147,51,234,0.15)]',
    textColorClass: 'text-purple-600 dark:text-purple-400',
    iconBgClass: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-500 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '출고대기',
    label: '출고 대기',
    statusKey: '출고대기',
    getValue: (s) => s.shipping,
    Icon: Truck,
    activeColorClass: 'bg-orange-500/85 text-white dark:bg-orange-500/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(249,115,22,0.15)]',
    textColorClass: 'text-orange-600 dark:text-orange-400',
    iconBgClass: 'bg-orange-50/80 dark:bg-orange-950/40 text-orange-500 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '출고완료',
    label: '출고 완료',
    statusKey: '출고완료',
    getValue: (s) => s.completed,
    Icon: Building2,
    activeColorClass: 'bg-slate-600/85 text-white dark:bg-slate-600/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(71,85,105,0.15)]',
    textColorClass: 'text-slate-600 dark:text-slate-400',
    iconBgClass: 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/40',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  },
  {
    id: '접수취소',
    label: '접수 취소',
    statusKey: '접수취소',
    getValue: (s) => s.cancelled,
    Icon: Trash2,
    activeColorClass: 'bg-rose-600/85 text-white dark:bg-rose-600/75 border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(225,29,72,0.15)]',
    textColorClass: 'text-rose-600 dark:text-rose-400',
    iconBgClass: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-500 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30',
    iconActiveBgClass: 'bg-white/20 text-white backdrop-blur-md'
  }
]

const CARD_ORDER_STORAGE_KEY = 'csms:cs-stats-card-order'
const ALL_STATUSES = ['문의접수', '입고요청', '처리중', '출고대기', '출고완료', '접수취소']

export default function CsStats({ stats, selectedStatuses, setSelectedStatuses }: CsStatsProps) {
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CARD_ORDER_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Filter out deprecated cards like '처리완료' and keep valid ones
          const validIds = parsed.filter((id) => ALL_CARDS.some((c) => c.id === id))
          if (validIds.length === ALL_CARDS.length) {
            return validIds
          }
        }
      }
    } catch (err) {
      console.error('Failed to load card order from localStorage', err)
    }
    return ALL_CARDS.map((c) => c.id)
  })

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)

  // FLIP Layout Animation Refs
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevPositions = useRef<Map<string, DOMRect>>(new Map())

  // FLIP animation effect on cardOrder change
  useLayoutEffect(() => {
    cardRefs.current.forEach((el, id) => {
      if (!el) return
      const prevRect = prevPositions.current.get(id)
      if (prevRect) {
        const currentRect = el.getBoundingClientRect()
        const deltaX = prevRect.left - currentRect.left
        const deltaY = prevRect.top - currentRect.top

        if (deltaX !== 0 || deltaY !== 0) {
          // Invert position
          el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
          el.style.transition = 'none'

          // Force reflow
          void el.offsetHeight

          // Play smooth slide transition
          requestAnimationFrame(() => {
            el.style.transition = 'transform 320ms cubic-bezier(0.2, 0, 0, 1)'
            el.style.transform = 'translate3d(0, 0, 0)'
          })
        }
      }
    })

    // Record current rects for next update
    cardRefs.current.forEach((el, id) => {
      if (el) {
        prevPositions.current.set(id, el.getBoundingClientRect())
      }
    })
  }, [cardOrder])

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const toggleAll = () => {
    const allSelected = ALL_STATUSES.every((s) => selectedStatuses.includes(s))
    if (allSelected) {
      setSelectedStatuses([])
    } else {
      setSelectedStatuses(ALL_STATUSES)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  // Real-time card order update triggers FLIP layout animation
  const handleDragEnter = (targetId: string) => {
    if (!draggedCardId || draggedCardId === targetId) return

    setCardOrder((prevOrder) => {
      const fromIndex = prevOrder.indexOf(draggedCardId)
      const toIndex = prevOrder.indexOf(targetId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prevOrder

      const nextOrder = [...prevOrder]
      const [moved] = nextOrder.splice(fromIndex, 1)
      nextOrder.splice(toIndex, 0, moved)

      return nextOrder
    })
  }

  const handleDragEnd = () => {
    setDraggedCardId(null)
    try {
      localStorage.setItem(CARD_ORDER_STORAGE_KEY, JSON.stringify(cardOrder))
    } catch (err) {
      console.error('Failed to save card order to localStorage', err)
    }
  }

  // Ordered Card List
  const orderedCards = cardOrder
    .map((id) => ALL_CARDS.find((c) => c.id === id))
    .filter((c): c is CardItem => Boolean(c))

  return (
    <div className="grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
      {orderedCards.map((card) => {
        const isAll = card.statusKey === 'ALL'
        const isSelected = isAll
          ? ALL_STATUSES.every((s) => selectedStatuses.includes(s))
          : selectedStatuses.includes(card.statusKey)

        const isDraggingThis = draggedCardId === card.id
        const IconComp = card.Icon

        return (
          <div
            key={card.id}
            ref={(node) => {
              if (node) cardRefs.current.set(card.id, node)
              else cardRefs.current.delete(card.id)
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragEnter={() => handleDragEnter(card.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragEnd}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (isAll) {
                toggleAll()
              } else {
                toggleStatus(card.statusKey)
              }
            }}
            className={[
              'relative flex flex-col justify-between overflow-hidden rounded-xl p-3 sm:p-4 text-left select-none cursor-grab active:cursor-grabbing',
              // Subtle Elegant Glassmorphism System
              'backdrop-blur-md border transition-all duration-200',
              isSelected
                ? card.activeColorClass
                : 'bg-white/45 dark:bg-slate-900/45 border-white/60 dark:border-slate-800/60 opacity-75 dark:opacity-65 hover:opacity-100 hover:bg-white/70 dark:hover:bg-slate-900/70 shadow-xs',
              isDraggingThis
                ? 'opacity-25 border-dashed border-emerald-400'
                : ''
            ].join(' ')}
          >
            {/* Top Subtle Reflective Glass Line Accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 dark:via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between gap-1 relative z-10">
              <div>
                <div
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    isSelected ? 'text-white/95' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {card.label}
                </div>
                <div
                  className={`mt-1 sm:mt-1.5 text-xl sm:text-2xl font-black ${
                    isSelected ? 'text-white' : card.textColorClass
                  }`}
                >
                  {card.getValue(stats)}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  isSelected ? card.iconActiveBgClass : card.iconBgClass
                }`}
              >
                <IconComp size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
