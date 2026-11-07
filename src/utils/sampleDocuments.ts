/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates realistic test images of documents/notebooks lying on a wooden table or bed sheet.
 * Perfect for instantaneous demonstration of auto-cropping away the background table/bed!
 */
export function generateSampleDocument(type: 'table-notebook' | 'bed-notebook' | 'desk-receipt'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d')!;

  if (type === 'table-notebook') {
    // 1. Wooden Table Background
    drawWoodenTableBackground(ctx, 1200, 1600);

    // 2. Angled Notebook on the table
    ctx.save();
    // Soft drop shadow of notebook onto table
    ctx.shadowColor = 'rgba(20, 10, 5, 0.45)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 20;

    // Angled quadrilateral for notebook: placed diagonally on the wooden table
    const quad = [
      { x: 160, y: 190 }, // TL
      { x: 1040, y: 240 }, // TR
      { x: 970, y: 1420 }, // BR
      { x: 110, y: 1360 }, // BL
    ];

    drawPaperPage(ctx, quad, 'math-notebook');
    ctx.restore();

    // 3. Draw a pen on the wooden table next to the notebook
    drawBallPen(ctx, 1020, 700, 1080, 1250);

  } else if (type === 'bed-notebook') {
    // 1. Fabric Bed Sheet Background (warm patterned soft wrinkles)
    drawBedSheetBackground(ctx, 1200, 1600);

    // 2. Angled Notebook placed on the bed
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 22;

    const quad = [
      { x: 180, y: 220 }, // TL
      { x: 1020, y: 170 }, // TR
      { x: 990, y: 1390 }, // BR
      { x: 140, y: 1440 }, // BL
    ];

    drawPaperPage(ctx, quad, 'bengali-notes');
    ctx.restore();

  } else {
    // Desk with Store Receipt
    drawDeskSurface(ctx, 1200, 1600);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 15;

    const quad = [
      { x: 280, y: 180 }, // TL
      { x: 920, y: 210 }, // TR
      { x: 880, y: 1420 }, // BR
      { x: 240, y: 1380 }, // BL
    ];

    drawPaperPage(ctx, quad, 'receipt');
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

function drawWoodenTableBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Rich natural wood grain planks
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#58361e');
  grad.addColorStop(0.5, '#452614');
  grad.addColorStop(1, '#321909');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Planks dividers
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.5)';
  ctx.lineWidth = 3;
  for (let x = 200; x < w; x += 280) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 30, h);
    ctx.stroke();
  }

  // Subtle wood streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    ctx.fillRect(0, y, w, Math.random() * 8 + 2);
  }
}

function drawBedSheetBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Warm cozy woven cotton bedsheet with textile ripples
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#c7d2fe'); // soft periwinkle
  bgGrad.addColorStop(0.5, '#a5b4fc');
  bgGrad.addColorStop(1, '#818cf8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Sheet folds / soft fabric creases
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(300, 400, 600, 120, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(30, 41, 59, 0.12)';
  ctx.beginPath();
  ctx.ellipse(800, 1100, 700, 140, -Math.PI / 8, 0, Math.PI * 2);
  ctx.fill();

  // Subtle grid print on bedsheet
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < h; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + 20);
    ctx.stroke();
  }
  for (let x = 0; x < w; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 20, h);
    ctx.stroke();
  }
}

