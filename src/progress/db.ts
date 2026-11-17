// Small IndexedDB wrapper (no extra library).
// Stores: items (by itemId), sessions (by id), stickers (by id), meta (one
// record), backups (the copy taken automatically before an import/reset).

const DB_NAME = 'english-play-sessions'
const DB_VERSION = 2 // v2: evaluations + canDo stores
export const STORES = ['items', 'sessions', 'stickers', 'meta', 'backups', 'evaluations', 'canDo'] as const
export type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'itemId' })
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('stickers')) db.createObjectStore('stickers', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups')
        if (!db.objectStoreNames.contains('evaluations')) db.createObjectStore('evaluations', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('canDo')) db.createObjectStore('canDo', { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function remove(store: StoreName, key: IDBValidKey) {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).delete(key)
  await done(tx)
}

export async function put(store: StoreName, value: unknown, key?: IDBValidKey) {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(value, key)
  await done(tx)
}

/** Read-modify-write of one record inside a single transaction. */
export async function update<T>(store: StoreName, key: IDBValidKey, fn: (old: T | undefined) => T) {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  const os = tx.objectStore(store)
  const req = os.get(key)
  // Stores with a keyPath take the key from the record; the others need it given.
  req.onsuccess = () => {
    const value = fn(req.result as T | undefined)
    if (os.keyPath) os.put(value)
    else os.put(value, key)
  }
  await done(tx)
}

/** Replace the content of several stores at once (all-or-nothing). */
export async function replaceAll(data: Partial<Record<StoreName, { value: unknown; key?: IDBValidKey }[]>>) {
  const db = await openDb()
  const names = Object.keys(data) as StoreName[]
  const tx = db.transaction(names, 'readwrite')
  for (const name of names) {
    const os = tx.objectStore(name)
    os.clear()
    for (const { value, key } of data[name] ?? []) os.put(value, key)
  }
  await done(tx)
}
