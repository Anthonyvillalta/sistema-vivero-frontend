import React, { useEffect, useRef, useState } from 'react';
import { aiApi, ProductAnalysis } from '../services/api';
import {
  X,
  Camera,
  Sparkles,
  Loader2,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';

interface ProductScannerModalProps {
  open: boolean;
  onClose: () => void;
  onUseResult: (photoDataUrl: string | null, analysis: ProductAnalysis) => void;
}

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({ open, onClose, onUseResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [useAiImage, setUseAiImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch (err: any) {
      setCameraError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permiso de cámara denegado. Activa la cámara en el navegador o usa "Subir foto" como alternativa.'
          : 'No se pudo iniciar la cámara. Usa "Subir foto" como alternativa.'
      );
    }
  };

  useEffect(() => {
    if (open) {
      setPhoto(null);
      setAnalysis(null);
      setError(null);
      setUseAiImage(false);
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const compressToJpeg = (source: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1280;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = source;
    });

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const maxW = 1280;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          const compressed = await compressToJpeg(reader.result);
          setPhoto(compressed);
        } catch {
          setPhoto(reader.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await aiApi.analyzeProductImage({ image: photo, mimeType: 'image/jpeg' });
      if (res.data?.message) {
        setError(res.data.message);
        return;
      }
      setAnalysis(res.data);
      setUseAiImage(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'No se pudo analizar la imagen con IA. Verifica que la clave API de Gemini esté configurada en Configuración.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseResult = () => {
    if (!analysis) return;
    const usePhoto = !useAiImage || !analysis.imageUrl?.startsWith('http');
    onUseResult(usePhoto ? photo : null, analysis);
    onClose();
  };

  const resetForNewScan = () => {
    setPhoto(null);
    setAnalysis(null);
    setError(null);
    startCamera();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600 to-[#1b4332] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/15">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm">Escáner Inteligente de Productos</h3>
              <p className="text-[10px] text-white/70 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Google Gemini identifica el producto automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-3.5">
          {/* Stage 1: Camera / Photo */}
          {!photo && !analyzing && !analysis && (
            <>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                {!cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Scan frame overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-300/70 rounded-2xl animate-pulse" />
                    </div>
                    <div className="absolute bottom-2.5 left-0 right-0 text-center">
                      <span className="text-[10px] font-black text-white/80 bg-black/40 px-2.5 py-1 rounded-full">
                        🎯 Enfoca el producto y captura la foto
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-white text-xs font-bold">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-[10px] font-extrabold rounded-xl flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reintentar cámara
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady || !!cameraError}
                  className="py-3 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  Capturar Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Subir Foto
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}

          {/* Stage 2: Analyzing */}
          {analyzing && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-violet-600 animate-pulse" />
                </div>
                <Loader2 className="w-5 h-5 text-violet-500 absolute -bottom-2 -right-2 animate-spin bg-white rounded-full p-0.5 shadow" />
              </div>
              <p className="mt-4 text-sm font-black text-slate-800">Analizando con Inteligencia Artificial...</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-1 max-w-xs">
                Gemini está identificando si es grass natural, planta ornamental, árbol, palmera o accesorio/insumo.
              </p>
            </div>
          )}

          {/* Stage 3: Result */}
          {analysis && !analyzing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-violet-100 text-violet-800 text-[10px] font-black rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  IA identificó el producto
                </span>
                <button
                  onClick={resetForNewScan}
                  className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Nuevo escaneo
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 space-y-2">
                <p className="text-xs text-slate-500 font-bold">
                  Nombre sugerido: <span className="text-slate-900 font-black text-sm block mt-0.5">{analysis.name || '—'}</span>
                </p>
                <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  Categoría:
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    analysis.categoryName === 'Grass Natural'
                      ? 'bg-emerald-100 text-emerald-800'
                      : analysis.categoryName === 'Árboles y Palmeras'
                      ? 'bg-amber-100 text-amber-800'
                      : analysis.categoryName === 'Accesorios e Insumos'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-pink-100 text-pink-800'
                  }`}>
                    {analysis.categoryName}
                  </span>
                </p>
                {analysis.description && (
                  <p className="text-[11px] text-slate-500 font-semibold leading-snug">
                    {analysis.description}
                  </p>
                )}
              </div>

              {/* Image choice */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Imagen del producto
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUseAiImage(false)}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all ${
                      !useAiImage ? 'border-vivero-primary bg-vivero-soft/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {!useAiImage && <CheckCircle2 className="w-3.5 h-3.5 text-vivero-primary" />}
                      <span className="text-[10px] font-black text-slate-700">Foto capturada</span>
                    </div>
                    {photo && <img src={photo} alt="Captura" className="w-full h-20 object-cover rounded-xl" />}
                  </button>

                  {analysis.imageUrl?.startsWith('http') ? (
                    <button
                      onClick={() => setUseAiImage(true)}
                      className={`p-2.5 rounded-2xl border-2 text-left transition-all ${
                        useAiImage ? 'border-vivero-primary bg-vivero-soft/50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {useAiImage && <CheckCircle2 className="w-3.5 h-3.5 text-vivero-primary" />}
                        <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-slate-400" />
                          Imagen sugerida por IA
                        </span>
                      </div>
                      <img
                        src={analysis.imageUrl}
                        alt="Sugerida por IA"
                        className="w-full h-20 object-cover rounded-xl"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <ImageIcon className="w-5 h-5 text-slate-300 mb-1" />
                      <p className="text-[9px] font-bold text-slate-400">
                        La IA no encontró imagen pública; se usará tu foto.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUseResult}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                Usar estos datos y llenar el formulario
              </button>
            </div>
          )}

          {error && !analyzing && !analysis && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {photo && !analyzing && !analysis && (
            <div className="space-y-3">
              <img src={photo} alt="Captura" className="w-full aspect-video object-cover rounded-2xl shadow-inner" />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAnalyze}
                  className="py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.97]"
                >
                  <Sparkles className="w-4 h-4" />
                  Analizar con IA
                </button>
                <button
                  onClick={resetForNewScan}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Volver a capturar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">
            Después del análisis solo tendrás que ingresar el <strong>precio</strong> y el <strong>stock</strong> del producto.
          </p>
        </div>
      </div>
    </div>
  );
};
