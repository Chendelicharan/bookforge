import type { BookProject } from '../db/indexedDb';
import { getPageDimensions } from './pagination';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper for direct file downloading
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// 1. TXT Exporter
export function exportToTxt(project: BookProject) {
  let content = `==================================================\n`;
  content += `${project.title.toUpperCase()}\n`;
  content += `==================================================\n\n`;

  project.chapters.forEach((chapter) => {
    // Parse HTML to raw text
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapter.content, 'text/html');
    const textContent = doc.body.textContent || '';
    
    content += `=== ${chapter.title} ===\n\n`;
    content += textContent.replace(/\n\s*\n/g, '\n\n').trim();
    content += `\n\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${project.title.replace(/\s+/g, '_')}.txt`);
}

// 2. HTML Exporter
export function exportToHtml(project: BookProject) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: ${project.typography.fontFamily};
      font-size: ${project.typography.fontSize}pt;
      line-height: ${project.typography.lineSpacing};
      color: #111;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      text-align: justify;
    }
    h1, h2, h3 {
      font-family: ${project.typography.headingStyle === 'Serif' ? 'Georgia, serif' : 'Arial, sans-serif'};
      color: #000;
    }
    .chapter {
      margin-bottom: 60px;
      page-break-before: always;
    }
    .chapter-title {
      font-size: 2em;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    p {
      margin-bottom: ${project.typography.paragraphSpacing}px;
      text-indent: ${project.typography.firstLineIndent ? '1.5em' : '0'};
    }
    p:first-of-type {
      text-indent: 0;
    }
    blockquote {
      border-left: 3px solid #ccc;
      padding-left: 15px;
      margin-left: 10px;
      font-style: italic;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table, th, td {
      border: 1px solid #ddd;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
    }
  </style>
</head>
<body>
`;

  project.chapters.forEach((chapter) => {
    html += `  <div class="chapter">\n`;
    html += `    <h1 class="chapter-title">${chapter.title}</h1>\n`;
    html += `    <div class="chapter-content">\n      ${chapter.content}\n    </div>\n`;
    html += `  </div>\n`;
  });

  html += `</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${project.title.replace(/\s+/g, '_')}.html`);
}

// 3. EPUB Exporter
export async function exportToEpub(project: BookProject) {
  const zip = new JSZip();

  // 1. mimetype (Must be FIRST file and UNCOMPRESSED)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/book.css
  const bookCss = `body {
  font-family: serif;
  margin: 5%;
  text-align: justify;
}
h1, h2, h3 {
  font-family: sans-serif;
  text-align: center;
}
p {
  text-indent: 1.5em;
  margin: 0 0 0.5em 0;
}
p.no-indent {
  text-indent: 0;
}
blockquote {
  margin: 1em 5%;
  font-style: italic;
  border-left: 2px solid #ccc;
  padding-left: 1em;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ccc;
  padding: 0.5em;
}`;
  zip.file('OEBPS/book.css', bookCss);

  // 4. Create chapter files
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const tocItems: string[] = [];
  const navItems: string[] = [];

  project.chapters.forEach((chapter, index) => {
    const filename = `chapter_${index + 1}.xhtml`;
    const id = `chap_${index + 1}`;
    
    // Process content for XHTML compatibility
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${chapter.content}</div>`, 'text/html');
    
    // Ensure XML compliance (DOMParser converts HTML to compliant DOM, XMLSerializer serializes correctly)
    const xmlSerializer = new XMLSerializer();
    const cleanContent = xmlSerializer.serializeToString(doc.body.firstChild || doc.body);
    
    const xhtmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="book.css" />
</head>
<body>
  <section epub:type="chapter" id="${id}">
    <h1 class="chapter-title">${chapter.title}</h1>
    ${cleanContent}
  </section>
</body>
</html>`;

    zip.file(`OEBPS/${filename}`, xhtmlContent);
    
    manifestItems.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);
    tocItems.push(`<navPoint id="np_${index + 1}" playOrder="${index + 1}">
      <navLabel><text>${chapter.title}</text></navLabel>
      <content src="${filename}"/>
    </navPoint>`);
    navItems.push(`<li><a href="${filename}">${chapter.title}</a></li>`);
  });

  const bookId = `urn:uuid:${crypto.randomUUID()}`;

  // 5. OEBPS/toc.ncx (compatibility)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${project.title}</text></docTitle>
  <navMap>
    ${tocItems.join('\n    ')}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 6. OEBPS/nav.xhtml (HTML5 Navigation)
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="book.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navItems.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 7. OEBPS/content.opf (Manifest and Metadata)
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${bookId}</dc:identifier>
    <dc:title>${project.title}</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="book.css" media-type="text/css"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // Package Zip and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${project.title.replace(/\s+/g, '_')}.epub`);
}

