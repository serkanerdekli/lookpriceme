import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { motion } from "motion/react";
import { AlertCircle, Zap, ZapOff } from "lucide-react";

interface ScannerProps {
  onResult: (decodedText: string) => void;
}

const Scanner = ({ onResult }: ScannerProps) => {
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const startScanner = async () => {
    if (!videoRef.current) return;
    setIsStarting(true);
    setError(null);

    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // Get all video input devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error("Kamera bulunamadı.");
      }

      // Automatically pick the back camera
      let selectedDeviceId = videoInputDevices[0].deviceId;
      for (const device of videoInputDevices) {
        if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('arka')) {
          selectedDeviceId = device.deviceId;
          break;
        }
      }

      // Start decoding
      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId, 
        videoRef.current, 
        (result, error, controls) => {
          if (result) {
            // Once a barcode is found, vibrate if possible and return result
            if (navigator.vibrate) navigator.vibrate(100);
            controls.stop();
            onResult(result.getText());
          }
        }
      );

      controlsRef.current = controls;

      // Check if Torch is supported on the active track
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
            
            // Apply continuous focus if available for better barcode scanning
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
              await track.applyConstraints({
                advanced: [{ focusMode: "continuous" } as any]
              });
            }
          }
        }
      } catch (e) {
        console.warn("Kamera gelişmiş özellikleri alınamadı:", e);
      }

    } catch (err: any) {
      console.error("Scanner failed to start:", err);
      setError(`Kamera başlatılamadı: ${err.message || 'Lütfen kamera izinlerini kontrol edin.'}`);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    // Start scanner with slight delay to ensure DOM is ready and animations finish
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  const toggleTorch = async () => {
    if (!videoRef.current || !hasTorch) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        const newState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: newState } as any]
        });
        setIsTorchOn(newState);
      }
    } catch (err) {
      console.error("Torch toggle error:", err);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl bg-black isolation-isolate">
      <video 
        ref={videoRef} 
        id="video" 
        className="w-full h-full object-cover" 
        muted 
        playsInline 
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center z-20">
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-white">{error}</p>
            <button 
              onClick={startScanner}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-bold text-xs"
              disabled={isStarting}
            >
              {isStarting ? "Başlatılıyor..." : "Yeniden Dene"}
            </button>
          </div>
        </div>
      )}

      {isStarting && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Crosshair Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
        <div className="w-[85%] h-[40%] border-2 border-white/20 rounded-2xl relative overflow-hidden">
          {/* Corners */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl" />
          
          {/* Laser Scan Animation */}
          <motion.div 
            animate={{ top: ["2%", "98%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] z-10"
          />

          <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px]" />
        </div>
        
        <div className="mt-8 flex flex-col items-center space-y-3">
          <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/20 shadow-xl">
            <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              Barkod Hizalayın
            </p>
          </div>
          <p className="text-white/60 text-[10px] font-medium text-center max-w-[200px]">
             Daha hızlı okuma için (KASASIZ SATIŞ OTOMASYONU)
          </p>
        </div>
      </div>

      {hasTorch && (
        <button 
          onClick={toggleTorch}
          className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90 z-30"
        >
          {isTorchOn ? <ZapOff className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
        </button>
      )}
    </div>
  );
};

export default Scanner;
