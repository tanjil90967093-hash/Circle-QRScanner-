/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Crop,
  RotateCw,
  Sparkles,
  Download,
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Check,
  FileDown
} from 'lucide-react';
import {
  ScannedPage,
  DocumentQuad,
  FilterType,
  warpDocumentPerspective,
  applyDocumentFilter,
  rotateCanvas
} from '../utils/imageProcessing';
import { CropAdjustModal } from './CropAdjustModal';
import { exportToPDF, downloadImage } from '../utils/pdfExport';
import { OCRModal } from './OCRModal';

interface ReviewScreenProps {
  pages: ScannedPage[];
  onUpdatePage: (id: string, updated: Partial<ScannedPage>) => void;
  onDeletePage: (id: string) => void;
  onAddMorePages: () => void;
  onBackToCamera: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  pages,
  onUpdatePage,
  onDeletePage,
  onAddMorePages,
  onBackToCamera,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [docTitle, setDocTitle] = useState('স্ক্যান_ডকুমেন্ট_' + new Date().toLocaleDateString('bn-BD').replace(/\//g, '-'));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Active page
  const activePage = pages[currentIndex] || pages[0];

  // Process current page when quad, rotation or filter changes
  useEffect(() => {
    if (!activePage) return;

    let isMounted = true;
    const processPage = async () => {
      setIsProcessing(true);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = activePage.originalDataUrl;
        });

        // 1. Perspective Transform Auto-Crop
        let canvas = await warpDocumentPerspective(img, activePage.quad);

        // 2. Rotate if needed
        if (activePage.rotation !== 0) {
          canvas = rotateCanvas(canvas, activePage.rotation);
        }

        // 3. Document Filter (Magic Color / B&W / etc.)
        canvas = applyDocumentFilter(canvas, activePage.filter);

        if (isMounted) {
          const resultUrl = canvas.toDataURL('image/jpeg', 0.92);
          if (resultUrl !== activePage.processedDataUrl) {
            onUpdatePage(activePage.id, { processedDataUrl: resultUrl });
          }
        }
      } catch (err) {
        console.error('Error processing page:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    processPage();

    return () => {
      isMounted = false;
    };
  }, [
    activePage?.id,
    activePage?.quad,
    activePage?.rotation,
    activePage?.filter,
  ]);

  if (!activePage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">কোনো স্ক্যান করা নথি পাওয়া যায়নি।</p>
        <button
          onClick={onBackToCamera}
          className="px-4 py-2 bg-emerald-500 rounded-xl text-white font-semibold text-xs"
        >
          ক্যামেরায় ফিরে যান
        </button>
      </div>
    );
  }

  const handleRotate = () => {
    const nextRot = (activePage.rotation + 90) % 360;
    onUpdatePage(activePage.id, { rotation: nextRot });
  };

  const handleFilterChange = (filter: FilterType) => {
    onUpdatePage(activePage.id, { filter });
  };

  const handleSaveCrop = (newQuad: DocumentQuad) => {
    onUpdatePage(activePage.id, { quad: newQuad });
    setIsCropModalOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(pages, {
        title: docTitle,
        pageSize: 'a4',
        orientation: 'portrait',
        quality: 0.9,
        addPageNumbers: true,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingleImage = () => {
    const url = activePage.processedDataUrl || activePage.originalDataUrl;
    downloadImage(url, `${docTitle}_page_${currentIndex + 1}.jpg`);
  };

  const filters: { id: FilterType; label: string; sub: string }[] = [
    { id: 'magic', label: 'ম্যাজিক কালার', sub: 'উজ্জ্বল ও সাদা ব্যাকগ্রাউন্ড' },
    { id: 'bw', label: 'সাদা-কালো (B&W)', sub: 'ক্লিন ও গাঢ় লেখা' },
    { id: 'grayscale', label: 'গ্রেস্কেল', sub: 'স্মুথ গ্রেটোন' },
    { id: 'sharp', label: 'শার্প', sub: 'হাই কন্ট্রাস্ট' },
    { id: 'original', label: 'মূল ছবি', sub: 'অপরিবর্তিত' },
  ];

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCamera}
            className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg active:bg-slate-800 transition-colors"
            title="ক্যামেরায় ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Editable Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="px-2 py-1 bg-slate-800 border border-emerald-500 rounded text-xs text-white outline-none"
              />
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-left group flex items-center gap-1"
            >
              <h1 className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs group-hover:text-emerald-300 transition-colors">
                {docTitle}
              </h1>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300">✎</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Add More Pages & PDF Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddMorePages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            title="ক্যামেরা দিয়ে আরও ছবি তুলুন"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">আরও যোগ করুন</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>{isExporting ? 'তৈরি হচ্ছে...' : 'PDF সেভ'}</span>
          </button>
        </div>
      </header>

      {/* AUTO-CROP SUCCESS BANNER */}
      <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-300">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>অটো-ক্রপ সম্পন্ন: টেবিল/বিছানার ব্যাকগ্রাউন্ড বাদ দেওয়া হয়েছে</span>
        </div>
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-xs font-medium underline text-emerald-400 hover:text-emerald-300"
        >
          {showOriginal ? 'ক্রপ করা ফলাফল দেখুন' : 'মূল ছবি তুলনা করুন'}
        </button>
      </div>

      {/* MAIN DOCUMENT VIEWPORT */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Navigation Arrows for Multi-Page */}
        {pages.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`absolute left-2 z-20 p-2.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700 text-white transition-opacity ${
                currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
              }`}
              title="পূর্ববর্তী পৃষ্ঠা"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              disabled={currentIndex === pages.length - 1}
              className={`absolute right-2 z-20 p-2.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700 text-white transition-opacity ${
                currentIndex === pages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
              }`}
              title="পরবর্তী পৃষ্ঠা"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Document Display Canvas/Image */}
        <div className="relative max-w-full max-h-[58vh] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs text-emerald-300 font-medium">অটোমেটিক প্রসেস হচ্ছে...</span>
            </div>
          )}

