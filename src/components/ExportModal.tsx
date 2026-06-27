import { useState } from 'react';
import type { BookProject } from '../db/indexedDb';
import { exportToTxt, exportToHtml, exportToEpub, exportToDocx, exportToPdfDirect } from '../utils/exporters';
import { X, FileText, Globe, BookOpen, FileCode, Printer, Download, Sparkles } from 'lucide-react';

interface ExportModalProps {
  project: BookProject;
  isOpen: boolean;
  onClose: () => void;
  previewContainerId: string;
}

export default function ExportModal({ project, isOpen, onClose, previewContainerId }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportType, setExportType] = useState<string | null>(null);

  if (!isOpen) return null;

  const runExporter = async (type: 'pdf-direct' | 'pdf-print' | 'docx' | 'epub' | 'html' | 'txt') => {
    setIsExporting(true);
    setProgress(0);
    setExportType(type);

    try {
      switch (type) {
        case 'txt':
          exportToTxt(project);
          break;
        case 'html':
          exportToHtml(project);
          break;
        case 'epub':
          await exportToEpub(project);
          break;
        case 'docx':
          await exportToDocx(project);
          break;
        case 'pdf-print':
          // Triggers system print
          window.print();
          break;
        case 'pdf-direct':
          await exportToPdfDirect(project, previewContainerId, (pct) => {
            setProgress(pct);
          });
          break;
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
      if (type !== 'pdf-print') {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[550px] overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold">Export Book</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isExporting}
            className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isExporting ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Spinner */}
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-800"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Generating your file...</p>
              {exportType === 'pdf-direct' && (
                <p className="text-xs text-zinc-500 mt-1">Rendering pages: {progress}%</p>
              )}
            </div>
            {exportType === 'pdf-direct' && (
              <div className="w-64 h-2 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-800">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-zinc-500">
              Select an export format. All exports automatically compile your chapters, update page pagination, and format layouts based on your settings.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Print Ready PDF via browser */}
              <button
                onClick={() => runExporter('pdf-print')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                  <Printer className="h-5 w-5" />
                  <span className="font-bold text-sm">PDF (Print Dialog)</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Best quality. Embeds vector fonts. Ideal for physical printing.
                </span>
              </button>

              {/* Direct PDF Download */}
              <button
                onClick={() => runExporter('pdf-direct')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                  <Download className="h-5 w-5" />
                  <span className="font-bold text-sm">PDF (Direct Download)</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Offline client-side render. Direct file download.
                </span>
              </button>

              {/* Word DOCX */}
              <button
                onClick={() => runExporter('docx')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <FileText className="h-5 w-5" />
                  <span className="font-bold text-sm">Word Document (DOCX)</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Editable format compatible with MS Word and Google Docs.
                </span>
              </button>

              {/* EPUB E-book */}
              <button
                onClick={() => runExporter('epub')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-bold text-sm">EPUB E-Book</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Standard format for e-readers like Kindle, Apple Books, Kobo.
                </span>
              </button>

              {/* HTML Webpage */}
              <button
                onClick={() => runExporter('html')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-sky-500 mb-1">
                  <Globe className="h-5 w-5" />
                  <span className="font-bold text-sm">Web Page (HTML)</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Self-contained HTML file styled with responsive layout.
                </span>
              </button>

              {/* Plain Text TXT */}
              <button
                onClick={() => runExporter('txt')}
                className="flex flex-col items-start p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-left transition-all dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <FileCode className="h-5 w-5" />
                  <span className="font-bold text-sm">Plain Text (TXT)</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Raw unstyled text file. Fast extract of all chapter draft copy.
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-300 px-5 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
