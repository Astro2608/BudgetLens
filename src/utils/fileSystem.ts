export const DB_NAME = 'BudgetLensStorage';
export const STORE_NAME = 'fileHandles';
export const APP_DATA_STORE = 'appData';
export const HANDLE_KEY = 'rawFileHandle';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(APP_DATA_STORE)) {
        db.createObjectStore(APP_DATA_STORE);
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const saveFileHandle = async (handle: FileSystemFileHandle): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
};

// Generic save data to IndexedDB
export const saveAppData = async (key: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([APP_DATA_STORE], 'readwrite');
    const store = transaction.objectStore(APP_DATA_STORE);
    const request = store.put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
};

// Generic get data from IndexedDB
export const getAppData = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([APP_DATA_STORE], 'readonly');
    const store = transaction.objectStore(APP_DATA_STORE);
    const request = store.get(key);
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const getFileHandle = async (): Promise<FileSystemFileHandle | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HANDLE_KEY);
    request.onsuccess = (event: any) => resolve(event.target.result || null);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const clearFileHandle = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const verifyPermission = async (fileHandle: any, withWrite: boolean = true) => {
  // File System Access API permission queries are not supported in Firefox.
  // Guard against calling queryPermission/requestPermission in unsupported browsers.
  if (!fileHandle || typeof fileHandle.queryPermission !== 'function') return false;

  const opts = { mode: withWrite ? 'readwrite' : 'read' };
  
  try {
    if ((await fileHandle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if (typeof fileHandle.requestPermission === 'function') {
      if ((await fileHandle.requestPermission(opts)) === 'granted') {
        return true;
      }
    }
  } catch (e) {
    console.warn('[BudgetLens] FSA permission check failed (unsupported browser?):', e);
  }
  return false;
};


export const writeToFile = async (fileHandle: FileSystemFileHandle, content: string) => {
  const writable = await (fileHandle as any).createWritable();
  await writable.write(content);
  await writable.close();
};

export const readFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};
