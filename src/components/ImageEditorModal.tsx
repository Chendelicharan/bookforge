import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Rect, filters } from 'fabric';
import { X, RotateCw, RefreshCw, Layers, Check, Sliders, Image as ImageIcon } from 'lucide-react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (editedImageSrc: string, widthPercent: number, alignment: string, caption: string) => void;
  initialWidthPercent?: number;
  initialAlignment?: string;
  initialCaption?: string;
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  initialWidthPercent = 100,
  initialAlignment = 'center',
  initialCaption = ''
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const imageObjectRef = useRef<FabricImage | null>(null);

  // Formatting state
  const [widthPercent, setWidthPercent] = useState<number>(initialWidthPercent);
  const [alignment, setAlignment] = useState<string>(initialAlignment);
  const [caption, setCaption] = useState<string>(initialCaption);
  const [compressionQuality, setCompressionQuality] = useState<number>(0.8);

  // Filters state
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [sepia, setSepia] = useState<boolean>(false);

  // Crop mode state
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const cropRectRef = useRef<Rect | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Create Fabric Canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 500,
      height: 400,
      backgroundColor: '#f3f4f6'
    });
    fabricCanvasRef.current = canvas;

    // Load Image
    FabricImage.fromURL(imageSrc, { crossOrigin: 'anonymous' }).then((img) => {
      imageObjectRef.current = img;
      
      // Scale down if image is larger than canvas
      const scaleX = 400 / (img.width || 1);
      const scaleY = 300 / (img.height || 1);
      const scale = Math.min(scaleX, scaleY, 1);

      img.set({
        originX: 'center',
        originY: 'center',
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        hasBorders: true,
        hasControls: true
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      imageObjectRef.current = null;
    };
  }, [isOpen, imageSrc]);

  // Handle image rotation
  const rotateImage = () => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    const currentAngle = img.angle || 0;
    img.rotate((currentAngle + 90) % 360);
    canvas.renderAll();
  };

  // Flip Horizontal
  const flipHorizontal = () => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    img.set('flipX', !img.flipX);
    canvas.renderAll();
  };

  // Flip Vertical
  const flipVertical = () => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    img.set('flipY', !img.flipY);
    canvas.renderAll();
  };

  // Apply filters
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    img.filters = [];

    // Grayscale
    if (grayscale) {
      img.filters.push(new filters.Grayscale());
    }

    // Sepia
    if (sepia) {
      img.filters.push(new filters.Sepia());
    }

    // Brightness
    if (brightness !== 0) {
      img.filters.push(
        new filters.Brightness({
          brightness: brightness / 100
        })
      );
    }

    // Contrast
    if (contrast !== 0) {
      img.filters.push(
        new filters.Contrast({
          contrast: contrast / 100
        })
      );
    }

    // Apply filters
    img.applyFilters();
    canvas.renderAll();
  }, [brightness, contrast, grayscale, sepia]);

  // Toggle Crop Area Bounding Box
  const toggleCropMode = () => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    if (isCropMode) {
      // Execute Crop
      if (cropRectRef.current) {
        const cropRect = cropRectRef.current;
        const rectLeft = cropRect.left || 0;
        const rectTop = cropRect.top || 0;
        const rectWidth = (cropRect.width || 0) * (cropRect.scaleX || 1);
        const rectHeight = (cropRect.height || 0) * (cropRect.scaleY || 1);

        // Convert coordinates relative to image scale, orientation and position
        // For simplicity, we can clip the fabric canvas to a new canvas and generate the cropped image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = rectWidth;
        tempCanvas.height = rectHeight;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          // Hide crop box temporarily for capture
          cropRect.set('visible', false);
          canvas.renderAll();

          // Draw the canvas segment inside the crop rectangle
          const zoom = canvas.getZoom();
          ctx.drawImage(
            canvas.getElement(),
            rectLeft * zoom,
            rectTop * zoom,
            rectWidth * zoom,
            rectHeight * zoom,
            0,
            0,
            rectWidth,
            rectHeight
          );

          // Restore crop box if needed, but we're exiting crop mode
          canvas.remove(cropRect);
          cropRectRef.current = null;

          // Replace the image source on our active fabric image object
          const croppedDataUrl = tempCanvas.toDataURL('image/jpeg', 1.0);
          
          canvas.remove(img);
          FabricImage.fromURL(croppedDataUrl).then((newImg) => {
            imageObjectRef.current = newImg;
            newImg.set({
              originX: 'center',
              originY: 'center',
              left: canvas.width! / 2,
              top: canvas.height! / 2,
              selectable: true
            });
            canvas.add(newImg);
            canvas.setActiveObject(newImg);
            canvas.renderAll();
          });
        }
      }
      setIsCropMode(false);
    } else {
      // Enter Crop Mode: create a visual Crop Box overlay
      setIsCropMode(true);
      
      const cropRect = new Rect({
        left: canvas.width! / 4,
        top: canvas.height! / 4,
        width: canvas.width! / 2,
        height: canvas.height! / 2,
        fill: 'transparent',
        stroke: '#f59e0b',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#f59e0b',
        cornerSize: 8,
        transparentCorners: false,
        hasRotatingPoint: false
      });

      cropRectRef.current = cropRect;
      canvas.add(cropRect);
      canvas.setActiveObject(cropRect);
      canvas.renderAll();
    }
  };

  // Export and Save Changes
  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    const img = imageObjectRef.current;
    if (!canvas || !img) return;

    // Deselect all objects for a clean image print
    canvas.discardActiveObject();
    if (cropRectRef.current) {
      canvas.remove(cropRectRef.current);
    }
    canvas.renderAll();

    // Create temporary container representing just the image bounding area
    const tempCanvas = document.createElement('canvas');
    const bounds = img.getBoundingRect();
    
    // Set size to canvas size or bound size
    tempCanvas.width = bounds.width;
    tempCanvas.height = bounds.height;
    const ctx = tempCanvas.getContext('2d');

    if (ctx) {
      // Center and draw the cropped/edited canvas area
      ctx.drawImage(
        canvas.getElement(),
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height
      );
      
      // Export with compression settings (JPEG supports quality percentage)
      const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', compressionQuality);
      onSave(compressedDataUrl, widthPercent, alignment, caption);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex w-[900px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold">Image Studio & Compressor</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-1 p-6 gap-6">
          {/* Left Canvas Panel */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-100 p-4 dark:bg-zinc-950">
            <canvas ref={canvasRef} className="border border-zinc-300 dark:border-zinc-850 rounded-lg shadow-inner" />
            
            {/* Quick Canvas Controls */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={rotateImage}
                disabled={isCropMode}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-850"
              >
                <RotateCw className="h-3.5 w-3.5" /> Rotate 90°
              </button>
              <button
                onClick={flipHorizontal}
                disabled={isCropMode}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-850"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Flip H
              </button>
              <button
                onClick={flipVertical}
                disabled={isCropMode}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-850"
              >
                <Layers className="h-3.5 w-3.5" /> Flip V
              </button>
              <button
                onClick={toggleCropMode}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                  isCropMode
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'border border-zinc-300 hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-850'
                }`}
              >
                <Check className="h-3.5 w-3.5" /> {isCropMode ? 'Apply Crop' : 'Crop Image'}
              </button>
            </div>
          </div>

          {/* Right Adjustments Panel */}
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Settings</h3>

              {/* Resize in layout */}
              <div>
                <label className="flex justify-between text-xs font-medium mb-1">
                  <span>Display Width ({widthPercent}%)</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={widthPercent}
                  onChange={(e) => setWidthPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
                />
              </div>

              {/* Align settings */}
              <div>
                <span className="text-xs font-medium block mb-1">Text Alignment</span>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => setAlignment(align)}
                      className={`rounded-lg py-1.5 text-xs capitalize border font-medium ${
                        alignment === align
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Captions */}
              <div>
                <label className="text-xs font-medium block mb-1">Image Caption</label>
                <input
                  type="text"
                  placeholder="Enter caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                />
              </div>

              <div className="border-t border-zinc-200 my-2 dark:border-zinc-850"></div>

              {/* Sliders for brightness/contrast */}
              <div className="space-y-2">
                <span className="text-xs font-medium flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5" /> Adjust Filters
                </span>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => {
                        setGrayscale(e.target.checked);
                        if (e.target.checked) setSepia(false);
                      }}
                      className="rounded accent-indigo-500"
                    />
                    Black & White
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={sepia}
                      onChange={(e) => {
                        setSepia(e.target.checked);
                        if (e.target.checked) setGrayscale(false);
                      }}
                      className="rounded accent-indigo-500"
                    />
                    Sepia Tone
                  </label>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Brightness ({brightness > 0 ? `+${brightness}` : brightness})</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Contrast ({contrast > 0 ? `+${contrast}` : contrast})</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Auto Compression settings */}
              <div>
                <label className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1">
                    Compression Quality ({Math.round(compressionQuality * 100)}%)
                  </span>
                  <span className="text-emerald-500 text-[10px] font-bold">Auto-Optimized</span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={compressionQuality}
                  onChange={(e) => setCompressionQuality(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
              >
                Save & Embed Image
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
