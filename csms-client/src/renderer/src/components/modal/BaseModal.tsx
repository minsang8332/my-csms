import { X } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'

type BaseModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  sidebar?: ReactNode
  widthClassName?: string
  heightClassName?: string
  onClose: () => void
}

function BaseModal({
  open,
  title,
  description,
  children,
  sidebar,
  widthClassName = 'max-w-4xl',
  heightClassName = 'max-h-[88vh]',
  onClose
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number | null>(null)

  // Open / Close animation lifecycle
  useEffect(() => {
    if (open) {
      setMounted(true)
      posRef.current = { x: 0, y: 0 }
      const timer = requestAnimationFrame(() => {
        setActive(true)
      })
      return () => cancelAnimationFrame(timer)
    } else {
      setActive(false)
      const timer = setTimeout(() => {
        setMounted(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle closing trigger with animation
  const handleClose = () => {
    setActive(false)
    setTimeout(() => {
      onClose()
    }, 180)
  }

  // Directly update DOM transform (0 React re-renders while dragging for 60/120fps smooth performance)
  const updateTransform = (x: number, y: number, scale = 1) => {
    if (modalRef.current) {
      modalRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    }
  }

  // Pointer Down on Header (Drag start)
  const handlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    e.preventDefault()
    const headerEl = e.currentTarget
    headerEl.style.cursor = 'grabbing'

    const startX = e.clientX
    const startY = e.clientY
    const initX = posRef.current.x
    const initY = posRef.current.y

    // Cache modal bounding box ONCE on drag start to prevent layout thrashing
    const rect = modalRef.current?.getBoundingClientRect()
    const modalWidth = rect?.width || 800
    const modalHeight = rect?.height || 600
    const maxDx = Math.max(0, (window.innerWidth - modalWidth) / 2 - 12)
    const maxDy = Math.max(0, (window.innerHeight - modalHeight) / 2 - 12)

    let currentX = initX
    let currentY = initY

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      let targetX = initX + deltaX
      let targetY = initY + deltaY
      let isColliding = false

      // Viewport Edge Collision Boundary Check
      if (targetX > maxDx) {
        targetX = maxDx
        isColliding = true
      } else if (targetX < -maxDx) {
        targetX = -maxDx
        isColliding = true
      }

      if (targetY > maxDy) {
        targetY = maxDy
        isColliding = true
      } else if (targetY < -maxDy) {
        targetY = -maxDy
        isColliding = true
      }

      currentX = targetX
      currentY = targetY

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }

      animFrameRef.current = requestAnimationFrame(() => {
        updateTransform(targetX, targetY, isColliding ? 0.995 : 1)
      })
    }

    const handlePointerUp = () => {
      headerEl.style.cursor = 'grab'
      posRef.current = { x: currentX, y: currentY }
      updateTransform(currentX, currentY, 1)

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 sm:p-6 backdrop-blur-xs transition-opacity duration-200 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={modalRef}
        style={{
          transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
        }}
        className={[
          'flex flex-col w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 transition-all duration-200 ease-out will-change-transform',
          active ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          heightClassName,
          widthClassName
        ].join(' ')}
      >
        {/* Modal Header */}
        <header
          onPointerDown={handlePointerDown}
          className="relative flex min-h-[72px] shrink-0 items-center justify-between border-b border-emerald-700/50 bg-emerald-600 px-6 py-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs cursor-grab select-none"
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white dark:text-slate-50">
              {title}
            </h2>
            {description ? (
              <p className="text-xs text-emerald-100 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Close modal"
            className="grid h-9 w-9 place-items-center rounded-lg text-emerald-100 transition-all hover:bg-emerald-700/60 hover:text-white focus:outline-none focus:ring-0 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            type="button"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex flex-1 min-h-0 bg-white dark:bg-slate-950">
          {sidebar ? (
            <aside className="w-56 shrink-0 border-r border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              {sidebar}
            </aside>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto p-6 bg-white dark:bg-slate-950">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default BaseModal
