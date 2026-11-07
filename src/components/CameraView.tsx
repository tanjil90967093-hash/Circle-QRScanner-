/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Zap,
  ZapOff,
  SwitchCamera,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  FileQuestion,
  Camera,
  AlertCircle
} from 'lucide-react';
import { playShutterSound } from '../utils/imageProcessing';
import { generateSampleDocument } from '../utils/sampleDocuments';

interface CameraViewProps {
  capturedImages: string[];
  onCapture: (imageDataUrl: string) => void;
  onOpenGallery: (files: FileList) => void;
  onOpenStack: () => void;
  onNext: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  capturedImages,
  onCapture,
  onOpenGallery,
  onOpenStack,
  onNext,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      // Stop existing tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorchSupport(Boolean(capabilities?.torch));
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে পারমিশন দিন বা গ্যালারি থেকে ছবি সিলেক্ট করুন।'
          : 'ক্যামেরা চালু করা যায়নি। আপনি গ্যালারি থেকে ছবি আপলোড করতে পারেন বা টেস্ট ডকুমেন্ট ব্যবহার করতে পারেন।'
      );
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flash / Torch toggle
  const toggleFlash = async () => {
    if (!stream) {
      setIsFlashOn(!isFlashOn);
      return;
    }

    try {
      const track = stream.getVideoTracks()[0];
      if (track && hasTorchSupport) {
        await (track as any).applyConstraints({
          advanced: [{ torch: !isFlashOn }],
        });
        setIsFlashOn(!isFlashOn);
      } else {
        // Fallback visual screen flash
        setIsFlashOn(!isFlashOn);
      }
    } catch (e) {
      setIsFlashOn(!isFlashOn);
    }
  };

  // Flip camera between environment (back) and user (front)
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from video stream
  const captureSnapshot = () => {
    if (soundEnabled) {
      playShutterSound();
    }
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    // Trigger visual shutter flash animation
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    if (videoRef.current && stream) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, un-mirror horizontally
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(dataUrl);
      }
    } else {
      // If camera is disabled or in sandbox without webcam, load a sample notebook on table!
      const sampleUrl = generateSampleDocument('table-notebook');
      onCapture(sampleUrl);
    }
  };

  // Load a realistic sample test image
  const handleLoadSample = (type: 'table-notebook' | 'bed-notebook' | 'desk-receipt') => {
    const dataUrl = generateSampleDocument(type);
    onCapture(dataUrl);
    setSampleMenuOpen(false);
    if (soundEnabled) playShutterSound();
  };

  const capturedCount = capturedImages.length;
  const latestThumb = capturedCount > 0 ? capturedImages[capturedCount - 1] : null;

  return (
    <div className="relative w-full h-full min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Visual Flash effect overlay on capture */}
      <div
        className={`pointer-events-none absolute inset-0 z-40 bg-white transition-opacity duration-150 ${
          isShutterActive ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Screen Torch Simulation Overlay (when user turns on flash without hardware torch) */}
      {isFlashOn && !hasTorchSupport && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-amber-50/25 backdrop-brightness-125" />
      )}

      {/* TOP CONTROLS BAR */}
      <header className="relative z-30 flex items-center justify-between px-4 pt-3 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Flash Toggle */}
        <button
          onClick={toggleFlash}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${
            isFlashOn
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
              : 'bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800'
          }`}
          title={isFlashOn ? 'ফ্ল্যাশ বন্ধ করুন' : 'ফ্ল্যাশ চালু করুন'}
        >
          {isFlashOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
        </button>

        {/* Center Title / Mode Kicker */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/50 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              ডকুমেন্ট স্ক্যানার
            </span>
          </div>
        </div>

        {/* Right Top Actions: Flip Camera, Sound & Gallery */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'সাউন্ড অফ' : 'সাউন্ড অন'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-200" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Camera Flip */}
          <button
            onClick={switchCamera}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800 active:rotate-180 transition-all duration-300"
            title="ক্যামেরা পরিবর্তন (ফ্রন্ট/ব্যাক)"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          {/* Gallery Picker */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800 transition-colors"
            title="গ্যালারি থেকে ছবি আনুন"
          >
            <ImageIcon className="w-5 h-5 text-emerald-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onOpenGallery(e.target.files);
              }
            }}
          />
        </div>
      </header>

      {/* CENTER CAMERA VIEWPORT */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Live Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Viewfinder Reticle / Document Frame Guidance Overlay */}
        <div className="relative pointer-events-none z-20 w-[82vw] max-w-sm h-[58vh] max-h-[520px] rounded-2xl border-2 border-dashed border-emerald-400/50 flex flex-col justify-between p-4 shadow-2xl">
          {/* 4 Corner Brackets */}
          <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

          {/* Top Frame Guidance Note */}
          <div className="self-center px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-center">
            <span className="text-[11px] font-medium text-emerald-300">
              কাগজ বা খাতা ফ্রেমের মধ্যে সোজা রাখুন
            </span>
          </div>

          {/* Bottom Frame Info */}
          <div className="self-center px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-center">
            <span className="text-[10px] text-slate-300">
              টেবিল বা বিছানা অটোমেটিক ক্রপ হয়ে বাদ যাবে
            </span>
          </div>
        </div>

        {/* If Camera is Denied or Unavailable on desktop: Prompt with Quick Sample loader */}
        {cameraError && (
          <div className="absolute z-25 max-w-sm mx-4 p-5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">ক্যামেরা অনুমোদন প্রয়োজন</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">{cameraError}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleLoadSample('table-notebook')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>টেবিলে রাখা খাতার টেস্ট ছবি দিয়ে ট্রাই করুন</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-xs text-slate-200 border border-slate-700 active:scale-98 transition-all"
              >
                গ্যালারি থেকে ছবি সিলেক্ট করুন
              </button>
            </div>
          </div>
        )}

        {/* Floating Quick Sample Test Pill Button */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-25">
          <div className="relative">
            <button
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 rounded-full text-xs font-medium text-emerald-400 shadow-lg active:scale-95 transition-all"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>টেস্ট স্যাম্পল ছবি ({sampleMenuOpen ? 'বন্ধ' : 'দেখুন'})</span>
            </button>

            {/* Dropdown for Sample Images */}
            {sampleMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-30 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  অটো-ক্রপ টেস্ট করার জন্য ডেমো ছবি:
                </span>
                <button
                  onClick={() => handleLoadSample('table-notebook')}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-amber-900/60 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                    🪵
                  </span>
                  <div>
                    <div className="font-semibold text-white">টেবিলের উপর খাতা</div>
                    <div className="text-[10px] text-slate-400">অটো-ক্রপে কাঠের টেবিল বাদ পড়বে</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLoadSample('bed-notebook')}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                    🛏️
                  </span>
                  <div>
                    <div className="font-semibold text-white">বিছানার চাদরে খাতা</div>
                    <div className="text-[10px] text-slate-400">বিছানা বাদ হয়ে শুধু খাতা থাকবে</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLoadSample('desk-receipt')}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    🧾
                  </span>
                  <div>
                    <div className="font-semibold text-white">দোকানের রসিদ / মেমো</div>
                    <div className="text-[10px] text-slate-400">ক্যাশ কাউন্টার বাদ পড়বে</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* BOTTOM CONTROLS BAR: Left (Thumb Stack) | Center (Shutter) | Right (Next Button) */}
      <footer className="relative z-30 px-6 pt-3 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
        {/* LEFT: Captured Stack Thumbnail & Counter */}
        <div className="w-20 flex justify-start">
          {capturedCount > 0 ? (
            <button
              onClick={onOpenStack}
              className="relative group min-h-[52px] min-w-[52px] rounded-xl overflow-hidden border-2 border-emerald-400/80 shadow-lg active:scale-95 transition-all"
              title="তোলা ছবিগুলো দেখুন ও এডিট করুন"
            >
              {latestThumb && (
                <img
                  src={latestThumb}
                  alt="Last captured thumbnail"
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 object-cover"
                />
              )}
              {/* Badge counter */}
              <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-md border border-black">
                {capturedCount}
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <Layers className="w-4 h-4 text-white drop-shadow" />
              </div>
            </button>
          ) : (
            <div className="w-13 h-13 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-600">
              <Layers className="w-4 h-4" />
              <span className="text-[8px] mt-0.5">০ ছবি</span>
            </div>
          )}
        </div>

        {/* CENTER: Main Shutter Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={captureSnapshot}
            className="group relative min-h-[76px] min-w-[76px] flex items-center justify-center rounded-full active:scale-92 transition-transform duration-100"
            title="ছবি তুলুন (ক্যামেরা শাটার)"
          >
            {/* Outer ring */}
            <div className="w-19 h-19 rounded-full border-4 border-white/90 flex items-center justify-center p-1 group-active:border-emerald-400 transition-colors shadow-2xl">
              {/* Inner capture core */}
              <div className="w-full h-full rounded-full bg-white group-active:bg-emerald-400 group-hover:scale-95 transition-all duration-150 shadow-inner" />
            </div>
          </button>
        </div>

        {/* RIGHT: Next Button with dynamic badge count */}
        <div className="w-20 flex justify-end">
          {capturedCount > 0 ? (
            <button
              onClick={onNext}
              className="relative min-h-[52px] px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
              title="পরবর্তী ধাপ: অটোমেটিক ক্রপ ও রিভিউ"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[11px] font-bold">নেক্সট</span>
                <span className="text-[10px] font-semibold text-emerald-950/80">
                  ({capturedCount})
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-16 h-12 flex items-center justify-center text-[10px] text-slate-600 text-right">
              ছবি তুলুন
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
