export type AppInfo = {
  version: string
  now: string
  sample: string
}

export type StoreValue =
  | string
  | number
  | boolean
  | null
  | StoreValue[]
  | {
      [key: string]: StoreValue
    }

export type StoredMenu = {
  id: string
  label: string
  subLabel?: string | null
  path: string
  order: number
  closable: boolean
  parentId?: string | null
}

export type StoredPcm = {
  id: string
  maxCurrentA: number
  outlets: number
  count: number
}


export type PcmInput = {
  maxCurrentA: number
  outlets: number
  count: number
}

export type PcmApi = {
  readAll: () => Promise<StoredPcm[]>
  create: (pcm: PcmInput) => Promise<StoredPcm>
  edit: (pcm: StoredPcm) => Promise<StoredPcm>
  remove: (id: string) => Promise<boolean>
}

export type AppWindowApi = {
  closeWindow: () => Promise<boolean>
  showWindow: () => Promise<boolean>
  quit: () => Promise<boolean>
}

export type SerialPortInfo = {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string
}

export type StoredSerialPortSetting = {
  path: string
  manufacturer: string | null
  serialNumber: string | null
  pnpId: string | null
  locationId: string | null
  productId: string | null
  vendorId: string | null
}

export type SerialPortSettingState = {
  selectedPort: StoredSerialPortSetting | null
  command: string
}

export type SettingApi = {
  getSerialPortList: () => Promise<SerialPortInfo[]>
  getSerialPortSetting: () => Promise<SerialPortSettingState>
  toggleSerialPort: (port: SerialPortInfo) => Promise<SerialPortSettingState>
  setSerialCommand: (command: string) => Promise<string>
  onSerialPortListChanged: (callback: (ports: SerialPortInfo[]) => void) => () => void
  onSerialPortData: (callback: (payload: { path: string; data: string }) => void) => () => void
}

export type ShippedItem = {
  name: string
  price: number
  count: number
}

export interface CsReply {
  id: string
  csId: string
  content: string
  createdAt: string
}

export type CsBranch = {
  id: string
  name: string
  address: string
  contact: string
  status: string
  licensePath?: string | null
  licenseName?: string | null
  description?: string | null
  receivedAt?: string | null
  shippedAt?: string | null
  createdAt: string
  items?: ShippedItem[]
  replies?: CsReply[]
}

export type CsApi = {
  readAll: () => Promise<CsBranch[]>
  create: (branch: Omit<CsBranch, 'id' | 'createdAt'>) => Promise<CsBranch>
  edit: (branch: CsBranch) => Promise<CsBranch>
  remove: (id: string) => Promise<boolean>
  getStatuses: () => Promise<string[]>
  uploadLicense: () => Promise<{ path: string; name: string } | null>
  createReply(csId: string, content: string): Promise<CsReply>
  editReply: (replyId: string, content: string) => Promise<CsReply>
  removeReply: (replyId: string) => Promise<boolean>
}

export type StoredItem = {
  id: string
  name: string
  price: number
  count: number
}

export type ItemInput = {
  name: string
  price: number
  count: number
}

export type ItemApi = {
  readAll: () => Promise<StoredItem[]>
  create: (item: ItemInput) => Promise<StoredItem>
  edit: (item: StoredItem) => Promise<StoredItem>
  remove: (id: string) => Promise<boolean>
}

export type User = {
  id: string
  name: string
  group: string
}

export type UserApi = {
  readAll: () => Promise<User[]>
}

export type NativeApi = {
  minimize: () => Promise<boolean>
  maximize: () => Promise<boolean>
  close: () => Promise<boolean>
  isMaximized: () => Promise<boolean>
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
}

export type AppApi = {
  isElectron?: boolean
  isWeb?: boolean
  getAppInfo: () => Promise<AppInfo>
  app: AppWindowApi
  setting: SettingApi
  item: ItemApi
  cs: CsApi
  user: UserApi
  native: NativeApi
}

