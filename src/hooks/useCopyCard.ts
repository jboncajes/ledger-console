import { useRef, useState } from 'react';
import type React from 'react';
import html2canvas from 'html2canvas';
import { useColors } from '../theme/theme';

export function useCopyCard() {
  const colors = useColors();
  const cardRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: colors.bg1,
        logging: false,
        onclone: (_doc, el) => {
          [el, ...Array.from(el.querySelectorAll<HTMLElement>('*'))].forEach((node) => {
            node.style.animation = 'none';
            node.style.opacity = '1';
            node.style.backdropFilter = 'none';
            (node.style as unknown as Record<string, string>).webkitBackdropFilter = 'none';
          });
          el.style.background = colors.bg1;
        },
        ignoreElements: (el) =>
          el === copyBtnRef.current || (copyBtnRef.current?.contains(el) ?? false),
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return { cardRef, copyBtnRef, hovered, setHovered, copied, handleCopy };
}
