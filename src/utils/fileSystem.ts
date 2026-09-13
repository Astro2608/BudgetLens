export const DB_NAME = 'LuminaStorage';
export const STORE_NAME = 'fileHandles';
export const HANDLE_KEY = 'rawFileHandle';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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
  const opts = { mode: withWrite ? 'readwrite' : 'read' };
  
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true;
  }
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true;
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
