const fs = require('fs');

const code = `"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { extractRecipeFromImages } from "@/lib/ai";
import { Button } from "@/components/ui/Button";

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
      const scale = Math.min(containerWidth / img.width, 1);
      
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
    <div ref={containerRef} className="border border-stone rounded-xl bg-white w-full flex justify-center items-center cursor-crosshair">
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

interface ImageMaskingToolProps {
  onSuccess: (data: any) => void;
}

export function ImageMaskingTool({ onSuccess }: ImageMaskingToolProps) {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [brushSize, setBrushSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const maskersRef = useRef<(SingleMaskerRef | null)[]>([]);

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
      onSuccess(extractedData);
      
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
        <div 
          className="border-2 border-dashed border-stone rounded-xl p-12 text-center hover:bg-cream transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileUpload")?.click()}
        >
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-stone" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-charcoal font-medium">Glissez-déposez vos images ici ou cliquez pour parcourir</p>
          <input id="fileUpload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-cream-dark p-4 rounded-xl border border-stone-light/30 sticky top-4 z-10 shadow-sm">
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" onClick={handleUndoAll}>Annuler</Button>
              <Button variant="secondary" size="sm" onClick={handleClearAll}>Tout effacer</Button>
            </div>
            <div className="flex items-center space-x-3 text-sm font-medium text-charcoal">
              <span>Taille du pinceau:</span>
              <input type="range" min="10" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-32 accent-terracotta" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {images.map((src, idx) => (
              <SingleMasker 
                key={idx} 
                src={src} 
                brushSize={brushSize} 
                ref={(el) => { maskersRef.current[idx] = el; }} 
              />
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-stone-light/30">
            <Button variant="ghost" onClick={() => setImages([])}>Recommencer</Button>
            <Button onClick={handleExtract} isLoading={loading}>Extraire la recette ({images.length} {images.length > 1 ? 'images' : 'image'})</Button>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/import/ImageMaskingTool.tsx', code);
