"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url?: string;
  alt: string;
  emoji?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      setActiveIdx(Math.max(0, Math.min(idx, images.length - 1)));
    },
    [images.length]
  );

  const prev = useCallback(() => {
    goTo(activeIdx - 1 < 0 ? images.length - 1 : activeIdx - 1);
  }, [activeIdx, goTo, images.length]);

  const next = useCallback(() => {
    goTo(activeIdx + 1 >= images.length ? 0 : activeIdx + 1);
  }, [activeIdx, goTo, images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxOpen(false);
    },
    [prev, next]
  );

  if (images.length === 0) return null;

  const active = images[activeIdx];

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main Image */}
        <div
          className="main-image-wrapper relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#f0f3ff] to-[#e8ecfc] cursor-pointer"
          style={{ aspectRatio: "4/3" }}
          onClick={next}
        >
          {active.url ? (
            <Image
              src={active.url}
              alt={active.alt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              {active.emoji || "🧳"}
            </div>
          )}

          {/* Counter */}
          <div className="gallery-counter absolute bottom-3 right-3 bg-[rgba(26,31,58,0.75)] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {activeIdx + 1} / {images.length}
          </div>

          {/* Navigation Arrows - Always visible */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="gallery-arrow gallery-prev absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(26,31,58,0.7)] border border-white/20 text-white flex items-center justify-center hover:bg-brand-blue transition-all opacity-100"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="gallery-arrow gallery-next absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(26,31,58,0.7)] border border-white/20 text-white flex items-center justify-center hover:bg-brand-blue transition-all opacity-100"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Zoom Button - Always visible */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              className="gallery-zoom-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-[rgba(26,31,58,0.7)] border border-white/20 text-white flex items-center justify-center hover:bg-brand-blue transition-all opacity-100"
              aria-label="View fullscreen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="gallery-thumbnails flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "gallery-thumb w-[68px] h-[68px] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 flex items-center justify-center shrink-0",
                  i === activeIdx
                    ? "border-brand-blue shadow-sm"
                    : "border-[#e1e5f5] hover:border-brand-blue"
                )}
              >
                {img.url ? (
                  <Image src={img.url} alt={img.alt} width={64} height={64} className="object-cover" />
                ) : (
                  <span className="thumb-emoji text-2xl">{img.emoji || "🧳"}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="gallery-lightbox fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.92)] flex flex-col items-center justify-center gap-5 p-5"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="lb-close fixed top-5 right-5 w-11 h-11 rounded-full bg-[rgba(255,255,255,0.15)] border border-white/20 text-white flex items-center justify-center hover:bg-[#ef4444] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="lb-arrow lb-prev fixed left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[rgba(255,255,255,0.15)] border border-white/20 text-white flex items-center justify-center hover:bg-brand-blue transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="lb-arrow lb-next fixed right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[rgba(255,255,255,0.15)] border border-white/20 text-white flex items-center justify-center hover:bg-brand-blue transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="lb-main-wrap flex flex-col items-center gap-3 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="lb-main flex items-center justify-center max-h-[70vh]">
              {active.url ? (
                <Image
                  src={active.url}
                  alt={active.alt}
                  width={800}
                  height={600}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <div className="text-[8rem]">{active.emoji || "🧳"}</div>
              )}
            </div>
            <p className="lb-counter text-white/60 text-sm">{activeIdx + 1} / {images.length}</p>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="lb-thumbs fixed bottom-5 flex gap-2 flex-wrap justify-center px-5" onClick={(e) => e.stopPropagation()}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "lb-thumb-btn w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                    i === activeIdx ? "border-brand-blue" : "border-white/20 hover:border-white/60"
                  )}
                >
                  {img.url ? (
                    <Image src={img.url} alt={img.alt} width={56} height={56} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-2xl">
                      {img.emoji || "🧳"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
