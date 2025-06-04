export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isStarred: boolean;
  notebookId?: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  note: Note;
  highlights: string[];
  score: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  previewMode: 'split' | 'preview' | 'edit';
  autoSave: boolean;
  autoSaveInterval: number; // 秒
} 