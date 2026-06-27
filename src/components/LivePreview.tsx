import type { CSSProperties } from 'react';
import type { PaginatedPage } from '../utils/pagination';
import { getPageDimensions } from '../utils/pagination';
import type { BookProject } from '../db/indexedDb';

interface LivePreviewProps {
  project: BookProject;
  pages: PaginatedPage[];
}

export default function LivePreview({ project, pages }: LivePreviewProps) {
  const dims = getPageDimensions(project.settings);

  // Convert page sizes to inline styles for the book-page mockup
  const pageStyle: CSSProperties = {
    width: `${dims.widthPx}px`,
    height: `${dims.heightPx}px`,
    paddingTop: `${dims.marginTopPx}px`,
    paddingBottom: `${dims.marginBottomPx}px`,
    paddingLeft: `${dims.marginLeftPx}px`,
    paddingRight: `${dims.marginRightPx}px`,
  };

  const getPageColumnStyle = (): React.CSSProperties => {
    if (project.settings.columns > 1) {
      return {
        columnCount: project.settings.columns,
        columnGap: '24px',
        columnFill: 'auto',
        height: '100%',
      };
    }
    return { height: '100%' };
  };

  const isSpread = project.settings.viewMode === 'spread';
  const containerClass = isSpread
    ? "grid grid-cols-2 gap-x-4 gap-y-10 py-8 px-8 max-w-fit mx-auto h-full overflow-y-auto print:flex print:flex-col print:gap-0 print:p-0"
    : "flex flex-col items-center gap-8 py-8 w-full h-full overflow-y-auto print:p-0 print:gap-0";

  const getPageClass = (pageNumber: number, isLeftPage: boolean) => {
    const base = "book-page relative bg-[#faf9f6] text-[#1c1917] shadow-xl border border-zinc-200/50 flex flex-col justify-between select-none print:shadow-none print:border-none transition-transform duration-300";
    
    let layout = "";
    if (isSpread) {
      if (pageNumber === 1) {
        layout = "col-start-2 rounded-r-md rounded-l-sm border-l border-l-zinc-300 shadow-l-md";
      } else if (isLeftPage) {
        layout = "rounded-l-md rounded-r-sm border-r border-r-zinc-300 shadow-r-md";
      } else {
        layout = "rounded-r-md rounded-l-sm border-l border-l-zinc-300 shadow-l-md";
      }
    } else {
      layout = project.settings.binding === 'Hardcover' ? 'rounded-r-sm border-l-4 border-l-zinc-350' : 'rounded-sm';
    }

    return `${base} ${layout}`;
  };

  return (
    <div className={containerClass}>
      
      {/* Styles injected to handle fonts and specific layout rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        .book-page-content {
          font-family: ${project.typography.fontFamily};
          font-size: ${project.typography.fontSize}pt;
          line-height: ${project.typography.lineSpacing};
          text-align: justify;
        }
        .book-page-content p {
          margin-bottom: ${project.typography.paragraphSpacing}px;
          text-indent: ${project.typography.firstLineIndent ? '1.5em' : '0'};
        }
        .book-page-content p.no-indent {
          text-indent: 0 !important;
        }
        .book-page-content h1, .book-page-content h2, .book-page-content h3 {
          font-family: ${
            project.typography.headingStyle === 'Serif' 
              ? 'Georgia, serif' 
              : project.typography.headingStyle === 'Elegant' 
                ? 'Garamond, serif' 
                : 'Arial, sans-serif'
          };
          font-weight: bold;
        }
        .book-page-content blockquote {
          border-left: 3px solid #cbd5e1;
          padding-left: 12px;
          margin-left: 4px;
          font-style: italic;
          color: #475569;
          margin-bottom: ${project.typography.paragraphSpacing}px;
        }
        .book-page-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: ${project.typography.paragraphSpacing}px;
        }
        .book-page-content table td, .book-page-content table th {
          border: 1px solid #e2e8f0;
          padding: 6px;
          font-size: 0.9em;
        }
        .book-page-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 12px auto;
        }
        
        /* Drop Caps style */
        .drop-caps p:first-of-type::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          margin-top: 0.1em;
          margin-right: 0.1em;
          font-weight: bold;
          font-family: Georgia, serif;
        }
        
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .book-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: white !important;
          }
        }
      `}} />

      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-zinc-400 dark:text-zinc-600">
          <p className="text-sm font-medium">Drafting the book pages...</p>
        </div>
      ) : (
        pages.map((page) => {
          const isFirstPageOfChapter = page.blocks.some(b => b.type === 'header');
          const showDropCaps = project.typography.dropCaps && isFirstPageOfChapter;

          return (
            <div
              key={page.id}
              className={getPageClass(page.pageNumber, page.isLeftPage)}
              style={pageStyle}
            >
              {/* Header: Alternating Book Title and Chapter Title */}
              <div className="w-full flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-250/30 pb-2 mb-4 font-serif uppercase tracking-widest print:flex">
                {page.isLeftPage ? (
                  <>
                    <span>{page.pageNumber}</span>
                    <span className="truncate max-w-[200px]">{project.title}</span>
                    <span></span>
                  </>
                ) : (
                  <>
                    <span></span>
                    <span className="truncate max-w-[200px]">{page.chapterTitle}</span>
                    <span>{page.pageNumber}</span>
                  </>
                )}
              </div>

              {/* Printable Body Content */}
              <div 
                className={`flex-1 overflow-hidden book-page-content ${showDropCaps ? 'drop-caps' : ''}`}
                style={getPageColumnStyle()}
              >
                {page.blocks.map((block, bIdx) => (
                  <div key={bIdx} dangerouslySetInnerHTML={{ __html: block.html }} />
                ))}
              </div>

              {/* Footer (Empty since page numbers are in header for alternating look) */}
              <div className="w-full h-2 mt-4 text-center text-[10px] text-zinc-400">
                {/* Custom binding crease line for visual mockup depth */}
                <div className={`absolute top-0 bottom-0 w-[1px] bg-black/5 ${
                  page.isLeftPage ? 'right-0' : 'left-0'
                } print:hidden`}></div>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}