function drawDeskSurface(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Modern dark matte office desk
  const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 900);
  grad.addColorStop(0, '#334155');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawPaperPage(
  ctx: CanvasRenderingContext2D,
  corners: { x: number; y: number }[],
  contentStyle: 'math-notebook' | 'bengali-notes' | 'receipt'
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  ctx.lineTo(corners[1].x, corners[1].y);
  ctx.lineTo(corners[2].x, corners[2].y);
  ctx.lineTo(corners[3].x, corners[3].y);
  ctx.closePath();

  // Paper fill (slightly off-white real notebook paper)
  ctx.fillStyle = '#fdfbf7';
  ctx.fill();
  ctx.clip();

  // Compute paper center & angle
  const cx = (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4;
  const cy = (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4;
  const angle = Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x);

  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const paperW = 820;
  const paperH = 1180;

  // Paper background texture
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(-paperW / 2, -paperH / 2, paperW, paperH);

  // Left red margin line (typical school notebook)
  if (contentStyle !== 'receipt') {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-paperW / 2 + 100, -paperH / 2);
    ctx.lineTo(-paperW / 2 + 100, paperH / 2);
    ctx.stroke();

    // Top margin line
    ctx.beginPath();
    ctx.moveTo(-paperW / 2, -paperH / 2 + 130);
    ctx.lineTo(paperW / 2, -paperH / 2 + 130);
    ctx.stroke();

    // Blue horizontal ruled lines
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
    ctx.lineWidth = 1;
    for (let y = -paperH / 2 + 175; y < paperH / 2 - 40; y += 42) {
      ctx.beginPath();
      ctx.moveTo(-paperW / 2, y);
      ctx.lineTo(paperW / 2, y);
      ctx.stroke();
    }
  }

  // Draw handwritten text lines
  if (contentStyle === 'math-notebook') {
    ctx.fillStyle = '#1e3a8a'; // Blue ballpen ink
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('বিষয়: সাধারণ গণিত - পরিমিতি ও বৃত্ত', -paperW / 2 + 120, -paperH / 2 + 95);

    ctx.fillStyle = '#1e293b';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('তারিখ: ১২ নভেম্বর ২০২৬', paperW / 2 - 260, -paperH / 2 + 95);

    ctx.fillStyle = '#1e40af'; // Blue ink
    const notes = [
      '১. বৃত্তের পরিধি = 2πr (এখানে r = ব্যাসার্ধ, π ≈ ৩.১৪১৬)',
      '২. বৃত্তের ক্ষেত্রফল = πr²',
      '৩. গোলকের সমগ্র পৃষ্ঠের ক্ষেত্রফল = 4πr²',
      '৪. বেলন বা সিলিন্ডারের আয়তন = πr²h',
      'উদাহরণ ১: একটি বৃত্তের ব্যাসার্ধ ৭ সেমি হলে এর পরিধি কত?',
      'সমাধান: পরিধি = ২ × (২২/৭) × ৭ = ৪৪ সেমি। [উত্তর]',
      'অনুশীলন ৩.২ এর সকল অংক আগামীকাল ক্লাসে দেখাতে হবে।',
      'প্রমাণ: বৃত্তের কেন্দ্রে সৃষ্ট কোণ = ৩৬০°',
      'চাপ দ্বারা কেন্দ্রে উৎপন্ন কোণ চাপের সমানুপাতিক।',
      'বিশেষ দ্রষ্টব্য: কম্পাস ও রুলার দিয়ে চিত্র অঙ্কন আবশ্যক।',
    ];

    let startY = -paperH / 2 + 165;
    notes.forEach((line) => {
      ctx.fillText(line, -paperW / 2 + 120, startY);
      startY += 42;
    });

    // Small hand-drawn circle diagram
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(160, 180, 75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(160, 180);
    ctx.lineTo(235, 180);
    ctx.stroke();
    ctx.fillStyle = '#2563eb';
    ctx.font = '16px sans-serif';
    ctx.fillText('r = 7 cm', 170, 170);

  } else if (contentStyle === 'bengali-notes') {
    ctx.fillStyle = '#0f172a'; // Black gel pen
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('বাংলা ১ম পত্র - সাহিত্যের রূপ ও রীতি', -paperW / 2 + 120, -paperH / 2 + 95);

    ctx.fillStyle = '#334155';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    const notes = [
      '• কবিতা: ছন্দোবদ্ধ ভাষায় ভাব প্রকাশের মাধ্যম হলো কবিতা।',
      '• মহাকাব্য: অতিশয় দীর্ঘ কাহিনীমূলক আখ্যান কাব্য। যেমন: মেঘনাদবধ কাব্য।',
      '• নাটক: দৃশ্যকাব্য ও শ্রব্যকাব্য—দর্শকের সামনে অভিনয়ের উপযোগী।',
      '• উপন্যাস: মানব জীবনের বিস্তৃত আখ্যান—চরিত্র ও পরিবেশের সমন্বয়।',
      '• ছোটগল্প: "নাহি বর্ণনার ছটা, ঘটনার ঘনঘটা, নাহি তত্ত্ব নাহি উপদেশ—',
      '  শেষ হয়েও হইলো না শেষ" — রবীন্দ্রনাথ ঠাকুর।',
      'গুরুত্বপূর্ণ প্রশ্নাবলী:',
      'ক) বাংলা সাহিত্যের প্রথম সার্থক উপন্যাস কোনটি? (দুর্গেশনন্দিনী)',
      'খ) মাইকেল মধুসূদন দত্তের শ্রেষ্ঠ কীর্তি আলোচনা কর।',
      'গ) লালসালু উপন্যাসের মজিদ চরিত্রের মনস্তাত্ত্বিক দিক ব্যাখ্যা কর।',
    ];

    let startY = -paperH / 2 + 165;
    notes.forEach((line) => {
      ctx.fillText(line, -paperW / 2 + 120, startY);
      startY += 42;
    });

  } else {
    // Receipt
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SUPER MART DHAKA', 0, -paperH / 2 + 80);
    ctx.font = '16px monospace';
    ctx.fillText('Gulshan-2, Road 11, Dhaka', 0, -paperH / 2 + 115);
    ctx.fillText('VAT Reg: 001928374-0101', 0, -paperH / 2 + 140);
    ctx.fillText('--------------------------------------', 0, -paperH / 2 + 170);

    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    const items = [
      ['A4 Paper Rim (80 GSM)', 'Tk. 580.00'],
      ['Gel Pen Box (10 pcs)', 'Tk. 150.00'],
      ['Notebook Hardcover 200p', 'Tk. 220.00'],
      ['Correction Pen (Whitener)', 'Tk. 85.00'],
      ['Highlighter Set (4 Colors)', 'Tk. 160.00'],
      ['Stapler & Pin Box', 'Tk. 140.00'],
    ];

    let startY = -paperH / 2 + 220;
    items.forEach(([desc, price]) => {
      ctx.fillText(desc, -paperW / 2 + 80, startY);
      ctx.fillText(price, paperW / 2 - 200, startY);
      startY += 45;
    });

    ctx.textAlign = 'center';
    ctx.fillText('--------------------------------------', 0, startY + 20);
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SUBTOTAL: Tk. 1,335.00', 0, startY + 60);
    ctx.fillText('VAT (5%): Tk. 66.75', 0, startY + 95);
    ctx.fillText('TOTAL NET: Tk. 1,401.75', 0, startY + 140);
    ctx.font = '16px monospace';
    ctx.fillText('Paid via bKash: 017XXXXXX89', 0, startY + 190);
    ctx.fillText('Thank You For Shopping With Us!', 0, startY + 240);
  }

  ctx.restore();
}

function drawBallPen(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 15;

  ctx.strokeStyle = '#2563eb'; // blue pen body
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Silver grip
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(x2 - 30, y2 - 40);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}
