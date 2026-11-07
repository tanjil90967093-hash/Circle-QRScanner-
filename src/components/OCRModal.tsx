/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface OCRModalProps {
  imageDataUrl: string;
  pageNumber: number;
  onClose: () => void;
}

export const OCRModal: React.FC<OCRModalProps> = ({
  imageDataUrl,
  pageNumber,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [extractedText, setExtractedText] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOCR = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageDataUrl }),
      });

      if (!res.ok) {
        throw new Error(`সার্ভার এরর (${res.status})`);
      }

      const data = await res.json();
      setExtractedText(data.text || 'কোনো টেক্সট পাওয়া যায়নি।');
      setTitle(data.title || 'নথি');
      setSummary(data.summary || '');
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(
        'টেক্সট এক্সট্রাক্ট করা যায়নি। ইন্টারনেট সংযোগ চেক করুন বা পরে আবার চেষ্টা করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOCR();
  }, [imageDataUrl]);

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document_text'}_page_${pageNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI টেক্সট রিডার ও ওসিআর (OCR)</h3>
              <p className="text-[10px] text-slate-400">বাংলা ও ইংরেজি হাতের লেখা ও টাইপ করা টেক্সট</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-9 h-9 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-white mb-1">
                ডকুমেন্টের লেখা পড়া হচ্ছে...
              </p>
              <p className="text-[11px] text-slate-400">
                হাতের লেখা ও ফন্ট বিশ্লেষণ করা হচ্ছে
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-rose-300">{error}</p>
              <button
                onClick={runOCR}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>পুনরায় চেষ্টা করুন</span>
              </button>
            </div>
          ) : (
            <>
              {/* Summary / Suggested Title */}
              {summary && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200">
                  <span className="font-semibold text-purple-300">সারাংশ: </span>
                  {summary}
                </div>
              )}

              {/* Extracted Text Box */}
              <div className="relative">
                <textarea
                  readOnly
                  value={extractedText}
                  rows={10}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed outline-none resize-none focus:border-purple-500 transition-colors"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !error && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>.txt ফাইল সেভ</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'কপি হয়েছে!' : 'সব টেক্সট কপি করুন'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
