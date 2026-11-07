/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, RotateCcw, Maximize2, Sparkles, X } from 'lucide-react';
import { DocumentQuad, Point, detectDocumentCorners, getDefaultQuad, getFullQuad } from '../utils/imageProcessing';

interface CropAdjustModalProps {
  imageUrl: string;
  initialQuad: DocumentQuad;
  onSave: (quad: DocumentQuad) => void;
  onClose: () => void;
}

export const CropAdjustModal: React.FC<CropAdjustModalProps> = ({
  imageUrl,
  initialQuad,
  onSave,
  onClose,
}) => {
  const [quad, setQuad] = useState<DocumentQuad>(initialQuad);
  const [activeCorner, setActiveCorner] = useState<keyof DocumentQuad | null>(null);
  const [loupePoint, setLoupePoint] = useState<Point | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update corner during drag
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeCorner || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      let xPct = ((clientX - rect.left) / rect.width) * 100;
      let yPct = ((clientY - rect.top) / rect.height) * 100;

      // Clamp 0 to 100
      xPct = Math.max(0, Math.min(100, xPct));
      yPct = Math.max(0, Math.min(100, yPct));

      setQuad((prev) => ({
        ...prev,
        [activeCorner]: { x: Math.round(xPct * 10) / 10, y: Math.round(yPct * 10) / 10 },
      }));

      setLoupePoint({ x: xPct, y: yPct });
    },
    [activeCorner]
  );

  const handlePointerUp = useCallback(() => {
    setActiveCorner(null);
    setLoupePoint(null);
  }, []);

  const handleAutoDetect = async () => {
    if (!imageRef.current) return;
    setIsDetecting(true);
    try {
      const detected = await detectDocumentCorners(imageRef.current);
      setQuad(detected);
    } catch (err) {
      console.error(err);
      setQuad(getDefaultQuad());
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFullPage = () => {
    setQuad(getFullQuad());
  };

  const handleReset = () => {
    setQuad(initialQuad);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg active:bg-slate-800 transition-colors"
          title="বাতিল করুন"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-white">কাগজের সীমানা ও কোণ নির্ধারণ</h2>
          <p className="text-[11px] text-slate-400">৪টি কোণের পিন টেনে শুধু খাতার অংশটুকু সিলেক্ট করুন</p>
        </div>

        <button
          onClick={() => onSave(quad)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>ক্রপ সম্পন্ন</span>
        </button>
      </header>

      {/* Main Canvas / Image Area */}
      <main className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="relative max-w-full max-h-[72vh] flex items-center justify-center border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black"
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Source document preview"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[72vh] w-auto h-auto object-contain block pointer-events-none"
          />

          {/* SVG Overlay for bounding polygon & grid guidelines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Darkened mask outside crop area */}
            <defs>
              <mask id="cropMask">
                <rect width="100%" height="100%" fill="white" />
                <polygon
                  points={`${quad.tl.x}%,${quad.tl.y}% ${quad.tr.x}%,${quad.tr.y}% ${quad.br.x}%,${quad.br.y}% ${quad.bl.x}%,${quad.bl.y}%`}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.55)" mask="url(#cropMask)" />

            {/* Glowing cyan/emerald document border */}
            <polygon
              points={`${quad.tl.x}%,${quad.tl.y}% ${quad.tr.x}%,${quad.tr.y}% ${quad.br.x}%,${quad.br.y}% ${quad.bl.x}%,${quad.bl.y}%`}
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />

            {/* Inner rule-of-thirds grid for precision */}
            <line
              x1={`${(quad.tl.x * 2 + quad.tr.x) / 3}%`}
              y1={`${(quad.tl.y * 2 + quad.tr.y) / 3}%`}
              x2={`${(quad.bl.x * 2 + quad.br.x) / 3}%`}
              y2={`${(quad.bl.y * 2 + quad.br.y) / 3}%`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />
            <line
              x1={`${(quad.tl.x + quad.tr.x * 2) / 3}%`}
              y1={`${(quad.tl.y + quad.tr.y * 2) / 3}%`}
              x2={`${(quad.bl.x + quad.br.x * 2) / 3}%`}
              y2={`${(quad.bl.y + quad.br.y * 2) / 3}%`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />
            <line
              x1={`${(quad.tl.x * 2 + quad.bl.x) / 3}%`}
              y1={`${(quad.tl.y * 2 + quad.bl.y) / 3}%`}
              x2={`${(quad.tr.x * 2 + quad.br.x) / 3}%`}
              y2={`${(quad.tr.y * 2 + quad.br.y) / 3}%`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />
            <line
              x1={`${(quad.tl.x + quad.bl.x * 2) / 3}%`}
              y1={`${(quad.tl.y + quad.bl.y * 2) / 3}%`}
              x2={`${(quad.tr.x + quad.br.x * 2) / 3}%`}
              y2={`${(quad.tr.y + quad.br.y * 2) / 3}%`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />
          </svg>

          {/* 4 Interactive Corner Pins */}
          {(['tl', 'tr', 'br', 'bl'] as Array<keyof DocumentQuad>).map((cornerKey) => {
            const pt = quad[cornerKey];
            const isTarget = activeCorner === cornerKey;
            const labels: Record<keyof DocumentQuad, string> = {
              tl: 'উপরে বাম',
              tr: 'উপরে ডান',
              br: 'নিচে ডান',
              bl: 'নিচে বাম',
            };

            return (
              <div
                key={cornerKey}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  setActiveCorner(cornerKey);
                  setLoupePoint(pt);
                }}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair group touch-none"
              >
                {/* Visual Hit Area ($44x44px minimum touch hitbox per mobile ergonomics) */}
                <div className="w-11 h-11 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                      isTarget
                        ? 'bg-emerald-400 border-white scale-125 ring-4 ring-emerald-500/40'
                        : 'bg-white border-emerald-600 hover:scale-110 shadow-black/60'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  </div>
                </div>

                {/* Subtle Corner Label */}
                <span className="absolute top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-medium bg-black/80 text-slate-300 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {labels[cornerKey]}
                </span>
              </div>
            );
          })}

          {/* Precision Magnifying Loupe during corner dragging */}
          {activeCorner && loupePoint && (
            <div
              className="absolute z-20 w-28 h-28 rounded-full border-2 border-emerald-400 bg-slate-900 shadow-2xl overflow-hidden pointer-events-none"
              style={{
                left: `${loupePoint.x}%`,
                top: `${Math.max(16, loupePoint.y - 18)}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${containerRef.current ? containerRef.current.clientWidth * 2.8 : 800}px`,
                  backgroundPosition: `${loupePoint.x}% ${loupePoint.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* Loupe Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-emerald-400/80" />
                  <div className="absolute h-full w-[1px] bg-emerald-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full border border-emerald-300 bg-emerald-500/30" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Tool Bar */}
      <footer className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-3 shrink-0">
        <button
          onClick={handleAutoDetect}
          disabled={isDetecting}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{isDetecting ? 'ডিটেক্ট হচ্ছে...' : 'অটো ডিটেক্ট'}</span>
        </button>

        <button
          onClick={handleFullPage}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4 text-blue-400" />
          <span>সম্পূর্ণ ছবি</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>রিসেট</span>
        </button>
      </footer>
    </div>
  );
};
