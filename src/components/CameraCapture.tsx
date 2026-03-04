'use client';

import { useState, useRef } from 'react';

type CameraCaptureProps = {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
};

/**
 * Mobile-optimized camera capture component
 * Uses device camera for photo documentation
 */
export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setUseCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setUseCamera(false);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (useCamera && videoRef.current) {
      startCamera();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <button
          onClick={handleClose}
          className="text-white text-lg p-2"
        >
          ✕
        </button>
        <h2 className="text-white font-semibold">Take Photo</h2>
        <div className="w-10" />
      </div>

      {/* Camera/Image View */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {!useCamera && !capturedImage && (
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl mb-4">📷</div>
            <button
              onClick={startCamera}
              className="block w-full rounded-xl bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-white mb-3"
            >
              Open Camera
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="block w-full rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white"
            >
              Choose from Gallery
            </button>
          </div>
        )}

        {useCamera && !capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full"
          />
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80">
        {useCamera && !capturedImage && (
          <button
            onClick={capturePhoto}
            className="w-20 h-20 mx-auto block rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform"
          />
        )}

        {capturedImage && (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-lg font-semibold text-white"
            >
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-white"
            >
              Use Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
