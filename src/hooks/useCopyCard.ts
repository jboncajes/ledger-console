import { useRef, useState } from 'react';
import type React from 'react';
import html2canvas from 'html2canvas';
import { useColors } from '../theme/theme';

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ledger-card-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useCopyCard() {
  const colors = useColors();
  const cardRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    try {
      const card = cardRef.current;
      const scrollEl = card.querySelector<HTMLElement>('[data-copy-scroll]');
      const scrollOverflow = scrollEl ? Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth) : 0;
      const captureW = card.offsetWidth + scrollOverflow;
      const captureH = card.scrollHeight;

      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: colors.bg1,
        logging: false,
        width: captureW,
        height: captureH,
        windowWidth: captureW,
        onclone: (_doc, el) => {
          if (scrollOverflow > 0) {
            const cloneScroll = el.querySelector<HTMLElement>('[data-copy-scroll]');
            if (cloneScroll) {
              cloneScroll.style.overflow = 'visible';
              cloneScroll.style.width = `${scrollEl!.scrollWidth}px`;
            }
            el.style.overflow = 'visible';
            el.style.width = `${captureW}px`;
          }
          [el, ...Array.from(el.querySelectorAll<HTMLElement>('*'))].forEach((node) => {
            node.style.animation = 'none';
            node.style.opacity = '1';
            node.style.backdropFilter = 'none';
            (node.style as unknown as Record<string, string>).webkitBackdropFilter = 'none';
          });
          el.style.background = colors.bg1;
        },
        ignoreElements: (el) => {
          if (el === copyBtnRef.current || (copyBtnRef.current?.contains(el) ?? false)) return true;
          if ((el as HTMLElement).dataset?.copyHide === 'true') return true;
          const parent = (el as HTMLElement).closest?.('[data-copy-hide="true"]');
          return parent !== null && parent !== undefined;
        },
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      );

      const canWriteClipboard =
        typeof navigator.clipboard?.write === 'function' &&
        typeof ClipboardItem !== 'undefined';

      if (canWriteClipboard) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
          downloadBlob(blob);
        }
      } else {
        downloadBlob(blob);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy };
}
