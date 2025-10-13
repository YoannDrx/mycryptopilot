"use client";

import { Download, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartImageViewerProps = {
  src: string;
  alt: string;
  className?: string;
};

export const ChartImageViewer = ({ src, alt, className }: ChartImageViewerProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle escape key to close zoom
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isZoomed]);

  // Handle download with watermark
  const handleDownload = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load the chart image
    const chartImg = new window.Image();
    chartImg.crossOrigin = "anonymous";

    chartImg.onload = async () => {
      // Set canvas size to match image
      canvas.width = chartImg.width;
      canvas.height = chartImg.height;

      // Draw the chart image
      ctx.drawImage(chartImg, 0, 0);

      // Load MyCryptoPilot logo
      const logoImg = new window.Image();
      logoImg.src = "/images/icon.png";

      logoImg.onload = () => {
        // Add watermark background (semi-transparent dark box)
        const watermarkHeight = 60;
        const watermarkPadding = 20;
        const logoSize = 40;
        const textPadding = 10;

        // Calculate watermark position (bottom-right corner)
        const watermarkX = canvas.width - 200 - watermarkPadding;
        const watermarkY = canvas.height - watermarkHeight - watermarkPadding;

        // Draw semi-transparent background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(watermarkX, watermarkY, 200, watermarkHeight);

        // Draw logo
        const logoX = watermarkX + textPadding;
        const logoY = watermarkY + (watermarkHeight - logoSize) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        // Draw text "MyCryptoPilot"
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.textBaseline = "middle";
        const textX = logoX + logoSize + textPadding;
        const textY = watermarkY + watermarkHeight / 2;
        ctx.fillText("MyCryptoPilot", textX, textY);

        // Download the image
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `mycryptopilot-chart-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }, "image/png");
      };
    };

    chartImg.src = src;
  };

  return (
    <>
      {/* Chart Image - clickable to zoom */}
      <div
        className={cn(
          "mb-6 bg-gradient-to-br from-slate-900/50 to-transparent border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer group relative",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsZoomed(true);
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
            Click to zoom
          </span>
        </div>
      </div>

      {/* Zoomed Modal - Portal to body */}
      {isMounted && isZoomed && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(false);
          }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls Bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <h3 className="text-white text-lg font-medium">Market Chart Analysis</h3>
              <div className="flex items-center gap-2">
                {/* Download Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDownload();
                  }}
                >
                  <Download className="size-5" />
                </Button>
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                  }}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Zoomed Image */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-xl border-2 border-violet-500/50 shadow-2xl shadow-violet-500/30"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Hidden canvas for watermark generation */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};
