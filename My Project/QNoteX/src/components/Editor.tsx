import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '../types/Note';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  Edit3, 
  Eye, 
  Columns, 
  Bold, 
  Italic, 
  List, 
  Link,
  Code,
  Hash,
  Save
} from 'lucide-react';

interface EditorProps {
  note: Note | null;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

type ViewMode = 'edit' | 'preview' | 'split';

export const Editor: React.FC<EditorProps> = ({
  note,
  onUpdateNote,
  autoSave = true,
  autoSaveInterval = 30000, // 30秒
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 同步笔记内容
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setTitle(note.title);
      setHasUnsavedChanges(false);
    } else {
      setContent('');
      setTitle('');
      setHasUnsavedChanges(false);
    }
  }, [note]);

  // 自动保存
  const saveNote = useCallback(() => {
    if (note && hasUnsavedChanges) {
      const updates: Partial<Note> = {};
      
      if (title !== note.title) {
        updates.title = title || '无标题';
      }
      
      if (content !== note.content) {
        updates.content = content;
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdateNote(note.id, updates);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    }
  }, [note, title, content, hasUnsavedChanges, onUpdateNote]);

  // 自动保存定时器
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      const timer = setTimeout(saveNote, autoSaveInterval);
      return () => clearTimeout(timer);
    }
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, saveNote]);

  // 监听内容变化
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  // 工具栏操作
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);
    setHasUnsavedChanges(true);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const toolbarActions = [
    {
      icon: Bold,
      label: '粗体',
      action: () => insertMarkdown('**', '**'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      label: '斜体',
      action: () => insertMarkdown('*', '*'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: Hash,
      label: '标题',
      action: () => insertMarkdown('## '),
      shortcut: 'Ctrl+H'
    },
    {
      icon: List,
      label: '列表',
      action: () => insertMarkdown('- '),
      shortcut: 'Ctrl+L'
    },
    {
      icon: Link,
      label: '链接',
      action: () => insertMarkdown('[', '](url)'),
      shortcut: 'Ctrl+K'
    },
    {
      icon: Code,
      label: '代码',
      action: () => insertMarkdown('`', '`'),
      shortcut: 'Ctrl+`'
    },
  ];

  // 快捷键处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          saveNote();
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('[', '](url)');
          break;
        case '`':
          e.preventDefault();
          insertMarkdown('`', '`');
          break;
      }
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Edit3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">选择一个笔记开始编辑</p>
          <p className="text-sm mt-2">或者创建一个新笔记</p>
        </div>
      </div>
    );
  }

  const renderEditor = () => (
    <div className="editor-container">
      {/* 标题输入 */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="笔记标题..."
        className="w-full px-4 py-3 text-xl font-bold border-none outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />
      
      {/* 工具栏 */}
      <div className="toolbar">
        {toolbarActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="toolbar-button"
            title={`${action.label} (${action.shortcut})`}
          >
            <action.icon className="w-4 h-4" />
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500">未保存</span>
          )}
          {lastSaved && (
            <span className="text-xs text-gray-400">
              已保存 {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={saveNote}
            disabled={!hasUnsavedChanges}
            className="toolbar-button disabled:opacity-50 disabled:cursor-not-allowed"
            title="保存 (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 编辑器 */}
      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="开始输入你的笔记..."
      />
    </div>
  );

  const renderPreview = () => (
    <div className="preview-container">
      <div className="preview-content">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {title || '无标题'}
        </h1>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content || '*暂无内容*'}
        </ReactMarkdown>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* 视图模式切换 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`p-2 rounded ${viewMode === 'edit' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="编辑模式"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-2 rounded ${viewMode === 'preview' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="预览模式"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-2 rounded ${viewMode === 'split' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="分屏模式"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {content.length} 字符
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {viewMode === 'edit' && renderEditor()}
        {viewMode === 'preview' && renderPreview()}
        {viewMode === 'split' && (
          <>
            <div className="flex-1 border-r border-gray-200 dark:border-gray-700">
              {renderEditor()}
            </div>
            <div className="flex-1">
              {renderPreview()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 