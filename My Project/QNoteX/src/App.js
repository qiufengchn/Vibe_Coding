import React, { useState, useEffect } from 'react';
import './App.css';

// 简单的笔记存储服务
class SimpleStorage {
  static getNotes() {
    const notes = localStorage.getItem('qnotex_notes');
    return notes ? JSON.parse(notes) : [];
  }

  static saveNote(note) {
    const notes = this.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.unshift(note);
    }
    
    localStorage.setItem('qnotex_notes', JSON.stringify(notes));
    return notes;
  }

  static deleteNote(noteId) {
    const notes = this.getNotes().filter(note => note.id !== noteId);
    localStorage.setItem('qnotex_notes', JSON.stringify(notes));
    return notes;
  }
}

// 侧边栏组件
function Sidebar({ notes, currentNote, onNoteSelect, onCreateNote, onDeleteNote, searchQuery, onSearchChange }) {
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Q NoteX</h1>
        <button onClick={onCreateNote}>+ 新建笔记</button>
        <input
          type="text"
          placeholder="搜索笔记..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? '没有找到匹配的笔记' : '还没有笔记，创建第一个吧！'}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
              onClick={() => onNoteSelect(note)}
            >
              <div className="note-header">
                <h3 className="note-title">{note.title || '无标题'}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('确定要删除这条笔记吗？')) {
                      onDeleteNote(note.id);
                    }
                  }}
                  className="btn-delete"
                >
                  ×
                </button>
              </div>
              <p className="note-preview">{note.content.slice(0, 100)}...</p>
              <div className="note-date">{note.updatedAt}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 编辑器组件
function Editor({ note, onUpdateNote }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      setHasUnsavedChanges(false);
    }
  }, [note]);

  const saveNote = () => {
    if (note && hasUnsavedChanges) {
      const updatedNote = {
        ...note,
        title: title || '无标题',
        content: content,
        updatedAt: new Date().toLocaleString()
      };
      onUpdateNote(updatedNote);
      setHasUnsavedChanges(false);
    }
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  // 自动保存
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(saveNote, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, title, content, note]);

  // 快捷键保存
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, title, content, note]);

  if (!note) {
    return (
      <div className="editor-empty">
        <div className="empty-content">
          <h2>📝</h2>
          <p>选择一个笔记开始编辑</p>
          <p>或者创建一个新笔记</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="笔记标题..."
          className="title-input"
        />
        <div className="editor-toolbar">
          {hasUnsavedChanges && <span className="unsaved-indicator">未保存</span>}
          <button onClick={saveNote} disabled={!hasUnsavedChanges} className="btn-save">
            保存 (Ctrl+S)
          </button>
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="开始输入你的笔记..."
        className="content-textarea"
      />
    </div>
  );
}

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载笔记
  useEffect(() => {
    const loadedNotes = SimpleStorage.getNotes();
    setNotes(loadedNotes);
    if (loadedNotes.length > 0) {
      setCurrentNote(loadedNotes[0]);
    }
  }, []);

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: '新笔记',
      content: '',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    const updatedNotes = SimpleStorage.saveNote(newNote);
    setNotes(updatedNotes);
    setCurrentNote(newNote);
  };

  const updateNote = (updatedNote) => {
    const updatedNotes = SimpleStorage.saveNote(updatedNote);
    setNotes(updatedNotes);
    setCurrentNote(updatedNote);
  };

  const deleteNote = (noteId) => {
    const updatedNotes = SimpleStorage.deleteNote(noteId);
    setNotes(updatedNotes);
    
    if (currentNote?.id === noteId) {
      setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  };

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        currentNote={currentNote}
        onNoteSelect={setCurrentNote}
        onCreateNote={createNote}
        onDeleteNote={deleteNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <Editor
        note={currentNote}
        onUpdateNote={updateNote}
      />
    </div>
  );
}

export default App; 