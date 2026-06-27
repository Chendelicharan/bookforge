import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import BookEditor from './components/BookEditor';
import LivePreview from './components/LivePreview';
import SettingsPanel from './components/SettingsPanel';
import TypographyPanel from './components/TypographyPanel';
import FindReplace from './components/FindReplace';
import ExportModal from './components/ExportModal';
import type { BookProject, Chapter } from './db/indexedDb';
import { listProjects, saveProject, deleteProject, createNewProject } from './db/indexedDb';
import { paginateProject } from './utils/pagination';
import type { PaginatedPage } from './utils/pagination';
import { Upload, Sparkles, FolderOpen, Settings, Type } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [activeProject, setActiveProject] = useState<BookProject | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  
  // UI Panels and States
  const [activePanel, setActivePanel] = useState<'settings' | 'typography' | 'none'>('none');
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'Sepia' | 'AMOLED'>('Light');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Pagination State
  const [paginatedPages, setPaginatedPages] = useState<PaginatedPage[]>([]);
  
  // Tiptap Editor Instance Ref for Find & Replace
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Hidden File Import Input
  const importInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Database Loading
  useEffect(() => {
    async function loadData() {
      try {
        const list = await listProjects();
        if (list.length === 0) {
          // Create default demo book
          const defaultProject = createNewProject('The Chronicles of BookForge', 'novel');
          
          // Inject custom starting content to show off layout features
          defaultProject.chapters[0].content = `
            <h1>Chapter 1: The Beginning</h1>
            <p>The dawn rose like a slow fire, casting long copper shadows across the drafting tables of the guild. For years, the scribes had labored under the weight of heavy printing presses, struggling with metal types and ink pools that smeared at the slightest touch. It was a tedious process, one that bound stories to the slow machinery of the physical world.</p>
            <p>Then, the Forge was lit. It was not a forge of iron and coal, but of light and pixels—an interface that bent characters to the author's will, wrapping sentences neatly like cloth, splitting paragraphs with the careful precision of a diamond cutter, and organizing pages automatically.</p>
            <blockquote>"A book is not merely a collection of words," the Guildmaster had whispered, looking down at the crisp layouts. "It is an architecture of thoughts, framed by margins and balanced by spacing."</blockquote>
            <p>With BookForge, formatting was no longer a cage. It was a flight of stairs, rising into the sky, ready for any author to climb.</p>
            <h2>The Layout Table</h2>
            <p>Authors could place data inside tables to organize their world-building or character sheets. Below is a record of the forge's early tests:</p>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Precision</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pagination Grid</td>
                  <td>Active</td>
                  <td>1/96 Inch</td>
                </tr>
                <tr>
                  <td>Image Studios</td>
                  <td>Operational</td>
                  <td>300 DPI</td>
                </tr>
                <tr>
                  <td>Export Core</td>
                  <td>Compiling</td>
                  <td>Vector Native</td>
                </tr>
              </tbody>
            </table>
            <p>Everything lay balanced. The margins were set, the binding was tight, and the story was ready to print.</p>
          `;
          
          await saveProject(defaultProject);
          setProjects([defaultProject]);
          setActiveProject(defaultProject);
          setTheme(defaultProject.theme);
          if (defaultProject.chapters[0]) {
            setActiveChapterId(defaultProject.chapters[0].id);
          }
        } else {
          setProjects(list);
          setActiveProject(list[0]);
          setTheme(list[0].theme);
          if (list[0].chapters[0]) {
            setActiveChapterId(list[0].chapters[0].id);
          }
        }
      } catch (e) {
        console.error('Database load failure', e);
      }
    }
    loadData();
  }, []);

  // 2. Pagination Calculator (Debounced to keep typing smooth)
  useEffect(() => {
    if (!activeProject) return;

    const timer = setTimeout(() => {
      const pages = paginateProject(activeProject);
      setPaginatedPages(pages);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [activeProject]);

  // 3. Auto-Saving Loop (Saves every 3 seconds if changes occur)
  useEffect(() => {
    if (!activeProject) return;

    const interval = setInterval(async () => {
      const updatedProject = {
        ...activeProject,
        updatedAt: Date.now()
      };
      await saveProject(updatedProject);
      
      // Update projects list
      const list = await listProjects();
      setProjects(list);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeProject]);

  // Save changes locally in state
  const updateActiveProject = (updated: BookProject) => {
    setActiveProject(updated);
    
    // Also update in project list immediately
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleCreateProject = async (title: string, templateId: string) => {
    const next = createNewProject(title, templateId);
    await saveProject(next);
    setProjects([next, ...projects]);
    setActiveProject(next);
    setTheme(next.theme);
    if (next.chapters[0]) {
      setActiveChapterId(next.chapters[0].id);
    }
  };

  const handleDuplicateProject = async (proj: BookProject) => {
    const copy: BookProject = {
      ...proj,
      id: crypto.randomUUID(),
      title: `${proj.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: proj.chapters.map(c => ({ ...c, id: crypto.randomUUID() }))
    };
    await saveProject(copy);
    setProjects([copy, ...projects]);
    setActiveProject(copy);
    if (copy.chapters[0]) {
      setActiveChapterId(copy.chapters[0].id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (projects.length <= 1) {
      alert('You must keep at least one project.');
      return;
    }
    const confirm = window.confirm('Are you sure you want to delete this book?');
    if (!confirm) return;

    await deleteProject(id);
    const updatedList = projects.filter(p => p.id !== id);
    setProjects(updatedList);
    
    // Switch to first remaining
    const next = updatedList[0];
    setActiveProject(next);
    setTheme(next.theme);
    if (next.chapters[0]) {
      setActiveChapterId(next.chapters[0].id);
    }
  };

  // Chapter Management
  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
  };

  const handleCreateChapter = () => {
    if (!activeProject) return;
    const newIdx = activeProject.chapters.length + 1;
    const newChap: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${newIdx}: New Narrative`,
      content: `<h1>Chapter ${newIdx}: New Narrative</h1><p>Start drafting your chapter content...</p>`,
      order: newIdx
    };

    const updated = {
      ...activeProject,
      chapters: [...activeProject.chapters, newChap]
    };
    updateActiveProject(updated);
    setActiveChapterId(newChap.id);
  };

  const handleDeleteChapter = (id: string) => {
    if (!activeProject || activeProject.chapters.length <= 1) return;
    const confirm = window.confirm('Delete this chapter? Content will be lost.');
    if (!confirm) return;

    const filtered = activeProject.chapters.filter(c => c.id !== id);
    // Reorder remaining
    const updatedChaps = filtered.map((c, index) => ({
      ...c,
      order: index + 1
    }));

    const updated = {
      ...activeProject,
      chapters: updatedChaps
    };
    updateActiveProject(updated);

    // Switch active chapter
    if (activeChapterId === id) {
      setActiveChapterId(updatedChaps[0].id);
    }
  };

  const handleReorderChapters = (reordered: Chapter[]) => {
    if (!activeProject) return;
    updateActiveProject({
      ...activeProject,
      chapters: reordered
    });
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    if (!activeProject) return;
    
    const updatedChaps = activeProject.chapters.map(c => {
      if (c.id === id) {
        // Update both the title and the H1 header inside content if possible
        const parser = new DOMParser();
        const doc = parser.parseFromString(c.content, 'text/html');
        const firstH1 = doc.querySelector('h1');
        if (firstH1) {
          firstH1.textContent = newTitle;
        }
        return {
          ...c,
          title: newTitle,
          content: firstH1 ? doc.body.innerHTML : c.content
        };
      }
      return c;
    });

    updateActiveProject({
      ...activeProject,
      chapters: updatedChaps
    });
  };

  const handleRenameProject = (_id: string, title: string) => {
    if (!activeProject) return;
    updateActiveProject({
      ...activeProject,
      title
    });
  };

  // Content change callback from Tiptap Editor
  const handleEditorContentChange = (html: string) => {
    if (!activeProject) return;
    const updatedChaps = activeProject.chapters.map(c => 
      c.id === activeChapterId ? { ...c, content: html } : c
    );
    updateActiveProject({
      ...activeProject,
      chapters: updatedChaps
    });
  };

  // Document Import Logic
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = async () => {
      let importedHtml = '';
      const text = reader.result as string;

      if (ext === 'md' || ext === 'markdown') {
        // Markdown parser
        importedHtml = text
          .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
          .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
          .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^-\s+(.*?)$/gm, '<li>$1</li>')
          .replace(/<\/li>\n<li>/g, '</li><li>')
          .split('\n\n')
          .map(p => {
            if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) return p;
            if (p.trim().startsWith('<li>')) return `<ul>${p}</ul>`;
            return `<p>${p}</p>`;
          })
          .join('\n');
      } else if (ext === 'txt') {
        // Text lines wrapped in paragraphs
        importedHtml = text
          .split(/\n\n+/)
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('\n');
      } else if (ext === 'html') {
        importedHtml = text;
      } else if (ext === 'docx' || ext === 'pdf') {
        // Basic plain characters scrape for complex formats
        // Instruct user that text will be parsed
        importedHtml = `<h1>Imported ${filename}</h1>`;
        // Scrape ASCII readable text from binary
        const printableText = text.replace(/[^\x20-\x7E\n\r]/g, ' ');
        importedHtml += `<p>${printableText.substring(0, 1000)}...</p>`;
        alert('Binary document imported. Text extracted and trimmed to fit draft.');
      }

      // Add as a new chapter
      const newIdx = activeProject.chapters.length + 1;
      const newTitle = `Chapter ${newIdx}: ${filename.split('.')[0]}`;
      
      const newChap: Chapter = {
        id: crypto.randomUUID(),
        title: newTitle,
        content: `<h1>${newTitle}</h1>${importedHtml}`,
        order: newIdx
      };

      updateActiveProject({
        ...activeProject,
        chapters: [...activeProject.chapters, newChap]
      });
      setActiveChapterId(newChap.id);
    };

    if (ext === 'docx' || ext === 'pdf') {
      reader.readAsText(file); // text scrape fallback
    } else {
      reader.readAsText(file, 'utf-8');
    }
    
    e.target.value = ''; // Reset input
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'Dark': return 'dark theme-dark bg-zinc-950 text-zinc-100';
      case 'Sepia': return 'theme-sepia';
      case 'AMOLED': return 'dark theme-amoled bg-black text-slate-100';
      default: return 'bg-zinc-50 text-zinc-900';
    }
  };

  // Retrieve current active chapter content
  const activeChapter = activeProject?.chapters.find(c => c.id === activeChapterId);
  const editorContent = activeChapter ? activeChapter.content : '';

  return (
    <div className={`flex w-screen h-screen overflow-hidden font-sans transition-colors duration-300 ${getThemeClass()}`}>
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        activeChapterId={activeChapterId}
        onSelectProject={(id) => {
          const p = projects.find(proj => proj.id === id);
          if (p) {
            setActiveProject(p);
            setTheme(p.theme);
            if (p.chapters[0]) {
              setActiveChapterId(p.chapters[0].id);
            }
          }
        }}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onSelectChapter={handleSelectChapter}
        onCreateChapter={handleCreateChapter}
        onDeleteChapter={handleDeleteChapter}
        onReorderChapters={handleReorderChapters}
        onRenameChapter={handleRenameChapter}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        currentTheme={theme}
        onChangeTheme={(t) => {
          setTheme(t);
          if (activeProject) {
            updateActiveProject({ ...activeProject, theme: t });
          }
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Editor Panel */}
      <div className="flex-1 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800">
        
        {/* Editor Topbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white/40 dark:bg-zinc-900/40 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-4 w-4 text-indigo-500" />
            <h1 className="text-sm font-semibold truncate max-w-[200px]">
              {activeProject ? activeProject.title : 'Loading...'}
            </h1>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              Autosaved
            </span>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Import Trigger */}
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              title="Import MD, TXT, HTML, PDF, DOCX"
            >
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <input
              type="file"
              ref={importInputRef}
              onChange={handleImportFileSelect}
              accept=".txt, .md, .markdown, .html, .pdf, .docx"
              className="hidden"
            />

            {/* Export Trigger */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Export Book
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-hidden select-text">
          {activeChapter ? (
            <BookEditor
              content={editorContent}
              onChange={handleEditorContentChange}
              onSetEditorInstance={setEditorInstance}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <p className="text-sm">Select a chapter from the bookshelf to start writing.</p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Middle sliding drawer for settings */}
      {activePanel !== 'none' && (
        <div className="w-80 h-full border-r border-zinc-200 bg-white/85 dark:bg-zinc-900/85 dark:border-zinc-800 p-6 overflow-y-auto z-10 glass-panel">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              {activePanel === 'settings' ? <Settings className="h-4 w-4 text-indigo-500" /> : <Type className="h-4 w-4 text-indigo-500" />}
              {activePanel === 'settings' ? 'Format & Sizing' : 'Typography'}
            </h2>
            <button 
              onClick={() => setActivePanel('none')}
              className="text-xs text-zinc-400 hover:text-zinc-650"
            >
              Close
            </button>
          </div>

          {activeProject && activePanel === 'settings' && (
            <SettingsPanel
              settings={activeProject.settings}
              onChange={(newSettings) => updateActiveProject({ ...activeProject, settings: newSettings })}
            />
          )}

          {activeProject && activePanel === 'typography' && (
            <TypographyPanel
              typography={activeProject.typography}
              onChange={(newTypography) => updateActiveProject({ ...activeProject, typography: newTypography })}
            />
          )}
        </div>
      )}

      {/* 4. Right Live Book Preview Panel */}
      <div className="flex-1 h-full bg-zinc-200/50 dark:bg-zinc-900/30 overflow-hidden flex flex-col print:absolute print:inset-0 print:bg-white print:w-full print:h-full">
        {/* Preview Title */}
        <div className="p-4 border-b border-zinc-200/60 bg-white/20 dark:bg-zinc-950/20 dark:border-zinc-850 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold text-zinc-500">Live Print Preview</span>
          <span className="text-[10px] text-zinc-400">{paginatedPages.length} Pages Paginated</span>
        </div>

        {/* Paginated Pages container */}
        <div id="live-print-container" className="flex-1 overflow-hidden">
          {activeProject && (
            <LivePreview
              project={activeProject}
              pages={paginatedPages}
            />
          )}
        </div>
      </div>

      {/* 5. Find and Replace Floating Panel */}
      <FindReplace
        editor={editorInstance}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 6. Export Book Modal */}
      {activeProject && (
        <ExportModal
          project={activeProject}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          previewContainerId="live-print-container"
        />
      )}

    </div>
  );
}
