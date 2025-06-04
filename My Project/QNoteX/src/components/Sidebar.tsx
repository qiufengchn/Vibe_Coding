import React, { useState } from 'react';
import { Note, Notebook } from '../types/Note';

interface SidebarProps {
  notes: Note[];
  notebooks: Notebook[];
  currentNote: Note | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (note: Note) => void;
  onCreateNote: () => void;
  onCreateNotebook: (name: string) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  notebooks,
  currentNote,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onCreateNote,
  onCreateNotebook,
  onDeleteNote,
  onToggleStar,
}) => {
  const [showNotebookForm, setShowNotebookForm] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'notebooks'>('all');

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim());
      setNewNotebookName('');
      setShowNotebookForm(false);
    }
  };

  const getDisplayNotes = () => {
    switch (activeTab) {
      case 'starred':
        return notes.filter(note => note.isStarred);
      case 'notebooks':
        return notes; // 在笔记本模式下仍显示所有笔记，但按笔记本分组
      default:
        return notes;
    }
  };

  const displayNotes = getDisplayNotes();

  const renderNoteItem = (note: Note) => (
    <div
      key={note.id}
      className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
      onClick={() => onNoteSelect(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="note-title flex items-center gap-2">
            {note.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
            <span className="truncate">{note.title || '无标题'}</span>
          </div>
          <div className="note-preview">
            {note.content.slice(0, 100)}...
          </div>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="tag">+{note.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(note.id);
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Star className={`w-4 h-4 ${note.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('确定要删除这条笔记吗？')) {
                onDeleteNote(note.id);
              }
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="note-date">
        <Calendar className="w-3 h-3 inline mr-1" />
        {format(note.updatedAt, 'MM/dd HH:mm')}
      </div>
    </div>
  );

  const renderNotebookSection = () => {
    if (activeTab !== 'notebooks') return null;

    const notesWithoutNotebook = notes.filter(note => !note.notebookId);
    const notesByNotebook = notebooks.map(notebook => ({
      notebook,
      notes: notes.filter(note => note.notebookId === notebook.id)
    }));

    return (
      <div className="space-y-4">
        {/* 未分类笔记 */}
        {notesWithoutNotebook.length > 0 && (
          <div>
            <div className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              未分类 ({notesWithoutNotebook.length})
            </div>
            {notesWithoutNotebook.map(renderNoteItem)}
          </div>
        )}

        {/* 按笔记本分组 */}
        {notesByNotebook.map(({ notebook, notes: notebookNotes }) => (
          <div key={notebook.id}>
            <div 
              className="px-4 py-2 text-sm font-medium border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
              style={{ color: notebook.color }}
            >
              <BookOpen className="w-4 h-4" />
              {notebook.name} ({notebookNotes.length})
            </div>
            {notebookNotes.map(renderNoteItem)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar">
      {/* 头部 */}
      <div className="sidebar-header">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Q NoteX
          </h1>
          <button
            onClick={onCreateNote}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            title="新建笔记"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-bar pl-10"
          />
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex-1 py-2 px-3 text-sm font-medium ${
              activeTab === 'starred'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4 inline mr-1" />
            星标
          </button>
          <button
            onClick={() => setActiveTab('notebooks')}
            className={`flex-1 py-2 px-3 text-sm font-medium ${
              activeTab === 'notebooks'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" />
            笔记本
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="sidebar-content">
        {/* 笔记本创建表单 */}
        {showNotebookForm && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <input
              type="text"
              placeholder="笔记本名称"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNotebook();
                if (e.key === 'Escape') setShowNotebookForm(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateNotebook}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                创建
              </button>
              <button
                onClick={() => setShowNotebookForm(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 添加笔记本按钮 */}
        {activeTab === 'notebooks' && !showNotebookForm && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowNotebookForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              <Plus className="w-4 h-4" />
              新建笔记本
            </button>
          </div>
        )}

        {/* 笔记列表 */}
        {activeTab === 'notebooks' ? (
          renderNotebookSection()
        ) : (
          <div>
            {displayNotes.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? '没有找到匹配的笔记' : '还没有笔记，创建第一个吧！'}
              </div>
            ) : (
              displayNotes.map(renderNoteItem)
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 