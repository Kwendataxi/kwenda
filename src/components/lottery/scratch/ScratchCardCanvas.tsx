import React, { useRef, useEffect, useState } from 'react';
import { Rarity, RARITY_CONFIG } from '@/types/scratch-card';

interface ScratchCardCanvasProps {
  width: number;
  height: number;
  rarity: Rarity;
  onScratch: (percentage: number) => void;
  onComplete: () => void;
  disabled?: boolean;
}

export const ScratchCardCanvas: React.FC<ScratchCardCanvasProps> = ({
  width,
  height,
  rarity,
  onScratch,
  onComplete,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const scratchedPixels = useRef(0);
  const totalPixels = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw silver scratch surface with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#E8E8E8');
    gradient.addColorStop(1, '#A8A8A8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add texture pattern
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 20,
        Math.random() * 20
      );
    }

    // Add "GRATTEZ ICI" text
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRATTEZ ICI', width / 2, height / 2);
    ctx.restore();

    // Calculate total pixels
    const imageData = ctx.getImageData(0, 0, width, height);
    totalPixels.current = imageData.data.length / 4;
  }, [width, height]);

  const scratch = (x: number, y: number) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    // Scratch effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Calculate percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }

    const percentage = (transparentPixels / totalPixels.current) * 100;
    scratchedPixels.current = transparentPixels;
    
    onScratch(percentage);

    // Auto-complete at 70%
    if (percentage >= 70) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onComplete();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isScratching) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`touch-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
