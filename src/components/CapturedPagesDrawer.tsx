/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Trash2, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react';

interface CapturedPagesDrawerProps {
  images: string[];
  onDeleteIndex: (index: number) => void;
  onClose: () => void;
  onProceedNext: () => void;
}

export const CapturedPagesDrawer: React.FC<CapturedPagesDrawerProps> = ({
  images,
  onDeleteIndex,
  onClose,
  onProceedNext,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">তোলা ছবিসমূহ ({images.length}টি)</h2>
            <p className="text-[11px] text-slate-400">খারাপ ছবি ডিলিট করতে পারেন অথবা নেক্সট চাপুন</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of Captured Images */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-3/4 flex flex-col"
            >
              <img
                src={img}
                alt={`Photo ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 text-white font-bold text-[10px]">
                ছবি {idx + 1}
              </div>
              <button
                onClick={() => onDeleteIndex(idx)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white shadow hover:bg-rose-700 transition-colors"
                title="ডিলিট করুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-xs text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>আরও ছবি তুলুন</span>
          </button>

          <button
            onClick={onProceedNext}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <span>নেক্সট (অটো-ক্রপ)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
