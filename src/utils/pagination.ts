import type { BookProject, BookSettings } from '../db/indexedDb';
import { PAGE_SIZES, MARGINS } from '../templates/bookTemplates';

export const PX_PER_MM = 3.779527559; // 96 DPI standard

export interface PageBlock {
  type: string;
  html: string;
}

export interface PaginatedPage {
  id: string;
  pageNumber: number;
  chapterId: string;
  chapterTitle: string;
  blocks: PageBlock[];
  isLeftPage: boolean;
}

// Convert MM sizes to Pixels
export function getPageDimensions(settings: BookSettings) {
  let widthMm = 148;
  let heightMm = 210;

  if (settings.pageSize === 'Custom') {
    widthMm = settings.customWidth || 148;
    heightMm = settings.customHeight || 210;
  } else {
    const size = PAGE_SIZES[settings.pageSize];
    if (size) {
      widthMm = size.width;
      heightMm = size.height;
    }
  }

  // Handle landscape orientation
  if (settings.orientation === 'Landscape') {
    const temp = widthMm;
    widthMm = heightMm;
    heightMm = temp;
  }

  // Margins
  let margin = { top: 19.05, bottom: 19.05, left: 19.05, right: 19.05 };
  if (settings.margin === 'Custom' && settings.customMargins) {
    margin = settings.customMargins;
  } else {
    const m = MARGINS[settings.margin === 'Custom' ? 'Medium' : settings.margin];
    if (m) {
      margin = { top: m.top, bottom: m.bottom, left: m.left, right: m.right };
    }
  }

  return {
    widthPx: widthMm * PX_PER_MM,
    heightPx: heightMm * PX_PER_MM,
    widthMm,
    heightMm,
    marginTopPx: margin.top * PX_PER_MM,
    marginBottomPx: margin.bottom * PX_PER_MM,
    marginLeftPx: margin.left * PX_PER_MM,
    marginRightPx: margin.right * PX_PER_MM,
    printableHeightPx: (heightMm - margin.top - margin.bottom) * PX_PER_MM,
    printableWidthPx: (widthMm - margin.left - margin.right) * PX_PER_MM,
  };
}

