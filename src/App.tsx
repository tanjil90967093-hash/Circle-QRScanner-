/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { ReviewScreen } from './components/ReviewScreen';
import { CapturedPagesDrawer } from './components/CapturedPagesDrawer';
import {
  ScannedPage,
  detectDocumentCorners,
  getDefaultQuad,
} from './utils/imageProcessing';

export default function App() {
  // App view: 'camera' | 'review' (Defaults to camera page upon entrance)
  const [view, setView] = useState<'camera' | 'review'>('camera');

  // List of raw captured images in current session
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  // Processed multi-page documents
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);

  // Drawer to inspect raw snapshots in camera mode
  const [isStackDrawerOpen, setIsStackDrawerOpen] = useState(false);

  // Loading state during auto-crop batch processing
  const [isAutoCropping, setIsAutoCropping] = useState(false);

  // Handle capturing photo from camera or sample
  const handleCapture = (imageDataUrl: string) => {
    setCapturedImages((prev) => [...prev, imageDataUrl]);
  };

  // Handle files selected from phone / device gallery
  const handleOpenGallery = (files: FileList) => {
    const fileArray = Array.from(files);
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Delete captured photo from drawer
  const handleDeleteCapturedIndex = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // NEXT Button Pressed: Run Automatic Document Edge Detection & Perspective Auto-Crop!
  const handleProceedToReview = async () => {
    if (capturedImages.length === 0) return;

    setIsAutoCropping(true);
    setIsStackDrawerOpen(false);

    try {
      const newPages: ScannedPage[] = [];

      for (let i = 0; i < capturedImages.length; i++) {
        const dataUrl = capturedImages[i];

        // Check if page already exists
        const existing = scannedPages.find((p) => p.originalDataUrl === dataUrl);
        if (existing) {
          newPages.push(existing);
          continue;
        }

        // Load image to run automatic corner edge detection
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = dataUrl;
        });

        // Run smart computer vision boundary detection
        let quad = getDefaultQuad();
        try {
          quad = await detectDocumentCorners(img);
        } catch (err) {
          console.warn('Corner detection fallback:', err);
        }

        newPages.push({
          id: 'page_' + Date.now() + '_' + i,
          originalDataUrl: dataUrl,
          aspectRatio: img.width / (img.height || 1),
          quad,
          rotation: 0,
          filter: 'magic', // CamScanner Magic Color default
          createdAt: Date.now(),
        });
      }

      setScannedPages(newPages);
      setView('review');
    } catch (err) {
      console.error('Auto crop error:', err);
    } finally {
      setIsAutoCropping(false);
    }
  };

  // Update a scanned page's parameters (quad, rotation, filter, processedDataUrl)
  const handleUpdatePage = (id: string, updated: Partial<ScannedPage>) => {
    setScannedPages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, ...updated } : page))
    );
  };

  // Delete a scanned page
  const handleDeletePage = (id: string) => {
    const remaining = scannedPages.filter((p) => p.id !== id);
    setScannedPages(remaining);
    setCapturedImages((prev) => prev.filter((img) => remaining.some((p) => p.originalDataUrl === img)));

    if (remaining.length === 0) {
      setView('camera');
    }
  };

  // Add more pages: Return to camera with existing snapshots retained
  const handleAddMorePages = () => {
    setView('camera');
  };

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Processing Loader Overlay when user clicks Next */}
      {isAutoCropping && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-bold text-white mb-1">
            অটোমেটিক ক্রপ করা হচ্ছে...
          </h2>
          <p className="text-xs text-slate-300 max-w-xs text-center px-4">
            টেবিল ও বিছানার ব্যাকগ্রাউন্ড বাদ দিয়ে শুধু খাতার অংশ আলাদা করা হচ্ছে
          </p>
        </div>
      )}

      {/* VIEW 1: Camera Scanner Viewfinder (Entrance View) */}
      {view === 'camera' && (
        <>
          <CameraView
            capturedImages={capturedImages}
            onCapture={handleCapture}
            onOpenGallery={handleOpenGallery}
            onOpenStack={() => setIsStackDrawerOpen(true)}
            onNext={handleProceedToReview}
          />

          {/* Captured Photos Drawer */}
          {isStackDrawerOpen && (
            <CapturedPagesDrawer
              images={capturedImages}
              onDeleteIndex={handleDeleteCapturedIndex}
              onClose={() => setIsStackDrawerOpen(false)}
              onProceedNext={handleProceedToReview}
            />
          )}
        </>
      )}

      {/* VIEW 2: Auto-Crop & Document Review Screen */}
      {view === 'review' && (
        <ReviewScreen
          pages={scannedPages}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onAddMorePages={handleAddMorePages}
          onBackToCamera={() => setView('camera')}
        />
      )}
    </div>
  );
}
