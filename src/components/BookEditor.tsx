import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';

import ImageEditorModal from './ImageEditorModal';
import { 
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Minus, Image as ImageIcon, Link as LinkIcon,
  Undo, Redo, Quote, Code, Heading1, Heading2, Heading3, Palette, Highlighter
} from 'lucide-react';

// Custom extended Image extension to handle size, alignment, and captions natively
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => ({
          'data-align': attributes.align,
          class: `img-align-${attributes.align}`
        })
      },
      widthPercent: {
        default: 100,
        parseHTML: element => parseInt(element.getAttribute('data-width') || '100'),
        renderHTML: attributes => ({
          'data-width': attributes.widthPercent,
          style: `width: ${attributes.widthPercent}%;`
        })
      },
      caption: {
        default: '',
        parseHTML: element => element.getAttribute('data-caption') || '',
        renderHTML: attributes => ({
          'data-caption': attributes.caption
        })
      }
    };
  }
});

interface BookEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  onSetEditorInstance: (editor: any) => void;
}

export default function BookEditor({ content, onChange, onSetEditorInstance }: BookEditorProps) {
  const [editorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Editor Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImageSrc, setActiveImageSrc] = useState('');
  const [isEditingExistingImage, setIsEditingExistingImage] = useState(false);
  const [imageAttributes, setImageAttributes] = useState({
    widthPercent: 100,
    align: 'center',
    caption: ''
  });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true }
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CustomImage
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      onSetEditorInstance(editor);
    }
  }, [editorKey]);

  // Custom Bubble Selection Menu State
  const [menuState, setMenuState] = useState<{ visible: boolean, x: number, y: number }>({ visible: false, x: 0, y: 0 });

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { selection } = editor.state;
      if (selection.empty || editor.isActive('image')) {
        setMenuState({ visible: false, x: 0, y: 0 });
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(selection.from);
      const end = view.coordsAtPos(selection.to);
      
      const container = view.dom.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // Calculate center position above selection
      const x = (start.left + end.right) / 2 - containerRect.left + container.scrollLeft;
      const y = start.top - containerRect.top + container.scrollTop - 44;

      setMenuState({ visible: true, x, y });
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('blur', () => {
      // Small timeout to allow clicks inside the menu before closing
      setTimeout(() => {
        if (editor.view.dom && !editor.view.dom.contains(document.activeElement)) {
          setMenuState({ visible: false, x: 0, y: 0 });
        }
      }, 150);
    });

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  // Sync editor when chapter changes (using key replacement or content set)
  React.useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle Image upload selection
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setActiveImageSrc(reader.result);
        setIsEditingExistingImage(false);
        setImageAttributes({ widthPercent: 100, align: 'center', caption: '' });
        setImageModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so same image can be re-uploaded
    e.target.value = '';
  };

  // Double click or click on image inside editor to edit it
  React.useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const src = target.getAttribute('src') || '';
        const align = target.getAttribute('data-align') || 'center';
        const widthPercent = parseInt(target.getAttribute('data-width') || '100');
        const caption = target.getAttribute('data-caption') || '';

        setActiveImageSrc(src);
        setIsEditingExistingImage(true);
        setImageAttributes({ widthPercent, align, caption });
        setImageModalOpen(true);
      }
    };

    const view = editor.view.dom;
    view.addEventListener('dblclick', handleImageClick);
    return () => {
      view.removeEventListener('dblclick', handleImageClick);
    };
  }, [editor]);

  // Save changes from Fabric Image Studio back to document
  const handleSaveImageChanges = (editedSrc: string, width: number, align: string, caption: string) => {
    if (!editor) return;

    if (isEditingExistingImage) {
      // Update selected/existing image attributes
      editor.chain().focus().updateAttributes('image', {
        src: editedSrc,
        widthPercent: width,
        align: align,
        caption: caption
      }).run();
    } else {
      // Insert new image node
      editor.chain().focus().setImage({
        src: editedSrc,
        // @ts-ignore
        widthPercent: width,
        align: align,
        caption: caption
      }).run();
    }
    setImageModalOpen(false);
  };

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL link address:', previousUrl);
    
    // cancelled
    if (url === null) return;
    
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      
      {/* Top Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        
        {/* Undo/Redo */}
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40">
          <Undo className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40">
          <Redo className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Headings */}
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Heading1 className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 3 }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Bold, Italic, Underline */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Bold className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Italic className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('underline') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Alignment */}
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <AlignRight className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <AlignJustify className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Lists & Quotes */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <List className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('blockquote') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Quote className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('codeBlock') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Color and Highlight Pickers */}
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => editor.chain().focus().setColor('#ef4444').run()} 
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800" 
            title="Red Text"
          >
            <Palette className="h-4 w-4 text-rose-500" />
          </button>
          <button 
            onClick={() => editor.chain().focus().setHighlight({ color: '#fef08a' }).run()} 
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800" 
            title="Yellow Highlight"
          >
            <Highlighter className="h-4 w-4 text-amber-500" />
          </button>
          <button 
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              editor.chain().focus().unsetHighlight().run();
            }} 
            className="p-1 text-xs text-zinc-400 font-semibold hover:text-zinc-650"
            title="Clear Text Formatting"
          >
            Clear
          </button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

        {/* Link / Image / Horizontal rule / Tables */}
        <button onClick={addLink} className={`p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('link') ? 'bg-zinc-250 dark:bg-zinc-800 text-indigo-500' : ''}`}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <Minus className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <TableIcon className="h-4 w-4" />
        </button>
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageFileSelect}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
        />

        {/* Dynamic Table Manipulation Options (visible when cursor inside table) */}
        {editor.isActive('table') && (
          <div className="flex items-center gap-0.5 border-l border-zinc-300 dark:border-zinc-800 pl-2 ml-1">
            <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Add Col</button>
            <button onClick={() => editor.chain().focus().addRowBefore().run()} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Add Row</button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-rose-500 dark:border-zinc-800 dark:hover:bg-zinc-900">Del Col</button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-rose-500 dark:border-zinc-800 dark:hover:bg-zinc-900">Del Row</button>
            <button onClick={() => editor.chain().focus().deleteTable().run()} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-zinc-800 dark:bg-rose-950/30">Delete Table</button>
          </div>
        )}

      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-6 focus:outline-none select-text relative">
        {menuState.visible && (
          <div 
            className="absolute z-30 flex items-center gap-1 rounded-2xl border border-white/20 bg-white/90 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90"
            style={{ left: `${menuState.x}px`, top: `${menuState.y}px`, transform: 'translateX(-50%)' }}
          >
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'text-indigo-500' : ''}`}>
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'text-indigo-500' : ''}`}>
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('underline') ? 'text-indigo-500' : ''}`}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>
            <div className="h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>
            <button onClick={addLink} className={`p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('link') ? 'text-indigo-500' : ''}`}>
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <Quote className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <EditorContent 
          editor={editor} 
          className="prose prose-zinc max-w-none dark:prose-invert focus:outline-none min-h-[400px] outline-none"
        />
      </div>

      {/* Image Editor Popup */}
      <ImageEditorModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageSrc={activeImageSrc}
        initialWidthPercent={imageAttributes.widthPercent}
        initialAlignment={imageAttributes.align}
        initialCaption={imageAttributes.caption}
        onSave={handleSaveImageChanges}
      />

    </div>
  );
}
