"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { extractRecipeFromImages } from "@/lib/ai";
import { Button } from "@/components/ui/Button";
import { FreeImageCropperModal } from "@/components/ui/FreeImageCropperModal";
import { ImagePlus, Plus, Undo2 } from "lucide-react";

interface SingleMaskerProps {
  src: string;
  brushSize: number;
}

export interface SingleMaskerRef {
  getMaskedBase64: () => string | null;
  undo: () => void;
  clear: () => void;
  canUndo: boolean;
}

const SingleMasker = forwardRef<SingleMaskerRef, SingleMaskerProps>(({ src, brushSize }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      // Scale canvas to fit container while maintaining aspect ratio
      // No height restriction so it doesn't crop tall images
      const containerWidth = containerRef.current?.clientWidth || 800;
      // We want the image to fit on the screen without scrolling. 
      // Assuming a max height of about 65vh (approx 600px).
      const maxHeight = window.innerHeight * 0.65;
      const scaleX = containerWidth / img.width;
      const scaleY = maxHeight / img.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);
    };
    img.src = src;
  }, [src]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, newState]);
      }
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (history.length > 1) {
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
        }
      }
    },
    clear: () => {
      if (history.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          ctx.putImageData(history[0], 0, 0);
          setHistory([history[0]]);
        }
      }
    },
    canUndo: history.length > 1,
    getMaskedBase64: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || history.length === 0) return null;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return null;

      const originalImageData = history[0];
      tempCtx.putImageData(originalImageData, 0, 0);
      
      const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      for (let i = 0; i < currentData.data.length; i += 4) {
        if (currentData.data[i] > 200 && currentData.data[i+1] < 100 && currentData.data[i+2] < 100) {
           maskData.data[i] = 255;   
           maskData.data[i+1] = 255; 
           maskData.data[i+2] = 255; 
           maskData.data[i+3] = 255; 
        }
      }
      
      tempCtx.putImageData(maskData, 0, 0);
      const dataUrl = tempCanvas.toDataURL("image/jpeg");
      return dataUrl.split(",")[1];
    }
  }));

  return (
    <div ref={containerRef} className="border border-stone-light rounded-xl bg-white w-full flex justify-center items-center cursor-crosshair overflow-hidden shadow-sm">
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerOut={stopDrawing}
        style={{ touchAction: "none", maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
});

SingleMasker.displayName = "SingleMasker";

interface ImageMaskingToolProps {
  onSuccess: (data: any) => void;
}

export function ImageMaskingTool({ onSuccess }: ImageMaskingToolProps) {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [brushSize, setBrushSize] = useState(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  
  const maskersRef = useRef<(SingleMaskerRef | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newImages = Array.from(e.dataTransfer.files)
        .filter(file => file.type.startsWith("image/"))
        .map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleUndoAll = () => {
    maskersRef.current.forEach(m => m?.undo());
  };

  const handleClearAll = () => {
    maskersRef.current.forEach(m => m?.clear());
  };

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const base64Images: {base64: string, mimeType: string}[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const masker = maskersRef.current[i];
        if (masker) {
          const b64 = masker.getMaskedBase64();
          if (b64) {
             base64Images.push({ base64: b64, mimeType: "image/jpeg" });
          }
        }
      }
      
      if (base64Images.length === 0) {
        throw new Error("No images to extract");
      }
      
      const extractedData = await extractRecipeFromImages(base64Images);
      onSuccess({...extractedData, sourceType: "scan"});
      
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {images.length === 0 ? (
        <div className="flex flex-col gap-4 max-w-xl mx-auto">
          <div 
            className="border-[3px] border-dashed border-stone-light/40 bg-stone/5 rounded-[24px] p-12 text-center hover:bg-stone/10 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-4 flex justify-center">
              <ImagePlus className="w-12 h-12 text-[#8B7E70]" strokeWidth={1.5} />
            </div>
            <p className="text-[22px] text-charcoal mb-2 font-medium tracking-tight">Cliquez pour importer des photos</p>
            <p className="text-base text-[#8B7E70]">PNG, JPG — vous pouvez sélectionner plusieurs images</p>
          </div>
          
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-cream-dark p-4 rounded-xl border border-stone-light/30 sticky top-4 z-10 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" />
                Ajouter des images
              </Button>
              <div className="w-px h-8 bg-stone-light/50 mx-2 hidden sm:block"></div>
              <Button variant="ghost" size="sm" onClick={handleUndoAll} title="Annuler le dernier tracé">
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>Effacer tracé</Button>
            </div>
            <div className="flex items-center space-x-3 text-sm font-medium text-charcoal">
              <span>Taille du pinceau:</span>
              <input type="range" min="10" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 sm:w-32 accent-terracotta" />
            </div>
          </div>
          
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex flex-col gap-6">
            {images.map((src, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute top-4 right-4 z-20">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setCropImageIndex(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow-sm text-xs py-1.5 px-3 h-auto"
                  >
                    Recadrer l'image
                  </Button>
                </div>
                <SingleMasker 
                  src={src} 
                  brushSize={brushSize} 
                  ref={(el) => { maskersRef.current[idx] = el; }} 
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-stone-light/30">
            <Button variant="ghost" onClick={() => setImages([])}>Recommencer</Button>
            <Button onClick={handleExtract} isLoading={loading}>Extraire la recette ({images.length} {images.length > 1 ? 'images' : 'image'})</Button>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </div>
      )}
      
      {cropImageIndex !== null && (
        <FreeImageCropperModal
          isOpen={cropImageIndex !== null}
          onClose={() => setCropImageIndex(null)}
          imageSrc={images[cropImageIndex]}
          onCropComplete={(croppedBase64) => {
            setImages(prev => {
              const newImages = [...prev];
              newImages[cropImageIndex] = croppedBase64;
              return newImages;
            });
          }}
        />
      )}
    </div>
  );
}
