import type { BookSettings } from '../db/indexedDb';

interface SettingsPanelProps {
  settings: BookSettings;
  onChange: (settings: BookSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const updateSetting = (key: keyof BookSettings, value: any) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const updateCustomMargin = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    const customMargins = settings.customMargins || { top: 19.05, bottom: 19.05, left: 19.05, right: 19.05 };
    onChange({
      ...settings,
      margin: 'Custom',
      customMargins: {
        ...customMargins,
        [side]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Book Format</h3>
        
        {/* Page Size */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Page Size</label>
          <select
            value={settings.pageSize}
            onChange={(e) => updateSetting('pageSize', e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <option value="A5">A5 Book Standard</option>
            <option value="A4">A4 Large Format</option>
            <option value="Letter">US Letter</option>
            <option value="Legal">US Legal</option>
            <option value="Custom">Custom Size...</option>
          </select>
        </div>

        {/* Custom Width and Height */}
        {settings.pageSize === 'Custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Width (mm)</label>
              <input
                type="number"
                value={settings.customWidth || 148}
                onChange={(e) => updateSetting('customWidth', Math.max(50, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Height (mm)</label>
              <input
                type="number"
                value={settings.customHeight || 210}
                onChange={(e) => updateSetting('customHeight', Math.max(50, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
          </div>
        )}

        {/* Page Orientation */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Page Orientation</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Portrait', 'Landscape'] as const).map((orient) => (
              <button
                key={orient}
                onClick={() => updateSetting('orientation', orient)}
                className={`rounded-xl py-2 text-xs border font-semibold transition-all ${
                  settings.orientation === orient
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850'
                }`}
              >
                {orient}
              </button>
            ))}
          </div>
        </div>

        {/* Binding */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Binding Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Paperback', 'Hardcover'] as const).map((bind) => (
              <button
                key={bind}
                onClick={() => updateSetting('binding', bind)}
                className={`rounded-xl py-2 text-xs border font-semibold transition-all ${
                  settings.binding === bind
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850'
                }`}
              >
                {bind}
              </button>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5 text-zinc-600 dark:text-zinc-400">Text Columns</label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((col) => (
              <button
                key={col}
                onClick={() => updateSetting('columns', col)}
                className={`rounded-xl py-2 text-xs border font-semibold transition-all ${
                  settings.columns === col
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850'
                }`}
              >
                {col} {col === 1 ? 'Column' : 'Columns'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-850 my-4"></div>

      {/* Margins Settings */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Margins</h3>
        
        <div className="mb-4">
          <select
            value={settings.margin}
            onChange={(e) => updateSetting('margin', e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <option value="Small">Small (0.5 in / 12.7 mm)</option>
            <option value="Medium">Medium (0.75 in / 19 mm)</option>
            <option value="Large">Large (1.0 in / 25.4 mm)</option>
            <option value="Custom">Custom Margins...</option>
          </select>
        </div>

        {/* Custom margins inputs */}
        {settings.margin === 'Custom' && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Top (mm)</label>
              <input
                type="number"
                value={settings.customMargins?.top ?? 19.05}
                onChange={(e) => updateCustomMargin('top', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Bottom (mm)</label>
              <input
                type="number"
                value={settings.customMargins?.bottom ?? 19.05}
                onChange={(e) => updateCustomMargin('bottom', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Left (mm)</label>
              <input
                type="number"
                value={settings.customMargins?.left ?? 19.05}
                onChange={(e) => updateCustomMargin('left', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1 text-zinc-500">Right (mm)</label>
              <input
                type="number"
                value={settings.customMargins?.right ?? 19.05}
                onChange={(e) => updateCustomMargin('right', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-850 dark:bg-zinc-950"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
