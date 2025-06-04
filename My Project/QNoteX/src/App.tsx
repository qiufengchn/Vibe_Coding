import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { useNotes } from './hooks/useNotes';
import { StorageService } from './services/StorageService';
import './index.css';

function App() {
  const {
    notes,
    currentNote,
    notebooks,
    filteredNotes,
    searchQuery,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    toggleStar,
    createNotebook,
    setSearchQuery,
  } = useNotes();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const storageService = StorageService.getInstance();

  // 初始化主题
  useEffect(() => {
    const settings = storageService.getSettings();
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const settings = storageService.getSettings();
      if (settings.theme === 'system') {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 处理 Electron 菜单事件
  useEffect(() => {
    const handleMenuEvent = (event: string) => {
      switch (event) {
        case 'menu-new-note':
          createNote();
          break;
        case 'menu-save':
          // 保存功能由编辑器组件处理
          break;
        case 'menu-search':
          // 聚焦搜索框
          const searchInput = document.querySelector('.search-bar') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case 'menu-export-markdown':
          exportCurrentNote('markdown');
          break;
        case 'menu-export-pdf':
          exportCurrentNote('pdf');
          break;
      }
    };

    // 模拟 Electron IPC 事件监听
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(handleMenuEvent);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeMenuListeners();
      }
    };
  }, [createNote, currentNote]);

  // 导出功能
  const exportCurrentNote = (format: 'markdown' | 'pdf') => {
    if (!currentNote) return;

    if (format === 'markdown') {
      const content = `# ${currentNote.title}\n\n${currentNote.content}`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentNote.title || '笔记'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // PDF 导出需要更复杂的实现，这里先提示
      alert('PDF 导出功能将在后续版本中实现');
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            createNote();
            break;
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('.search-bar') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar
        notes={filteredNotes}
        notebooks={notebooks}
        currentNote={currentNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNoteSelect={setCurrentNote}
        onCreateNote={() => createNote()}
        onCreateNotebook={createNotebook}
        onDeleteNote={deleteNote}
        onToggleStar={toggleStar}
      />
      
      <Editor
        note={currentNote}
        onUpdateNote={updateNote}
        autoSave={true}
        autoSaveInterval={30000}
      />
    </div>
  );
}

// 声明 Electron API 类型（如果在 Electron 环境中）
declare global {
  interface Window {
    electronAPI?: {
      onMenuAction: (callback: (event: string) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

export default App; 