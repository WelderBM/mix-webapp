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

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onUpload = async (file: File) => {
    try {
      setUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      onChange(url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  const stopCamera = useCallback(() => {
    if (camStream) {
      camStream.getTracks().forEach((track) => track.stop());
      setCamStream(null);
    }
  }, [camStream]);

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      // Mirror if it's front camera (simplified check)
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          await onUpload(file);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      toast.success("Link da imagem aplicado!");
    }
  };

  const removeImage = () => {
    if (confirm("Remover esta imagem?")) {
      onChange("");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-100/50">
        {/* Preview Principal */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden shrink-0 group bg-white">
          {value ? (
            <>
              <SafeImage
                src={value}
                alt="Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Trash2 size={24} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <ImageIcon size={32} />
              <span className="text-[10px] mt-1 font-black uppercase tracking-widest text-slate-400">
                Vazio
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
              <Loader2
                className="animate-spin text-purple-600 mb-1"
                size={24}
              />
              <span className="text-[8px] font-bold text-purple-600 uppercase">
                Enviando...
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
            Capa do Produto
          </h4>
          <p className="text-[11px] text-slate-500 leading-tight mt-1">
            Recomendado: 1:1 (Quadrado) <br />
            Envie arquivos, capture fotos ou use links externos.
          </p>
          {value && (
            <div className="mt-2 flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-100">
              <Check size={12} />
              <span className="text-[10px] font-bold uppercase">Definida</span>
            </div>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          if (val !== "camera") stopCamera();
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-slate-200/50 p-1 h-11 rounded-xl">
          <TabsTrigger
            value="upload"
            className="gap-2 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Upload size={14} /> Arquivo
          </TabsTrigger>
          <TabsTrigger
            value="url"
            className="gap-2 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Globe size={14} /> Link
          </TabsTrigger>
          <TabsTrigger
            value="camera"
            className="gap-2 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Camera size={14} /> Câmera
          </TabsTrigger>
        </TabsList>

        {/* Tab: Upload / Drag & Drop */}
        <TabsContent value="upload" className="mt-4 focus-visible:outline-none">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add(
                "border-purple-500",
                "bg-purple-50"
              );
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove(
                "border-purple-500",
                "bg-purple-50"
              );
            }}
            onDrop={(e) => {
              e.currentTarget.classList.remove(
                "border-purple-500",
                "bg-purple-50"
              );
              handleDrop(e);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group shadow-sm",
              "border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-purple-300 hover:shadow-inner",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="p-4 rounded-2xl bg-white shadow-md text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">
                Escolher arquivo
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                JPEG, PNG OU WEBP ATÉ 5MB
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab: URL */}
        <TabsContent
          value="url"
          className="mt-4 space-y-3 focus-visible:outline-none"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                className="pl-9 h-12 bg-white border-slate-200 font-medium rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput || disabled}
              className="h-12 px-6 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Aplicar
            </Button>
          </div>
          <div className="flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <Globe className="text-blue-500 mt-0.5 shrink-0" size={14} />
            <p className="text-[11px] text-blue-700 font-medium leading-normal">
              Cole o endereço direto da imagem. <br />
              <span className="opacity-60 italic text-[10px]">
                Dica: clique com o botão direito na imagem original e selecione
                "Copiar endereço da imagem".
              </span>
            </p>
          </div>
        </TabsContent>

        {/* Tab: Camera */}
        <TabsContent value="camera" className="mt-4 focus-visible:outline-none">
          <div className="relative rounded-2xl bg-slate-900 overflow-hidden h-64 sm:h-80 shadow-2xl flex items-center justify-center">
            {camStream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg border border-red-500 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white shadow-inner" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 px-4 overflow-hidden">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="h-14 w-14 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-md shadow-xl active:scale-90 transition-all"
                  >
                    <X size={24} />
                  </Button>
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="h-16 w-16 rounded-full bg-white shadow-2xl transition-all active:scale-95 flex items-center justify-center group"
                  >
                    <div className="h-12 w-12 rounded-full border-[6px] border-slate-900/10 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-slate-900 group-hover:scale-90 transition-transform" />
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      stopCamera();
                      startCamera();
                    }}
                    className="h-14 w-14 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-md shadow-xl active:scale-90 transition-all"
                  >
                    <RotateCcw size={24} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-6 max-w-xs transition-all animate-in zoom-in-95">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                  <Camera size={40} className="text-white/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-lg font-black uppercase tracking-tight">
                    Câmera em Tempo Real
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Capture fotos de alta qualidade diretamente do seu
                    dispositivo para a vitrine.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={startCamera}
                  className="bg-white text-black hover:bg-slate-200 font-black h-12 px-8 rounded-full shadow-xl hover:shadow-white/10 active:scale-95 transition-all"
                >
                  Ativar Câmera
                </Button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