          <img
            src={showOriginal ? activePage.originalDataUrl : (activePage.processedDataUrl || activePage.originalDataUrl)}
            alt={`Page ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[58vh] w-auto h-auto object-contain block transition-transform duration-200"
          />

          {/* Original Comparison Badge */}
          {showOriginal && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 font-bold text-[10px]">
              মূল ছবি (টেবিল/বিছানা সহ)
            </div>
          )}
        </div>

        {/* Page Counter Indicator */}
        <div className="mt-3 text-xs font-semibold text-slate-400">
          পৃষ্ঠা {currentIndex + 1} / {pages.length}
        </div>
      </main>

      {/* MULTI-PAGE THUMBNAIL STRIP (when multiple photos scanned) */}
      {pages.length > 1 && (
        <div className="px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto border-t border-slate-900 bg-slate-950/60">
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={p.processedDataUrl || p.originalDataUrl}
                alt={`Thumb ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 px-1 text-[8px] font-bold bg-black/80 text-white rounded-tl">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* FILTER PRESET BUTTONS (CamScanner style) */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-1.5 overflow-x-auto">
        {filters.map((f) => {
          const isActive = activePage.filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* BOTTOM ACTION TOOLBAR */}
      <footer className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 grid grid-cols-5 gap-1.5 max-w-xl mx-auto w-full">
        {/* Adjust Crop (4 corners) */}
        <button
          onClick={() => setIsCropModalOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition-all text-center"
          title="কাগজের সীমানা ও কোণ এডজাস্ট করুন"
        >
          <Crop className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-[10px] font-medium leading-none">ক্রপ ঠিক করুন</span>
        </button>

        {/* Rotate 90 deg */}
        <button
          onClick={handleRotate}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition-all text-center"
          title="৯০ ডিগ্রি ঘুরান"
        >
          <RotateCw className="w-5 h-5 text-blue-400 mb-1" />
          <span className="text-[10px] font-medium leading-none">ঘুরান ({activePage.rotation}°)</span>
        </button>

        {/* AI OCR / Text Extractor */}
        <button
          onClick={() => setOcrModalOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition-all text-center"
          title="নোটবুক বা কাগজের লেখা টেক্সট আকারে বের করুন"
        >
          <FileText className="w-5 h-5 text-purple-400 mb-1" />
          <span className="text-[10px] font-medium leading-none">AI টেক্সট (OCR)</span>
        </button>

        {/* Download JPG/PNG */}
        <button
          onClick={handleDownloadSingleImage}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition-all text-center"
          title="এই ছবি ডাউনলোড করুন"
        >
          <Download className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-medium leading-none">ছবি সেভ</span>
        </button>

        {/* Delete Page */}
        <button
          onClick={() => {
            if (confirm('আপনি কি এই পৃষ্ঠাটি ডিলিট করতে চান?')) {
              onDeletePage(activePage.id);
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
            }
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 active:scale-95 transition-all text-center"
          title="পৃষ্ঠা ডিলিট করুন"
        >
          <Trash2 className="w-5 h-5 text-rose-500 mb-1" />
          <span className="text-[10px] font-medium leading-none">ডিলিট</span>
        </button>
      </footer>

      {/* 4-Corner Crop Adjustment Modal */}
      {isCropModalOpen && (
        <CropAdjustModal
          imageUrl={activePage.originalDataUrl}
          initialQuad={activePage.quad}
          onSave={handleSaveCrop}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}

      {/* AI OCR Modal */}
      {ocrModalOpen && (
        <OCRModal
          imageDataUrl={activePage.processedDataUrl || activePage.originalDataUrl}
          pageNumber={currentIndex + 1}
          onClose={() => setOcrModalOpen(false)}
        />
      )}
    </div>
  );
};
