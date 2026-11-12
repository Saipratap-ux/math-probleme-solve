import React, { useState, useRef } from 'react';
import { SAMPLE_PROBLEMS } from '../data/sampleProblems';
import { SampleProblem } from '../types/tutor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeImage: (base64: string, mimeType: string) => Promise<void>;
  onAnalyzeText: (text: string) => Promise<void>;
  onSelectSample: (sample: SampleProblem) => Promise<void>;
  isAnalyzing: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeImage,
  onAnalyzeText,
  onSelectSample,
  isAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'text'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [textProblemInput, setTextProblemInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Live video stream is not supported in this frame. Please use the Device Camera button below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      // Permission denied or camera unavailable: handled gracefully without console.error
      setCameraActive(false);
      setCameraError('Camera access was not granted by your browser or environment. Please use the Device Camera button below to take a photo.');
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    setMimeType('image/jpeg');
    stopLiveCamera();
    setActiveTab('upload');
  };

  const handleAnalyze = async () => {
    if (activeTab === 'text') {
      if (!textProblemInput.trim()) return;
      await onAnalyzeText(textProblemInput.trim());
      onClose();
      return;
    }

    if (!previewUrl) return;
    await onAnalyzeImage(previewUrl, mimeType);
    onClose();
  };

  const handleSelectPreset = async (sample: SampleProblem) => {
    await onSelectSample(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-base font-semibold text-stone-900 font-display">
              Upload Math Problem Photo
            </h2>
            <p className="text-xs text-stone-500">
              Multimodal image understanding · Guided step-by-step
            </p>
          </div>
          <button
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-5 bg-white">
          <button
            onClick={() => {
              stopLiveCamera();
              setActiveTab('upload');
            }}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Upload Image
          </button>
          <button
            onClick={() => {
              stopLiveCamera();
              setActiveTab('camera');
            }}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'camera'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Camera Snapshot
          </button>
          <button
            onClick={() => {
              stopLiveCamera();
              setActiveTab('text');
            }}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Type / Paste Text
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'upload' && (
            <div>
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-900">
                  <img
                    src={previewUrl}
                    alt="Problem preview"
                    className="max-h-72 w-full object-contain mx-auto"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewUrl(null);
                      }}
                      className="px-2.5 py-1 bg-stone-900/80 hover:bg-stone-900 text-white text-xs rounded-md backdrop-blur-xs transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-stone-400 hover:bg-stone-50/50 transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-stone-800 mb-1">
                    Click to browse or drag and drop photo
                  </p>
                  <p className="text-xs text-stone-500 mb-3">
                    Photo of handwritten notes, textbook, or problem worksheet
                  </p>
                  <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded text-[11px] font-mono">
                    PNG, JPG, WebP
                  </span>
                </div>
              )}

              {/* Realistic Sample Presets for Fast Testing */}
              <div className="mt-6 pt-5 border-t border-stone-200">
                <span className="text-xs font-semibold text-stone-700 block mb-2">
                  Or test immediately with a curated problem:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_PROBLEMS.slice(0, 4).map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectPreset(sample)}
                      className="p-2.5 text-left bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors flex items-center justify-between group"
                    >
                      <div className="truncate mr-2">
                        <div className="text-xs font-medium text-stone-900 truncate">
                          {sample.title}
                        </div>
                        <div className="text-[11px] font-mono text-amber-800 truncate">
                          {sample.latex}
                        </div>
                      </div>
                      <span className="text-xs text-stone-400 group-hover:text-stone-700 shrink-0">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="text-center space-y-4">
              {/* Native Device Camera input (works reliably without getUserMedia permission issues) */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-900">
                  <img
                    src={previewUrl}
                    alt="Captured preview"
                    className="max-h-72 w-full object-contain mx-auto"
                  />
                  <div className="p-3 bg-stone-800 flex justify-center gap-3">
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded text-xs"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-stone-900 max-h-72">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-64 object-cover mx-auto"
                  />
                  <div className="p-3 bg-stone-950 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={captureLivePhoto}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-xs"
                    >
                      Cancel Video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-stone-200 rounded-xl bg-stone-50 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 mx-auto">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 mb-1">
                      Take a Photo of Your Math Problem
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use your device's camera to capture a clear picture of the problem or worksheet.
                    </p>
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs max-w-md mx-auto">
                      {cameraError}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      Snap with Device Camera
                    </button>
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="px-4 py-2.5 bg-white text-stone-700 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-100 transition-colors shadow-2xs"
                    >
                      Start Live Camera Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-stone-700 block">
                Type or paste the problem description / formula:
              </label>
              <textarea
                value={textProblemInput}
                onChange={(e) => setTextProblemInput(e.target.value)}
                placeholder="e.g. Evaluate the integral of x^2 * e^(3x) dx using integration by parts, or solve log2(x) + log2(x-3) = 2"
                rows={4}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white"
              />
              <p className="text-[11px] text-stone-500">
                You can write in plain English or LaTeX notation.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {previewUrl ? 'Photo ready for Socratic analysis' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                stopLiveCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing ||
                (activeTab === 'upload' && !previewUrl) ||
                (activeTab === 'camera' && !previewUrl) ||
                (activeTab === 'text' && !textProblemInput.trim())
              }
              className="px-5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Math Problem...
                </>
              ) : (
                'Begin Socratic Walkthrough'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
