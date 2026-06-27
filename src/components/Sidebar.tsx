import React, { useState } from 'react';
import type { BookProject, Chapter } from '../db/indexedDb';
import { BOOK_TEMPLATES } from '../templates/bookTemplates';
import {
  BookOpen, Plus, Trash2, Copy, Edit3, Settings, Type, 
  ChevronLeft, ChevronRight, Search, FileText, ArrowUp, ArrowDown,
  Moon, Sun, Coffee, EyeOff
} from 'lucide-react';

interface SidebarProps {
  projects: BookProject[];
  activeProject: BookProject | null;
  activeChapterId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (title: string, templateId: string) => void;
  onDuplicateProject: (project: BookProject) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
  
  // Chapter management
  onSelectChapter: (id: string) => void;
  onCreateChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onRenameChapter: (id: string, newTitle: string) => void;

  // Active theme & settings toggles
  activePanel: 'settings' | 'typography' | 'none';
  setActivePanel: (panel: 'settings' | 'typography' | 'none') => void;
  currentTheme: 'Light' | 'Dark' | 'Sepia' | 'AMOLED';
  onChangeTheme: (theme: 'Light' | 'Dark' | 'Sepia' | 'AMOLED') => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  projects,
  activeProject,
  activeChapterId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onSelectChapter,
  onCreateChapter,
  onDeleteChapter,
  onReorderChapters,
  onRenameChapter,
  activePanel,
  setActivePanel,
  currentTheme,
  onChangeTheme,
  onOpenSearch
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterRenameValue, setChapterRenameValue] = useState('');

  // Reorder helper
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    if (!activeProject) return;
    const list = [...activeProject.chapters];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Reassign orders
    const updated = list.map((chap, idx) => ({
      ...chap,
      order: idx + 1
    }));

    onReorderChapters(updated);
  };



  // Filter projects by search and folder
  // (In a production system, we'd tag projects with folders; for demo we just search title)
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase());
    return matchesSearch;
  });

  const handleStartRenameProject = (e: React.MouseEvent, p: BookProject) => {
    e.stopPropagation();
    setEditingProjectId(p.id);
    setRenameValue(p.title);
  };

  const handleSaveRenameProject = (id: string) => {
    if (renameValue.trim()) {
      onRenameProject(id, renameValue.trim());
    }
    setEditingProjectId(null);
  };

  const handleStartRenameChapter = (e: React.MouseEvent, c: Chapter) => {
    e.stopPropagation();
    setEditingChapterId(c.id);
    setChapterRenameValue(c.title);
  };

  const handleSaveRenameChapter = (id: string) => {
    if (chapterRenameValue.trim()) {
      onRenameChapter(id, chapterRenameValue.trim());
    }
    setEditingChapterId(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-xl border border-zinc-200 bg-white/80 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-850 print:hidden"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="w-80 h-full border-r border-zinc-250/60 bg-white/70 backdrop-blur-md flex flex-col justify-between select-none relative dark:border-zinc-850 dark:bg-zinc-950/70 print:hidden flex-shrink-0">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:to-zinc-400">BookForge</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            <span>Bookshelf</span>
            <button 
              onClick={() => onCreateProject('Untitled Book', 'novel')}
              className="text-indigo-500 hover:text-indigo-600 p-0.5"
              title="New Book"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-450" />
            <input
              type="text"
              placeholder="Search bookshelf..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
            />
          </div>

          {/* Projects List */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filteredProjects.map((p) => {
              const isActive = activeProject?.id === p.id;
              const isEditing = editingProjectId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => !isEditing && onSelectProject(p.id)}
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50' 
                      : 'hover:bg-zinc-100/50 border border-transparent dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleSaveRenameProject(p.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameProject(p.id)}
                        className="w-full bg-white dark:bg-zinc-900 px-1 py-0.5 rounded outline-none border border-indigo-400 text-zinc-800 dark:text-zinc-200"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{p.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button 
                        onClick={(e) => handleStartRenameProject(e, p)}
                        className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded"
                        title="Rename"
                      >
                        <Edit3 className="h-3 w-3 text-zinc-500" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDuplicateProject(p); }}
                        className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3 text-zinc-500" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                        className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chapters Section */}
        {activeProject && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              <span>Chapters</span>
              <button 
                onClick={onCreateChapter}
                className="text-indigo-500 hover:text-indigo-600 p-0.5"
                title="Add Chapter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {activeProject.chapters
                .sort((a, b) => a.order - b.order)
                .map((chap, index) => {
                  const isActive = activeChapterId === chap.id;
                  const isEditing = editingChapterId === chap.id;

                  return (
                    <div
                      key={chap.id}
                      onClick={() => !isEditing && onSelectChapter(chap.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-zinc-150/80 dark:bg-zinc-900 border border-zinc-250/20' 
                          : 'hover:bg-zinc-100/50 border border-transparent dark:hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={chapterRenameValue}
                            onChange={(e) => setChapterRenameValue(e.target.value)}
                            onBlur={() => handleSaveRenameChapter(chap.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameChapter(chap.id)}
                            className="w-full bg-white dark:bg-zinc-900 px-1 py-0.5 rounded outline-none border border-indigo-400 text-zinc-800 dark:text-zinc-200"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{chap.title}</span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveChapter(index, 'up'); }}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveChapter(index, 'down'); }}
                            disabled={index === activeProject.chapters.length - 1}
                            className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => handleStartRenameChapter(e, chap)}
                            className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded"
                            title="Rename"
                          >
                            <Edit3 className="h-3 w-3 text-zinc-500" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteChapter(chap.id); }}
                            disabled={activeProject.chapters.length <= 1}
                            className="p-0.5 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded text-rose-500 disabled:opacity-30"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Templates Picker */}
        {activeProject && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              <span>Book Templates</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {BOOK_TEMPLATES.map((tmpl) => {
                const isActive = activeProject.templateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      // Change template details (settings, typography)
                      activeProject.templateId = tmpl.id;
                      activeProject.settings = { ...tmpl.settings };
                      activeProject.typography = { ...tmpl.typography };
                      onSelectProject(activeProject.id); // trigger reload
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-semibold border text-left truncate transition-all ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20' 
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                    }`}
                    title={tmpl.description}
                  >
                    {tmpl.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Sidebar Footer: Theme and Option Switches */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
        
        {/* Active Side panel toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition-all ${
              activePanel === 'settings'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> Size/Margins
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'typography' ? 'none' : 'typography')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition-all ${
              activePanel === 'typography'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
            }`}
          >
            <Type className="h-3.5 w-3.5" /> Typography
          </button>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-850 pt-3">
          
          {/* Find & Replace search trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-500"
          >
            <Search className="h-4 w-4" /> Find/Replace
          </button>

          {/* Theme switcher */}
          <div className="flex bg-zinc-200 dark:bg-zinc-950 rounded-xl p-0.5 gap-0.5">
            {(['Light', 'Dark', 'Sepia', 'AMOLED'] as const).map((t) => {
              const isActive = currentTheme === t;
              return (
                <button
                  key={t}
                  onClick={() => onChangeTheme(t)}
                  className={`p-1.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white' 
                      : 'text-zinc-400 hover:text-zinc-650'
                  }`}
                  title={`${t} Theme`}
                >
                  {t === 'Light' && <Sun className="h-3.5 w-3.5" />}
                  {t === 'Dark' && <Moon className="h-3.5 w-3.5" />}
                  {t === 'Sepia' && <Coffee className="h-3.5 w-3.5" />}
                  {t === 'AMOLED' && <EyeOff className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