// 4. DOCX Exporter
export async function exportToDocx(project: BookProject) {
  const docSections: any[] = [];

  for (const chapter of project.chapters) {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(chapter.content, 'text/html');
    const elements = Array.from(htmlDoc.body.children);
    const docxParagraphs: any[] = [];

    // Add chapter header
    docxParagraphs.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 }
      })
    );

    // Convert HTML elements to docx equivalents
    elements.forEach((el) => {
      if (/^H[1-6]$/.test(el.tagName)) {
        const level = parseInt(el.tagName.substring(1));
        docxParagraphs.push(
          new Paragraph({
            text: el.textContent || '',
            heading: level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
            spacing: { before: 200, after: 100 }
          })
        );
      } else if (el.tagName === 'P') {
        const runs: TextRun[] = [];
        
        // Simple inline styles parser
        const processNode = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun({ text: node.textContent || '' }));
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const elem = node as HTMLElement;
            const text = elem.textContent || '';
            const bold = elem.tagName === 'STRONG' || elem.tagName === 'B' || elem.style.fontWeight === 'bold';
            const italic = elem.tagName === 'EM' || elem.tagName === 'I' || elem.style.fontStyle === 'italic';
            const underline = elem.tagName === 'U' || elem.style.textDecoration === 'underline';
            let color: string | undefined = undefined;
            if (elem.style.color) {
              // Extract hex color if available
              const rgb = elem.style.color.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                color = ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
              }
            }
            
            runs.push(
              new TextRun({
                text: text,
                bold: bold,
                italics: italic,
                underline: underline ? {} : undefined,
                color: color
              })
            );
          }
        };

        el.childNodes.forEach(processNode);

        docxParagraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED
          })
        );
      } else if (el.tagName === 'BLOCKQUOTE') {
        docxParagraphs.push(
          new Paragraph({
            text: el.textContent || '',
            spacing: { before: 120, after: 120 },
            indent: { left: 720 }, // 0.5 inches
            style: 'Normal'
          })
        );
      } else if (el.tagName === 'UL' || el.tagName === 'OL') {
        Array.from(el.children).forEach((li) => {
          docxParagraphs.push(
            new Paragraph({
              text: li.textContent || '',
              bullet: el.tagName === 'UL' ? { level: 0 } : undefined,
              numbering: el.tagName === 'OL' ? { reference: 'num-ref', level: 0 } : undefined,
              spacing: { after: 60 }
            })
          );
        });
      } else if (el.tagName === 'TABLE') {
        const rows = Array.from(el.querySelectorAll('tr'));
        const tableRows: TableRow[] = [];

        rows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          const tableCells: TableCell[] = [];

          cells.forEach((cell) => {
            tableCells.push(
              new TableCell({
                children: [new Paragraph({ text: cell.textContent || '' })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
                }
              })
            );
          });

          tableRows.push(new TableRow({ children: tableCells }));
        });

        docxParagraphs.push(new Table({ rows: tableRows }));
      }
    });

    docSections.push({
      properties: {},
      children: docxParagraphs
    });
  }

  const doc = new Document({
    sections: docSections
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${project.title.replace(/\s+/g, '_')}.docx`);
}

// 5. High-Quality PDF Exporter (Direct Client-Side Canvas Render)
export async function exportToPdfDirect(project: BookProject, previewContainerId: string, onProgress?: (percent: number) => void) {
  const container = document.getElementById(previewContainerId);
  if (!container) {
    throw new Error('Preview container not found');
  }

  // Find all page elements in the preview container
  const pageElements = Array.from(container.querySelectorAll('.book-page'));
  if (pageElements.length === 0) {
    throw new Error('No pages found to export');
  }

  // Get physical page size details
  const dims = getPageDimensions(project.settings);
  
  // Initialize jsPDF
  // jsPDF format can be custom or standard
  const orientation = project.settings.orientation === 'Landscape' ? 'l' : 'p';
  const format = project.settings.pageSize === 'Custom' 
    ? [dims.widthMm, dims.heightMm] 
    : project.settings.pageSize.toLowerCase();
  
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: format,
    compress: true
  });

  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    if (onProgress) {
      onProgress(Math.round((i / pageElements.length) * 100));
    }

    const pageEl = pageElements[i] as HTMLElement;

    // Use html2canvas to capture page layout.
    // Use scale 2 or 3 for high-quality 300 DPI printing.
    const canvas = await html2canvas(pageEl, {
      scale: 3, // 3x scale is perfect for crisp text (approx 300 DPI print-ready quality)
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, dims.widthMm, dims.heightMm, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(100);
  }

  pdf.save(`${project.title.replace(/\s+/g, '_')}.pdf`);
}
