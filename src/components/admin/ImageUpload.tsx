"use client";

import { useState, useRef, useCallback } from "react";
import { uploadBytes, ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Camera,
  Globe,
  X,
  Loader2,
  Check,
  RotateCcw,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

  const [isMirrored, setIsMirrored] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 }, // Optimization: Request ideal resolution
          height: { ideal: 720 }
        },
      });
      setCamStream(stream);
      setIsMirrored(false); // Default to normal for back camera
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao acessar câmera. Verifique as permissões.");
    }
  };

  const toggleMirror = () => setIsMirrored(prev => !prev);

  // ... (keep stopCamera and capturePhoto as is, but logic relies on new state)

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ... previous content ... */}
      
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          if (val === "camera") {
             startCamera();
          } else {
             stopCamera();
          }
        }}
        className="w-full"
      >
        {/* ... TabsList ... */}

        {/* ... Tab content for 'upload' and 'url' ... */}

        <TabsContent value="camera" className="mt-4 focus-visible:outline-none">
          <div className="relative rounded-2xl bg-slate-900 overflow-hidden w-full aspect-[3/4] sm:aspect-video sm:h-80 shadow-2xl flex items-center justify-center group">
            {camStream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg border border-red-500 animate-pulse z-10">
                  <div className="w-2 h-2 rounded-full bg-white shadow-inner" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    REC
                  </span>
                </div>
                
                {/* Controls Overlay */}
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-6 px-4 z-20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                       stopCamera();
                       setActiveTab('upload');
                    }}
                    className="h-12 w-12 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-md shadow-lg"
                    title="Cancelar"
                  >
                    <X size={20} />
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="h-16 w-16 rounded-full bg-white shadow-2xl transition-all active:scale-95 flex items-center justify-center relative"
                  >
                    <div className="h-14 w-14 rounded-full border-[2px] border-slate-900 flex items-center justify-center">
                       <div className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleMirror}
                    className="h-12 w-12 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-md shadow-lg"
                    title="Inverter/Espelhar"
                  >
                    <div className="flex flex-col items-center">
                      <RotateCcw size={16} className={cn("transition-transform", isMirrored ? "scale-x-[-1]" : "")} />
                      <span className="text-[8px] mt-0.5 font-bold opacity-70">FLIP</span>
                    </div>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-4 max-w-xs flex flex-col items-center animate-in zoom-in-95">
                 <Loader2 className="animate-spin text-purple-500" size={32} />
                 <p className="text-white font-bold text-sm">Iniciando câmera...</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
