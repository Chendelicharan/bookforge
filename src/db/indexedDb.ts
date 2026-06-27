export interface BookSettings {
  pageSize: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  customWidth?: number; // in mm
  customHeight?: number; // in mm
  margin: 'Small' | 'Medium' | 'Large' | 'Custom';
  customMargins?: { top: number; bottom: number; left: number; right: number }; // in mm
  binding: 'Paperback' | 'Hardcover';
  orientation: 'Portrait' | 'Landscape';
  columns: 1 | 2 | 3;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number; // in pt
  lineSpacing: number; // multiplier
  paragraphSpacing: number; // in pt
  firstLineIndent: boolean;
  chapterStyle: 'Standard' | 'Decorative' | 'Modern' | 'Minimalist';
  headingStyle: 'Serif' | 'Sans' | 'Elegant';
  dropCaps: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Tiptap HTML string
  order: number;
}

export interface BookProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  chapters: Chapter[];
  settings: BookSettings;
  typography: TypographySettings;
  templateId: string;
  theme: 'Light' | 'Dark' | 'Sepia' | 'AMOLED';
}

const DB_NAME = 'BookForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveProject(project: BookProject): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(project);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save project'));
    };
  });
}

export async function getProject(id: string): Promise<BookProject | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get project'));
    };
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete project'));
    };
  });
}

export async function listProjects(): Promise<BookProject[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result as BookProject[];
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(list);
    };

    request.onerror = () => {
      reject(new Error('Failed to list projects'));
    };
  });
}

export function createNewProject(title: string, templateId: string = 'novel'): BookProject {
  const defaultSettings: BookSettings = {
    pageSize: 'A5', // Standard book size
    margin: 'Medium',
    binding: 'Paperback',
    orientation: 'Portrait',
    columns: 1
  };

  const defaultTypography: TypographySettings = {
    fontFamily: 'Georgia',
    fontSize: 11,
    lineSpacing: 1.4,
    paragraphSpacing: 8,
    firstLineIndent: true,
    chapterStyle: 'Standard',
    headingStyle: 'Serif',
    dropCaps: false
  };

  return {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: [
      {
        id: crypto.randomUUID(),
        title: 'Chapter 1: The Beginning',
        content: '<h1>Chapter 1: The Beginning</h1><p>Start writing your book here...</p>',
        order: 1
      }
    ],
    settings: defaultSettings,
    typography: defaultTypography,
    templateId,
    theme: 'Light'
  };
}