// Paginates a project
export function paginateProject(project: BookProject): PaginatedPage[] {
  const dimensions = getPageDimensions(project.settings);
  const pages: PaginatedPage[] = [];
  let currentPageNumber = 1;

  // Create a hidden measurer div in the DOM
  const measurer = document.createElement('div');
  measurer.style.position = 'absolute';
  measurer.style.left = '-9999px';
  measurer.style.top = '-9999px';
  measurer.style.visibility = 'hidden';
  measurer.style.pointerEvents = 'none';
  measurer.style.width = `${dimensions.printableWidthPx}px`;
  measurer.style.fontFamily = project.typography.fontFamily;
  measurer.style.fontSize = `${project.typography.fontSize}pt`;
  measurer.style.lineHeight = `${project.typography.lineSpacing}`;
  
  // Set paragraph spacing style
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .measurer-content p {
      margin-bottom: ${project.typography.paragraphSpacing}px;
      text-indent: ${project.typography.firstLineIndent ? '1.5em' : '0'};
      text-align: justify;
    }
    .measurer-content p:first-of-type {
      text-indent: 0;
    }
    .measurer-content h1, .measurer-content h2, .measurer-content h3 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-family: ${project.typography.headingStyle === 'Serif' ? 'Georgia, serif' : project.typography.headingStyle === 'Elegant' ? 'Garamond, serif' : 'Arial, sans-serif'};
      page-break-after: avoid;
    }
    .measurer-content ul, .measurer-content ol {
      margin-bottom: ${project.typography.paragraphSpacing}px;
      padding-left: 1.5em;
    }
    .measurer-content blockquote {
      border-left: 3px solid #ccc;
      padding-left: 1em;
      margin-left: 0;
      font-style: italic;
      margin-bottom: ${project.typography.paragraphSpacing}px;
    }
    .measurer-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${project.typography.paragraphSpacing}px;
    }
    .measurer-content table td, .measurer-content table th {
      border: 1px solid #ddd;
      padding: 6px;
    }
    .measurer-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 10px auto;
    }
  `;
  document.head.appendChild(styleSheet);

  measurer.className = 'measurer-content';
  document.body.appendChild(measurer);

  // Helper to measure heights
  const measureHeight = (htmlContent: string): number => {
    measurer.innerHTML = htmlContent;
    return measurer.offsetHeight;
  };

  try {
    // Process each chapter
    for (const chapter of project.chapters) {
      // Each chapter starts on a new page
      let chapterPages: PageBlock[][] = [[]];
      let currentHeight = 0;

      // Parse HTML content into block-level elements
      const parser = new DOMParser();
      const doc = parser.parseFromString(chapter.content, 'text/html');
      const elements = Array.from(doc.body.children);

      // Add chapter header if needed
      let startIndex = 0;
      const firstElem = elements[0];
      const isHeading = firstElem && /^H[1-6]$/.test(firstElem.tagName);
      
      // If there is no heading at the start of the chapter, we can inject a chapter header
      if (!isHeading) {
        let headerHtml = '';
        if (project.typography.chapterStyle === 'Decorative') {
          headerHtml = `<div class="chapter-header decorative text-center py-8 border-b-2 border-double border-gray-400 mb-8">
            <span class="text-sm uppercase tracking-widest text-gray-500">Chapter</span>
            <h1 class="text-3xl font-serif mt-2">${chapter.title}</h1>
          </div>`;
        } else if (project.typography.chapterStyle === 'Modern') {
          headerHtml = `<div class="chapter-header modern text-left py-6 border-l-4 border-black pl-4 mb-8">
            <h1 class="text-4xl font-sans font-bold tracking-tight">${chapter.title}</h1>
          </div>`;
        } else if (project.typography.chapterStyle === 'Minimalist') {
          headerHtml = `<div class="chapter-header minimalist text-center py-4 mb-6">
            <h1 class="text-xl tracking-wide uppercase font-light">${chapter.title}</h1>
          </div>`;
        } else {
          headerHtml = `<div class="chapter-header standard text-center py-6 mb-8">
            <h1 class="text-2xl font-serif font-bold">${chapter.title}</h1>
          </div>`;
        }
        
        const headerHeight = measureHeight(headerHtml);
        chapterPages[chapterPages.length - 1].push({ type: 'header', html: headerHtml });
        currentHeight += headerHeight;
      }

      // Lay out remaining elements
      for (let i = startIndex; i < elements.length; i++) {
        const el = elements[i];
        const outerHtml = el.outerHTML;
        const elemHeight = measureHeight(outerHtml);

        if (currentHeight + elemHeight <= dimensions.printableHeightPx) {
          // Fits entirely
          chapterPages[chapterPages.length - 1].push({ type: el.tagName.toLowerCase(), html: outerHtml });
          currentHeight += elemHeight;
        } else {
          // Doesn't fit in the remaining space of the current page. Can we split it?
          if (el.tagName === 'P' && el.textContent && el.textContent.length > 50) {
            // It's a paragraph, let's try splitting it
            const words = el.textContent.split(/\s+/);
            let low = 0;
            let high = words.length;
            let bestFitIndex = 0;

            const baseStyle = el.getAttribute('style') || '';
            const classes = el.className;

            // Find the maximum number of words that will fit on the current page
            while (low <= high) {
              const mid = Math.floor((low + high) / 2);
              const testText = words.slice(0, mid).join(' ');
              const testHtml = `<p class="${classes}" style="${baseStyle}">${testText}</p>`;
              const testHeight = measureHeight(testHtml);

              if (currentHeight + testHeight <= dimensions.printableHeightPx) {
                bestFitIndex = mid;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }

            // Widow & Orphan check:
            // - If the split leaves too few words on either page (e.g. less than 15 words), push the whole paragraph
            const minWords = 15;
            const remainingWords = words.length - bestFitIndex;

            if (bestFitIndex >= minWords && remainingWords >= minWords) {
              // Perform split
              const page1Text = words.slice(0, bestFitIndex).join(' ');
              const page2Text = words.slice(bestFitIndex).join(' ');

              // Add first part to current page
              chapterPages[chapterPages.length - 1].push({
                type: 'p-split-1',
                html: `<p class="${classes}" style="${baseStyle}">${page1Text}</p>`
              });

              // Add second part as a new paragraph on the next page
              // Use special class to suppress first-line-indent for continuing paragraphs
              const continuationClass = classes ? `${classes} no-indent` : 'no-indent';
              const nextHtml = `<p class="${continuationClass}" style="${baseStyle}; text-indent: 0;">${page2Text}</p>`;
              
              chapterPages.push([]);
              chapterPages[chapterPages.length - 1].push({ type: 'p-split-2', html: nextHtml });
              
              currentHeight = measureHeight(nextHtml);
            } else {
              // Can't split nicely, push entire paragraph to next page
              chapterPages.push([]);
              chapterPages[chapterPages.length - 1].push({ type: 'p', html: outerHtml });
              currentHeight = elemHeight;
            }
          } else if ((el.tagName === 'UL' || el.tagName === 'OL') && el.children.length > 1) {
            // Split lists
            const listItems = Array.from(el.children);
            const isOrdered = el.tagName === 'OL';
            const listStartAttr = el.getAttribute('start') || '1';
            
            let listType = isOrdered ? 'ol' : 'ul';
            let currentListItems: string[] = [];
            
            // Check if even the list tag with one item fits
            let testListHtml = `<${listType}>${listItems[0].outerHTML}</${listType}>`;
            let testListHeight = measureHeight(testListHtml);

            if (currentHeight + testListHeight > dimensions.printableHeightPx) {
              // Push the entire list to the next page
              chapterPages.push([]);
              chapterPages[chapterPages.length - 1].push({ type: listType, html: outerHtml });
              currentHeight = elemHeight;
            } else {
              // Distribute items
              let index = 0;
              
              // Fill current page
              while (index < listItems.length) {
                const itemHtml = listItems[index].outerHTML;
                const nextTestList = `<${listType} ${isOrdered ? `start="${parseInt(listStartAttr) + currentListItems.length}"` : ''}>
                  ${currentListItems.concat(itemHtml).join('')}
                </${listType}>`;
                
                const nextHeight = measureHeight(nextTestList);
                if (currentHeight + nextHeight <= dimensions.printableHeightPx) {
                  currentListItems.push(itemHtml);
                  index++;
                } else {
                  break;
                }
              }

              // Save items that fit on current page
              if (currentListItems.length > 0) {
                chapterPages[chapterPages.length - 1].push({
                  type: listType + '-split-1',
                  html: `<${listType} ${isOrdered ? `start="${listStartAttr}"` : ''}>${currentListItems.join('')}</${listType}>`
                });
              }

              // Create next list container on new page
              chapterPages.push([]);
              const remainingItems = listItems.slice(index).map(item => item.outerHTML);
              const continuationHtml = `<${listType} ${isOrdered ? `start="${parseInt(listStartAttr) + index}"` : ''}>${remainingItems.join('')}</${listType}>`;
              
              chapterPages[chapterPages.length - 1].push({
                type: listType + '-split-2',
                html: continuationHtml
              });
              currentHeight = measureHeight(continuationHtml);
            }
          } else if (el.tagName === 'TABLE' && el.querySelector('tbody')) {
            // Split tables
            const hasHeader = el.querySelector('thead') !== null;
            const headerRow = hasHeader ? el.querySelector('thead tr')?.outerHTML : null;
            const bodyRows = Array.from(el.querySelectorAll('tbody tr'));
            
            // If the table is small, or we can't fit even header + 1 row, push whole table
            let minTableHtml = `<table>${hasHeader ? `<thead>${headerRow}</thead>` : ''}<tbody>${bodyRows[0]?.outerHTML || ''}</tbody></table>`;
            let minTableHeight = measureHeight(minTableHtml);

            if (currentHeight + minTableHeight > dimensions.printableHeightPx || bodyRows.length <= 1) {
              chapterPages.push([]);
              chapterPages[chapterPages.length - 1].push({ type: 'table', html: outerHtml });
              currentHeight = elemHeight;
            } else {
              // Add row by row
              let currentRows: string[] = [];
              let index = 0;

              while (index < bodyRows.length) {
                const rowHtml = bodyRows[index].outerHTML;
                const testTableHtml = `<table>
                  ${hasHeader ? `<thead>${headerRow}</thead>` : ''}
                  <tbody>${currentRows.concat(rowHtml).join('')}</tbody>
                </table>`;
                
                const nextHeight = measureHeight(testTableHtml);
                if (currentHeight + nextHeight <= dimensions.printableHeightPx) {
                  currentRows.push(rowHtml);
                  index++;
                } else {
                  break;
                }
              }

              if (currentRows.length > 0) {
                chapterPages[chapterPages.length - 1].push({
                  type: 'table-split-1',
                  html: `<table>
                    ${hasHeader ? `<thead>${headerRow}</thead>` : ''}
                    <tbody>${currentRows.join('')}</tbody>
                  </table>`
                });
              }

              // Rest goes to next page
              chapterPages.push([]);
              const remainingRows = bodyRows.slice(index).map(row => row.outerHTML);
              const continuationTableHtml = `<table>
                ${hasHeader ? `<thead>${headerRow}</thead>` : ''}
                <tbody>${remainingRows.join('')}</tbody>
              </table>`;
              
              chapterPages[chapterPages.length - 1].push({
                type: 'table-split-2',
                html: continuationTableHtml
              });
              currentHeight = measureHeight(continuationTableHtml);
            }
          } else {
            // General elements (images, short headers, blockquotes, horizontal rules)
            // Just push to next page
            chapterPages.push([]);
            chapterPages[chapterPages.length - 1].push({ type: el.tagName.toLowerCase(), html: outerHtml });
            currentHeight = elemHeight;
          }
        }
      }

      // Convert blocks list into PaginatedPage structures
      for (const blocks of chapterPages) {
        if (blocks.length === 0) continue;
        
        pages.push({
          id: crypto.randomUUID(),
          pageNumber: currentPageNumber,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          blocks: blocks,
          isLeftPage: currentPageNumber % 2 === 0
        });
        
        currentPageNumber++;
      }
    }
  } finally {
    // Cleanup temporary elements
    document.body.removeChild(measurer);
    document.head.removeChild(styleSheet);
  }

  return pages;
}
