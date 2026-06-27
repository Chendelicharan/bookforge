import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Search, ChevronDown, ChevronUp, Replace, ReplaceAll, X, CaseSensitive, Binary } from 'lucide-react';

interface FindReplaceProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FindReplace({ editor, isOpen, onClose }: FindReplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [matchesLocations, setMatchesLocations] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen || !editor || !searchQuery) {
      setMatchesCount(0);
      setCurrentIndex(-1);
      return;
    }

    // Simple parser to find text matches in text content
    const text = editor.getText();
    let flags = 'g';
    if (!isCaseSensitive) flags += 'i';

    try {
      let regex: RegExp;
      if (isRegex) {
        regex = new RegExp(searchQuery, flags);
      } else {
        // Escape regex special chars for literal search
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, flags);
      }

      const matches = Array.from(text.matchAll(regex));
      setMatchesCount(matches.length);
      
      if (matches.length > 0) {
        setCurrentIndex(0);
        // Track character indexes of matches
        setMatchesLocations(matches.map(m => m.index || 0));
      } else {
        setCurrentIndex(-1);
        setMatchesLocations([]);
      }
    } catch (e) {
      // Invalid regex
      setMatchesCount(0);
      setCurrentIndex(-1);
      setMatchesLocations([]);
    }
  }, [searchQuery, isCaseSensitive, isRegex, isOpen, editor]);

  const handleFindNext = () => {
    if (matchesCount === 0) return;
    const nextIdx = (currentIndex + 1) % matchesCount;
    setCurrentIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handleFindPrev = () => {
    if (matchesCount === 0) return;
    const prevIdx = (currentIndex - 1 + matchesCount) % matchesCount;
    setCurrentIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  const scrollToMatch = (matchIdx: number) => {
    if (!editor || matchesLocations.length === 0) return;
    const charPos = matchesLocations[matchIdx];
    
    // Focus editor and select the matched word
    editor.commands.focus();
    const length = searchQuery.length;
    editor.commands.setTextSelection({
      from: charPos + 1, // 1-indexed in ProseMirror
      to: charPos + length + 1
    });
  };

  // Replace active match
  const handleReplace = () => {
    if (!editor || currentIndex === -1 || matchesLocations.length === 0) return;

    const charPos = matchesLocations[currentIndex];
    const length = searchQuery.length;

    // Delete current selection and insert replacement
    editor.commands.setTextSelection({
      from: charPos + 1,
      to: charPos + length + 1
    });
    editor.commands.insertContent(replaceQuery);

    // Refresh matches
    setTimeout(() => {
      // Force effect re-run by setting search query to itself
      setSearchQuery(prev => prev);
    }, 50);
  };

  // Replace all occurrences in HTML
  const handleReplaceAll = () => {
    if (!editor || !searchQuery) return;

    const html = editor.getHTML();
    let flags = 'g';
    if (!isCaseSensitive) flags += 'i';

    try {
      let regex: RegExp;
      if (isRegex) {
        regex = new RegExp(searchQuery, flags);
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, flags);
      }

      // We perform replace on HTML, being careful not to replace tags.
      // A safer approach: we can use the text replace on the plain text
      // but to preserve formatting we replace text inside elements.
      // An easy, robust approach is:
      // Let's set text content directly if it doesn't contain HTML,
      // or perform an HTML tag-aware text replace.
      // A standard client-side implementation of global replace:
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Helper function to recursively replace text in text nodes
      const replaceTextInNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = (node.nodeValue || '').replace(regex, replaceQuery);
        } else {
          node.childNodes.forEach(replaceTextInNode);
        }
      };
      
      replaceTextInNode(doc.body);
      editor.commands.setContent(doc.body.innerHTML);
      
      setSearchQuery(prev => prev); // refresh
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-40 w-80 rounded-2xl border border-white/20 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 transition-all">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Search className="h-3.5 w-3.5" /> Find & Replace
        </span>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Find text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-3 pr-20 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1 text-[10px] text-zinc-400 font-semibold">
            {matchesCount > 0 ? (
              <span>{currentIndex + 1}/{matchesCount}</span>
            ) : searchQuery ? (
              <span className="text-rose-500">0 matches</span>
            ) : null}
          </div>
        </div>

        {/* Replace input */}
        <div>
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          />
        </div>

        {/* Options */}
        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-850">
          <button
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
              isCaseSensitive 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' 
                : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800'
            }`}
          >
            <CaseSensitive className="h-3.5 w-3.5" /> Aa
          </button>

          <button
            onClick={() => setIsRegex(!isRegex)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
              isRegex 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' 
                : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800'
            }`}
          >
            <Binary className="h-3.5 w-3.5" /> Regex
          </button>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleFindPrev}
            disabled={matchesCount === 0}
            className="flex items-center justify-center gap-1 rounded-xl border border-zinc-200 py-2 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
          >
            <ChevronUp className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={handleFindNext}
            disabled={matchesCount === 0}
            className="flex items-center justify-center gap-1 rounded-xl border border-zinc-200 py-2 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
          >
            <ChevronDown className="h-4 w-4" /> Next
          </button>
          <button
            onClick={handleReplace}
            disabled={currentIndex === -1}
            className="flex items-center justify-center gap-1 rounded-xl border border-zinc-200 py-2 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
          >
            <Replace className="h-4 w-4" /> Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matchesCount === 0}
            className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <ReplaceAll className="h-4 w-4" /> Replace All
          </button>
        </div>
      </div>
    </div>
  );
}
