'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { useTranslation } from '@/hooks/useTranslation';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (productName: string, barcode: string, imageUrl?: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScanResult }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isOpen) {
      return; // Cleanup is handled by the return function when isOpen was true
    }

    let isProcessing = false;
    let startPromise: Promise<any> | null = null;
    const localScanner = new Html5Qrcode("reader");
    scannerRef.current = localScanner;

    const onScanSuccess = async (decodedText: string) => {
      if (isProcessing || !isMounted) return;
      isProcessing = true;

      // Pause scanning while looking up the product
      try {
        if (localScanner.getState() === 2) {
          localScanner.pause(true);
        }
      } catch(e) {
        console.error("Pause error", e);
      }
      
      setLoadingProduct(true);
      setErrorMsg(null);

      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product && data.product.product_name) {
          if (isMounted) {
            const imageUrl = data.product.image_front_small_url || data.product.image_front_url || data.product.image_url;
            onScanResult(data.product.product_name, decodedText, imageUrl);
            onClose(); // Automatically close on success
          }
        } else {
          if (isMounted) setErrorMsg(t("pantry.product_not_found") || "Produit non trouvé. Veuillez l'ajouter manuellement.");
          // Resume scanning after 3 seconds
          setTimeout(() => {
            if (!isMounted) return;
            setErrorMsg(null);
            try { if (localScanner.getState() === 3 /* PAUSED */) localScanner.resume(); } catch(e){}
            isProcessing = false;
          }, 3000);
        }
      } catch (err) {
        console.error("OpenFoodFacts Error:", err);
        if (isMounted) setErrorMsg(t("pantry.network_error") || "Erreur réseau. Impossible de vérifier le produit.");
        setTimeout(() => {
          if (!isMounted) return;
          setErrorMsg(null);
          try { if (localScanner.getState() === 3 /* PAUSED */) localScanner.resume(); } catch(e){}
          isProcessing = false;
        }, 3000);
      } finally {
        if (isMounted) setLoadingProduct(false);
      }
    };

    const onScanFailure = (error: any) => {
      // Ignore routine scan failures
    };

    startPromise = localScanner.start(
      { facingMode: "environment" },
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }
      },
      onScanSuccess,
      onScanFailure
    );
    
    startPromise.catch(err => {
      if (!isMounted) return;
      console.error("Failed to start camera:", err);
      setErrorMsg(t("pantry.camera_error") || "Impossible d'accéder à la caméra. Vérifiez vos permissions.");
    });

    return () => {
      isMounted = false;
      if (startPromise) {
        startPromise.then(() => {
          // If it started successfully, we must stop it
          localScanner.stop().then(() => {
            localScanner.clear();
          }).catch(console.error);
        }).catch(() => {
          // If it failed to start, just clear
          localScanner.clear();
        });
      } else {
        localScanner.clear();
      }
      scannerRef.current = null;
    };
  }, [isOpen, onScanResult, onClose]);

  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) return;
    
    // Pause scanning
    if (scannerRef.current) scannerRef.current.pause(true);
    setLoadingProduct(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${manualBarcode.trim()}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product && data.product.product_name) {
        const imageUrl = data.product.image_front_small_url || data.product.image_front_url || data.product.image_url;
        onScanResult(data.product.product_name, manualBarcode.trim(), imageUrl);
        onClose();
      } else {
        setErrorMsg(t("pantry.product_not_found") || "Produit non trouvé. Veuillez l'ajouter manuellement.");
        setTimeout(() => {
          setErrorMsg(null);
          if (scannerRef.current) scannerRef.current.resume();
        }, 3000);
      }
    } catch (err) {
      console.error("OpenFoodFacts Error:", err);
      setErrorMsg(t("pantry.network_error") || "Erreur réseau. Impossible de vérifier le produit.");
      setTimeout(() => {
        setErrorMsg(null);
        if (scannerRef.current) scannerRef.current.resume();
      }, 3000);
    } finally {
      setLoadingProduct(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#FAF5F0] rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col p-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-heading font-black text-[22px] text-[#3d3129] leading-tight">{t("pantry.scan_barcode")}</h3>
            <p className="text-[#8c8279] mt-1 text-[15px]">{t("pantry.scan_desc")}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0 text-[#8c8279]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="mt-4 relative rounded-2xl overflow-hidden bg-black/10 aspect-[4/3] flex flex-col">
          {/* The html5-qrcode scanner needs an element with id "reader" */}
          <div id="reader" className="w-full h-full border-none [&_video]:object-cover" style={{ border: 'none' }}></div>
          
          {loadingProduct && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#3d3129] animate-spin mb-2" />
              <p className="text-sm font-medium text-[#3d3129]">{t("pantry.searching_product")}</p>
            </div>
          )}
        </div>
        
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Stop Button */}
        <button 
          onClick={onClose}
          className="mt-6 w-full py-2.5 border border-[#e8dccf] rounded-xl text-[#3d3129] font-medium flex items-center justify-center gap-2 hover:bg-[#f0e6da] transition-colors"
        >
          <X className="w-4 h-4" /> {t("pantry.close")}
        </button>

        <div className="w-full h-px bg-[#e8dccf] my-6"></div>

        {/* Manual Entry */}
        <div>
          <p className="text-[#8c8279] text-sm mb-3">{t("pantry.manual_barcode_or")}</p>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder={t("pantry.barcode_placeholder")}
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 bg-transparent border border-[#e8dccf] rounded-xl px-4 py-2.5 text-[#3d3129] placeholder:text-[#b8b0a8] focus:outline-none focus:ring-2 focus:ring-[#3d3129]/20"
            />
            <button 
              onClick={handleManualSubmit}
              disabled={loadingProduct}
              className="px-4 py-2.5 border border-[#e8dccf] rounded-xl hover:bg-[#f0e6da] transition-colors text-[#3d3129] flex items-center justify-center disabled:opacity-50"
            >
              {loadingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Small hack to hide the ugly html5-qrcode default UI elements if they pop up */}
      <style jsx global>{`
        #reader__dashboard_section_csr span { display: none !important; }
        #reader__dashboard_section_swaplink { display: none !important; }
        #reader button {
          background-color: #df6f50 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 12px !important;
          font-weight: 500 !important;
          margin-top: 10px !important;
          cursor: pointer !important;
        }
        #reader select {
          padding: 8px 12px !important;
          border-radius: 12px !important;
          border: 1px solid #e5e5e5 !important;
          margin-bottom: 10px !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
