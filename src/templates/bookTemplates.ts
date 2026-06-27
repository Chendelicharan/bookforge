import type { BookSettings, TypographySettings } from '../db/indexedDb';

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  settings: BookSettings;
  typography: TypographySettings;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'novel',
    name: 'Novel',
    description: 'Classic literary style with elegant serif typography, standard margins, and drop caps.',
    settings: {
      pageSize: 'A5',
      margin: 'Medium',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Georgia, serif',
      fontSize: 11,
      lineSpacing: 1.4,
      paragraphSpacing: 6,
      firstLineIndent: true,
      chapterStyle: 'Standard',
      headingStyle: 'Serif',
      dropCaps: true
    }
  },
  {
    id: 'light-novel',
    name: 'Light Novel',
    description: 'Compact layout optimized for fast reading with tighter spacing and cleaner presentation.',
    settings: {
      pageSize: 'A5',
      margin: 'Small',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Garamond, serif',
      fontSize: 10,
      lineSpacing: 1.3,
      paragraphSpacing: 4,
      firstLineIndent: true,
      chapterStyle: 'Minimalist',
      headingStyle: 'Serif',
      dropCaps: false
    }
  },
  {
    id: 'academic',
    name: 'Academic Book',
    description: 'Formal formatting with generous margins, structured serif headings, and wide line spacing.',
    settings: {
      pageSize: 'Letter',
      margin: 'Large',
      binding: 'Hardcover',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Times New Roman, serif',
      fontSize: 11,
      lineSpacing: 1.5,
      paragraphSpacing: 10,
      firstLineIndent: false,
      chapterStyle: 'Standard',
      headingStyle: 'Serif',
      dropCaps: false
    }
  },
  {
    id: 'story-book',
    name: 'Story Book',
    description: 'Delightful format featuring warm serif typography, large fonts, and beautiful chapter accents.',
    settings: {
      pageSize: 'A5',
      margin: 'Medium',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      lineSpacing: 1.5,
      paragraphSpacing: 8,
      firstLineIndent: true,
      chapterStyle: 'Decorative',
      headingStyle: 'Elegant',
      dropCaps: true
    }
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Modern multi-column layout with high density sans-serif typefaces and minimal borders.',
    settings: {
      pageSize: 'A4',
      margin: 'Small',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 2
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 9.5,
      lineSpacing: 1.25,
      paragraphSpacing: 6,
      firstLineIndent: false,
      chapterStyle: 'Modern',
      headingStyle: 'Sans',
      dropCaps: true
    }
  },
  {
    id: 'research',
    name: 'Research Paper',
    description: 'Rigorous layout conforming to academic publication guidelines with dual columns.',
    settings: {
      pageSize: 'Letter',
      margin: 'Medium',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 2
    },
    typography: {
      fontFamily: 'Times New Roman, serif',
      fontSize: 10,
      lineSpacing: 1.5,
      paragraphSpacing: 6,
      firstLineIndent: true,
      chapterStyle: 'Minimalist',
      headingStyle: 'Serif',
      dropCaps: false
    }
  },
  {
    id: 'childrens',
    name: "Children's Book",
    description: 'Large, readable sans-serif typefaces, huge margins, and landscape layout optimized for drawings.',
    settings: {
      pageSize: 'Letter',
      margin: 'Large',
      binding: 'Hardcover',
      orientation: 'Landscape',
      columns: 1
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      lineSpacing: 1.6,
      paragraphSpacing: 12,
      firstLineIndent: false,
      chapterStyle: 'Decorative',
      headingStyle: 'Sans',
      dropCaps: false
    }
  },
  {
    id: 'manga-script',
    name: 'Manga Script',
    description: 'Monospace screenplay formatting designed for scriptwriters and illustrators.',
    settings: {
      pageSize: 'A4',
      margin: 'Medium',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Courier New, monospace',
      fontSize: 11,
      lineSpacing: 1.3,
      paragraphSpacing: 6,
      firstLineIndent: false,
      chapterStyle: 'Minimalist',
      headingStyle: 'Sans',
      dropCaps: false
    }
  },
  {
    id: 'fantasy',
    name: 'Fantasy Novel',
    description: 'Mythical serif typeface styling, heavy drop caps, and elaborate decorative titles.',
    settings: {
      pageSize: 'A5',
      margin: 'Medium',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Garamond, serif',
      fontSize: 11.5,
      lineSpacing: 1.45,
      paragraphSpacing: 6,
      firstLineIndent: true,
      chapterStyle: 'Decorative',
      headingStyle: 'Elegant',
      dropCaps: true
    }
  },
  {
    id: 'business',
    name: 'Business Book',
    description: 'Sleek, modern sans-serif typography with clean spacing and readable headings.',
    settings: {
      pageSize: 'Letter',
      margin: 'Medium',
      binding: 'Hardcover',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 10.5,
      lineSpacing: 1.4,
      paragraphSpacing: 8,
      firstLineIndent: false,
      chapterStyle: 'Modern',
      headingStyle: 'Sans',
      dropCaps: false
    }
  },
  {
    id: 'poetry',
    name: 'Poetry',
    description: 'Centered layouts with wide spacing, allowing verses to occupy the absolute focus.',
    settings: {
      pageSize: 'A5',
      margin: 'Large',
      binding: 'Paperback',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Garamond, serif',
      fontSize: 12,
      lineSpacing: 1.6,
      paragraphSpacing: 12,
      firstLineIndent: false,
      chapterStyle: 'Minimalist',
      headingStyle: 'Elegant',
      dropCaps: false
    }
  },
  {
    id: 'biography',
    name: 'Biography',
    description: 'Prestigious serif look suitable for documenting life stories and historical archives.',
    settings: {
      pageSize: 'A5',
      margin: 'Medium',
      binding: 'Hardcover',
      orientation: 'Portrait',
      columns: 1
    },
    typography: {
      fontFamily: 'Georgia, serif',
      fontSize: 11,
      lineSpacing: 1.4,
      paragraphSpacing: 6,
      firstLineIndent: true,
      chapterStyle: 'Standard',
      headingStyle: 'Serif',
      dropCaps: true
    }
  }
];

export const PAGE_SIZES = {
  A4: { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
  A5: { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
  Letter: { width: 215.9, height: 279.4, label: 'Letter (8.5 x 11 in)' },
  Legal: { width: 215.9, height: 355.6, label: 'Legal (8.5 x 14 in)' }
};

export const MARGINS = {
  Small: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7, label: 'Small (0.5 in / 12.7 mm)' },
  Medium: { top: 19.05, bottom: 19.05, left: 19.05, right: 19.05, label: 'Medium (0.75 in / 19 mm)' },
  Large: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4, label: 'Large (1 in / 25.4 mm)' }
};
