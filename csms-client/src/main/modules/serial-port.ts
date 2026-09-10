import { SerialPort } from 'serialport'
import type {
  SerialPortInfo,
  SerialPortSettingState,
  StoredSerialPortSetting
} from '../../shared/api'
import type { StoreRepository } from './electron-store'

const settingCollection = 'setting'
const serialPortSettingKey = 'serial-port'
const serialCommandSettingKey = 'serial-command'
const pollingIntervalMs = 20000

let initialized = false
let storeRepository: StoreRepository | null = null
let currentPort: SerialPort | null = null
let currentPortPath: string | null = null
let pollingTimer: NodeJS.Timeout | null = null
let onListChanged: ((ports: SerialPortInfo[]) => void) | null = null
let onDataReceived: ((payload: { path: string; data: string }) => void) | null = null

type InitOptions = {
  storeRepository: StoreRepository
  onListChanged?: (ports: SerialPortInfo[]) => void
  onDataReceived?: (payload: { path: string; data: string }) => void
}

function requireStoreRepository(): StoreRepository {
  if (!storeRepository) {
    throw new Error('Serial port module has not been initialized.')
  }

  return storeRepository
}

function toStoredSerialPortSetting(port: SerialPortInfo): StoredSerialPortSetting {
  return {
    path: port.path,
    manufacturer: port.manufacturer ?? null,
    serialNumber: port.serialNumber ?? null,
    pnpId: port.pnpId ?? null,
    locationId: port.locationId ?? null,
    productId: port.productId ?? null,
    vendorId: port.vendorId ?? null
  }
}

function getSelectedPortSetting(): StoredSerialPortSetting | null {
  const storedValue = requireStoreRepository().read<StoredSerialPortSetting>(
    settingCollection,
    serialPortSettingKey
  )

  return storedValue?.path ? storedValue : null
}

function getSerialCommand(): string {
  return (
    requireStoreRepository().read<string>(settingCollection, serialCommandSettingKey) ?? ''
  )
}

function disconnectCurrentPort(): void {
  if (!currentPort) {
    return
  }

  const port = currentPort
  currentPort = null
  currentPortPath = null

  if (port.isOpen) {
    port.close((error) => {
      if (error) {
        console.error('[serial-port:close:error]', error)
      }
    })
  }
}

function connect(path: string): void {
  if (currentPortPath === path && currentPort?.isOpen) {
    return
  }

  disconnectCurrentPort()

  currentPort = new SerialPort({
    path,
    baudRate: 115200,
    autoOpen: false
  })
  currentPortPath = path

  currentPort.on('data', (data: Buffer) => {
    const payload = {
      path,
      data: data.toString('utf8')
    }
    // console.log('[serial-port:data]', payload)
    onDataReceived?.(payload)
  })

  currentPort.on('error', (error) => {
    console.error('[serial-port:error]', error)
  })

  currentPort.open((error) => {
    if (error) {
      console.error('[serial-port:open:error]', error)
      disconnectCurrentPort()
      return
    }

    console.log('[serial-port:connected]', path)
  })
}

export function init(options?: InitOptions): boolean {
  if (options) {
    storeRepository = options.storeRepository
    onListChanged = options.onListChanged ?? null
    onDataReceived = options.onDataReceived ?? null
  }

  initialized = true
  return initialized
}

export async function getList(): Promise<SerialPortInfo[]> {
  if (!initialized) {
    init()
  }

  const ports = await SerialPort.list()

  return ports.map((port) => ({
    path: port.path,
    manufacturer: port.manufacturer,
    serialNumber: port.serialNumber,
    pnpId: port.pnpId,
    locationId: port.locationId,
    productId: port.productId,
    vendorId: port.vendorId
  }))
}

export function getSetting(): SerialPortSettingState {
  return {
    selectedPort: getSelectedPortSetting(),
    command: getSerialCommand()
  }
}

export async function refreshList(): Promise<SerialPortInfo[]> {
  const ports = await getList()
  const selectedPort = getSelectedPortSetting()

  if (selectedPort) {
    const exists = ports.some((port) => port.path === selectedPort.path)

    if (exists) {
      connect(selectedPort.path)
    } else {
      requireStoreRepository().remove(settingCollection, serialPortSettingKey)
      disconnectCurrentPort()
      console.log('[serial-port:selected:cleared:missing]', selectedPort)
    }
  }

  onListChanged?.(ports)
  return ports
}

export async function toggleSelectedPort(
  port: SerialPortInfo
): Promise<SerialPortSettingState> {
  const selectedPort = getSelectedPortSetting()

  if (selectedPort?.path === port.path) {
    requireStoreRepository().remove(settingCollection, serialPortSettingKey)
    disconnectCurrentPort()
    console.log('[serial-port:selected:removed]', port)
    return getSetting()
  }

  const setting = toStoredSerialPortSetting(port)
  requireStoreRepository().edit(settingCollection, serialPortSettingKey, setting)
  connect(port.path)
  console.log('[serial-port:selected:saved]', setting)
  return getSetting()
}

export function setCommand(command: string): string {
  requireStoreRepository().edit(settingCollection, serialCommandSettingKey, command)
  console.log('[serial-port:command:saved]', command)
  return command
}

export function startPolling(): void {
  if (pollingTimer) {
    return
  }

  refreshList().catch((error) => console.error('[serial-port:poll:error]', error))
  pollingTimer = setInterval(() => {
    refreshList().catch((error) => console.error('[serial-port:poll:error]', error))
  }, pollingIntervalMs)
}

export function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}
