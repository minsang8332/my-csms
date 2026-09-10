import ElectronStore from 'electron-store'
import type { StoreValue } from '../../shared/api'

type StoreSchema = Record<string, Record<string, StoreValue>>

const store = new ElectronStore<StoreSchema>({
  name: 'csms-store',
  defaults: {}
})

function getCollection(collection: string): Record<string, StoreValue> {
  return store.get(collection, {})
}

export function createStoreRepository() {
  return {
    create<T extends StoreValue>(collection: string, key: string, value: T): T {
      const items = getCollection(collection)
      store.set(collection, {
        ...items,
        [key]: value
      })
      return value
    },

    read<T extends StoreValue>(collection: string, key: string): T | null {
      const value = getCollection(collection)[key]
      return value === undefined ? null : (value as T)
    },

    edit<T extends StoreValue>(collection: string, key: string, value: T): T {
      const items = getCollection(collection)
      store.set(collection, {
        ...items,
        [key]: value
      })
      return value
    },

    remove(collection: string, key: string): boolean {
      const items = getCollection(collection)
      const nextItems = { ...items }
      delete nextItems[key]
      store.set(collection, nextItems)
      return true
    },

    removeAll(collection: string): boolean {
      store.set(collection, {})
      return true
    },

    readAll<T extends StoreValue>(collection: string): Record<string, T> {
      return getCollection(collection) as Record<string, T>
    }
  }
}

export type StoreRepository = ReturnType<typeof createStoreRepository>
