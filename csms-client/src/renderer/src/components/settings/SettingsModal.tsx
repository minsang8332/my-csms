import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { SerialPortInfo } from '../../../../shared/api'
import BaseModal from '../modal/BaseModal'

type SettingsMenu = 'device'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeMenu, setActiveMenu] = useState<SettingsMenu>('device')
  const [ports, setPorts] = useState<SerialPortInfo[]>([])
  const [selectedPortPath, setSelectedPortPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshPorts = useCallback(async () => {
    setLoading(true)

    try {
      const serialPorts = await window.api.setting.getSerialPortList()
      console.log('[serial-port:list]', serialPorts)
      setPorts(serialPorts)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSelectedSerialPort = useCallback(async () => {
    const settingState = await window.api.setting.getSerialPortSetting()
    console.log('[serial-port:selected:stored]', settingState.selectedPort)
    setSelectedPortPath(settingState.selectedPort?.path ?? null)
  }, [])

  const toggleSerialPort = async (port: SerialPortInfo) => {
    const nextSettings = await window.api.setting.toggleSerialPort(port)
    console.log('[serial-port:selected:toggled]', nextSettings)
    setSelectedPortPath(nextSettings.selectedPort?.path ?? null)
  }

  useEffect(() => {
    if (!open || activeMenu !== 'device') {
      return
    }

    refreshPorts()
    loadSelectedSerialPort()

    const unsubscribe = window.api.setting.onSerialPortListChanged((newPorts) => {
      setPorts(newPorts)
      setSelectedPortPath((current) => {
        if (current && !newPorts.some((port) => port.path === current)) {
          return null
        }
        return current
      })
    })

    return () => {
      unsubscribe()
    }
  }, [activeMenu, loadSelectedSerialPort, open, refreshPorts])

  const sidebar = (
    <button
      className={[
        'h-10 w-full rounded-md px-3 text-left text-sm font-medium transition',
        activeMenu === 'device'
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950'
          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
      ].join(' ')}
      type="button"
      onClick={() => setActiveMenu('device')}
    >
      장치 설정
    </button>
  )

  return (
    <BaseModal
      open={open}
      title="장치 설정"
      description="시리얼 포트 장치 설정"
      sidebar={sidebar}
      onClose={onClose}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          시리얼 포트 목록
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          type="button"
          disabled={loading}
          onClick={refreshPorts}
        >
          <RefreshCw
            className={loading ? 'animate-spin' : ''}
            size={16}
          />
          새로고침
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-100/80 bg-white/45 backdrop-blur-xl dark:border-emerald-900/60 dark:bg-white/5">
        {ports.length > 0 ? (
          <div className="divide-y divide-emerald-100/80 dark:divide-emerald-900/60">
            {ports.map((port) => (
              <button
                key={port.path}
                className={[
                  'grid w-full gap-2 p-4 text-left transition sm:grid-cols-[180px_1fr]',
                  selectedPortPath === port.path
                    ? 'bg-emerald-100/80 dark:bg-emerald-400/15'
                    : 'hover:bg-emerald-50/70 dark:hover:bg-emerald-400/10'
                ].join(' ')}
                type="button"
                onClick={() => toggleSerialPort(port)}
              >
                <div className="font-medium text-slate-950 dark:text-white">
                  {port.path}
                  {selectedPortPath === port.path ? (
                    <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-emerald-400 dark:text-emerald-950">
                      연결됨
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {port.manufacturer ?? '알 수 없는 제조사'}
                  {port.vendorId ? ` / VID ${port.vendorId}` : ''}
                  {port.productId ? ` / PID ${port.productId}` : ''}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid h-48 place-items-center text-sm text-slate-500 dark:text-slate-400">
            {loading ? '시리얼 포트를 찾는 중...' : '검색된 시리얼 포트가 없습니다.'}
          </div>
        )}
      </div>

    </BaseModal>
  )
}

export default SettingsModal
