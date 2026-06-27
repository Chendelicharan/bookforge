import type { TypographySettings } from '../db/indexedDb';

interface TypographyPanelProps {
  typography: TypographySettings;
  onChange: (typography: TypographySettings) => void;
}

export default function TypographyPanel({ typography, onChange }: TypographyPanelProps) {
  const updateSetting = (key: keyof TypographySettings, value: any) => {
    onChange({
      ...typography,
      [key]: value
    });
  };

  const fonts = [
    { value: 'Georgia, serif', label: 'Georgia (Classic)' },
    { value: 'Garamond, serif', label: 'Garamond (Elegant)' },
    { value: 'Times New Roman, serif', label: 'Times New Roman (Academic)' },
    { value: 'Arial, sans-serif', label: 'Arial (Modern Sans)' },
    { value: 'system-ui, sans-serif', label: 'System UI (Clean)' },
    { value: 'Courier New, monospace', label: 'Courier New (Script)' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Font Settings</h3>
        
        {/* Font Family */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Body Font Family</label>
          <select
            value={typography.fontFamily}
            onChange={(e) => updateSetting('fontFamily', e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
            <span>Font Size</span>
            <span className="font-semibold">{typography.fontSize} pt</span>
          </div>
          <input
            type="range"
            min="8"
            max="24"
            step="0.5"
            value={typography.fontSize}
            onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
          />
        </div>

        {/* Line Spacing */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
            <span>Line Spacing</span>
            <span className="font-semibold">{typography.lineSpacing}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.05"
            value={typography.lineSpacing}
            onChange={(e) => updateSetting('lineSpacing', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
          />
        </div>

        {/* Paragraph Spacing */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
            <span>Paragraph Spacing</span>
            <span className="font-semibold">{typography.paragraphSpacing} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="1"
            value={typography.paragraphSpacing}
            onChange={(e) => updateSetting('paragraphSpacing', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-850 my-4"></div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Book Layout Style</h3>

        {/* Indentations and Drop Caps */}
        <div className="space-y-3 mb-5">
          <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-white/40 dark:border-zinc-800 dark:bg-zinc-950/20 cursor-pointer">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Indent First Lines</span>
            <input
              type="checkbox"
              checked={typography.firstLineIndent}
              onChange={(e) => updateSetting('firstLineIndent', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-white/40 dark:border-zinc-800 dark:bg-zinc-950/20 cursor-pointer">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Enable Drop Caps</span>
            <input
              type="checkbox"
              checked={typography.dropCaps}
              onChange={(e) => updateSetting('dropCaps', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
          </label>
        </div>

        {/* Chapter Headers Style */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Chapter Heading Style</label>
          <select
            value={typography.chapterStyle}
            onChange={(e) => updateSetting('chapterStyle', e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <option value="Standard">Standard Serif Centered</option>
            <option value="Decorative">Decorative Double Borders</option>
            <option value="Modern">Modern Side bar block</option>
            <option value="Minimalist">Minimalist Light Caps</option>
          </select>
        </div>

        {/* Heading Style */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Header Text Font</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Serif', 'Sans', 'Elegant'] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateSetting('headingStyle', style)}
                className={`rounded-xl py-2 text-xs border font-semibold transition-all ${
                  typography.headingStyle === style
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
