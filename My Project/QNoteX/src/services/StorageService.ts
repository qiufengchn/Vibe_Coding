import { Note, Notebook, AppSettings } from '../types/Note';

// 模拟 electron-store 的基本功能，实际应用中会使用真正的 electron-store
class LocalStorage {
  private data: { [key: string]: any } = {};

  get(key: string, defaultValue?: any) {
    const stored = localStorage.getItem(`qnotex_${key}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return defaultValue;
  }

  set(key: string, value: any) {
    this.data[key] = value;
    localStorage.setItem(`qnotex_${key}`, JSON.stringify(value));
  }

  delete(key: string) {
    delete this.data[key];
    localStorage.removeItem(`qnotex_${key}`);
  }

  clear() {
    Object.keys(this.data).forEach(key => {
      if (key.startsWith('qnotex_')) {
        localStorage.removeItem(key);
      }
    });
    this.data = {};
  }
}

export class StorageService {
  private store = new LocalStorage();
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 笔记相关操作
  getNotes(): Note[] {
    const notes = this.store.get('notes', []);
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  }

  saveNote(note: Note): void {
    const notes = this.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    
    this.store.set('notes', notes);
  }

  deleteNote(noteId: string): void {
    const notes = this.getNotes().filter(note => note.id !== noteId);
    this.store.set('notes', notes);
  }

  // 笔记本相关操作
  getNotebooks(): Notebook[] {
    const notebooks = this.store.get('notebooks', []);
    return notebooks.map((notebook: any) => ({
      ...notebook,
      createdAt: new Date(notebook.createdAt),
      updatedAt: new Date(notebook.updatedAt),
    }));
  }

  saveNotebook(notebook: Notebook): void {
    const notebooks = this.getNotebooks();
    const existingIndex = notebooks.findIndex(n => n.id === notebook.id);
    
    if (existingIndex >= 0) {
      notebooks[existingIndex] = notebook;
    } else {
      notebooks.push(notebook);
    }
    
    this.store.set('notebooks', notebooks);
  }

  deleteNotebook(notebookId: string): void {
    const notebooks = this.getNotebooks().filter(notebook => notebook.id !== notebookId);
    this.store.set('notebooks', notebooks);
    
    // 同时删除该笔记本下的所有笔记
    const notes = this.getNotes().filter(note => note.notebookId !== notebookId);
    this.store.set('notes', notes);
  }

  // 设置相关操作
  getSettings(): AppSettings {
    return this.store.get('settings', {
      theme: 'system',
      fontSize: 'medium',
      previewMode: 'split',
      autoSave: true,
      autoSaveInterval: 30,
    });
  }

  saveSettings(settings: AppSettings): void {
    this.store.set('settings', settings);
  }

  // 搜索功能
  searchNotes(query: string): Note[] {
    const notes = this.getNotes();
    const lowerQuery = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // 导出功能
  exportNote(noteId: string): Note | null {
    const notes = this.getNotes();
    return notes.find(note => note.id === noteId) || null;
  }

  exportAllNotes(): Note[] {
    return this.getNotes();
  }

  // 导入功能
  importNotes(notes: Note[]): void {
    const existingNotes = this.getNotes();
    const allNotes = [...existingNotes, ...notes];
    this.store.set('notes', allNotes);
  }

  // 备份功能
  createBackup(): string {
    const data = {
      notes: this.getNotes(),
      notebooks: this.getNotebooks(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  restoreBackup(backupData: string): boolean {
    try {
      const data = JSON.parse(backupData);
      
      if (data.notes) {
        this.store.set('notes', data.notes);
      }
      if (data.notebooks) {
        this.store.set('notebooks', data.notebooks);
      }
      if (data.settings) {
        this.store.set('settings', data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('备份恢复失败:', error);
      return false;
    }
  }
} 