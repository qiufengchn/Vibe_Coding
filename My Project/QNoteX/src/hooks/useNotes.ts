import { useState, useEffect, useCallback } from 'react';
import { Note, Notebook } from '../types/Note';
import { StorageService } from '../services/StorageService';
import { v4 as uuidv4 } from 'uuid';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageService = StorageService.getInstance();

  // 初始化加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedNotes = storageService.getNotes();
        const loadedNotebooks = storageService.getNotebooks();
        
        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
        setFilteredNotes(loadedNotes);
        
        if (loadedNotes.length > 0 && !currentNote) {
          setCurrentNote(loadedNotes[0]);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 搜索功能
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = storageService.searchNotes(searchQuery);
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  // 创建新笔记
  const createNote = useCallback((title?: string, content?: string) => {
    const newNote: Note = {
      id: uuidv4(),
      title: title || '新笔记',
      content: content || '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setCurrentNote(newNote);
    storageService.saveNote(newNote);
    
    return newNote;
  }, [notes]);

  // 更新笔记
  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date(),
        };
        storageService.saveNote(updatedNote);
        
        if (currentNote?.id === noteId) {
          setCurrentNote(updatedNote);
        }
        
        return updatedNote;
      }
      return note;
    });
    
    setNotes(updatedNotes);
  }, [notes, currentNote]);

  // 删除笔记
  const deleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    storageService.deleteNote(noteId);
    
    if (currentNote?.id === noteId) {
      setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  }, [notes, currentNote]);

  // 切换星标状态
  const toggleStar = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { isStarred: !note.isStarred });
    }
  }, [notes, updateNote]);

  // 添加标签
  const addTag = useCallback((noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note && !note.tags.includes(tag)) {
      updateNote(noteId, { tags: [...note.tags, tag] });
    }
  }, [notes, updateNote]);

  // 移除标签
  const removeTag = useCallback((noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { tags: note.tags.filter(t => t !== tag) });
    }
  }, [notes, updateNote]);

  // 创建笔记本
  const createNotebook = useCallback((name: string, color: string = '#3b82f6') => {
    const newNotebook: Notebook = {
      id: uuidv4(),
      name,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedNotebooks = [...notebooks, newNotebook];
    setNotebooks(updatedNotebooks);
    storageService.saveNotebook(newNotebook);
    
    return newNotebook;
  }, [notebooks]);

  // 更新笔记本
  const updateNotebook = useCallback((notebookId: string, updates: Partial<Notebook>) => {
    const updatedNotebooks = notebooks.map(notebook => {
      if (notebook.id === notebookId) {
        const updatedNotebook = {
          ...notebook,
          ...updates,
          updatedAt: new Date(),
        };
        storageService.saveNotebook(updatedNotebook);
        return updatedNotebook;
      }
      return notebook;
    });
    
    setNotebooks(updatedNotebooks);
  }, [notebooks]);

  // 删除笔记本
  const deleteNotebook = useCallback((notebookId: string) => {
    const updatedNotebooks = notebooks.filter(notebook => notebook.id !== notebookId);
    setNotebooks(updatedNotebooks);
    storageService.deleteNotebook(notebookId);
    
    // 更新本地状态中的笔记
    const updatedNotes = notes.filter(note => note.notebookId !== notebookId);
    setNotes(updatedNotes);
    
    if (currentNote?.notebookId === notebookId) {
      setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  }, [notebooks, notes, currentNote]);

  // 将笔记移动到笔记本
  const moveNoteToNotebook = useCallback((noteId: string, notebookId?: string) => {
    updateNote(noteId, { notebookId });
  }, [updateNote]);

  // 获取所有标签
  const getAllTags = useCallback(() => {
    const allTags = notes.flatMap(note => note.tags);
    return Array.from(new Set(allTags)).sort();
  }, [notes]);

  // 按标签筛选笔记
  const filterByTag = useCallback((tag: string) => {
    const filtered = notes.filter(note => note.tags.includes(tag));
    setFilteredNotes(filtered);
  }, [notes]);

  // 按笔记本筛选笔记
  const filterByNotebook = useCallback((notebookId?: string) => {
    const filtered = notebookId 
      ? notes.filter(note => note.notebookId === notebookId)
      : notes.filter(note => !note.notebookId);
    setFilteredNotes(filtered);
  }, [notes]);

  // 清除筛选
  const clearFilter = useCallback(() => {
    setFilteredNotes(notes);
    setSearchQuery('');
  }, [notes]);

  return {
    // 状态
    notes,
    currentNote,
    notebooks,
    filteredNotes,
    searchQuery,
    isLoading,
    
    // 笔记操作
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    toggleStar,
    addTag,
    removeTag,
    
    // 笔记本操作
    createNotebook,
    updateNotebook,
    deleteNotebook,
    moveNoteToNotebook,
    
    // 搜索和筛选
    setSearchQuery,
    filterByTag,
    filterByNotebook,
    clearFilter,
    getAllTags,
  };
}; 