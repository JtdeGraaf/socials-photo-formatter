import React, { useEffect, useRef } from 'react';

interface ImageProcessorProps {
  image: File | null;
  onProcessed: (dataUrl: string) => void;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ image, onProcessed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      // Set canvas size to 1080x1080 (Instagram square size)
      canvas.width = 1080;
      canvas.height = 1080;

      // Fill canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling and positioning
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      // Draw the image
      ctx.drawImage(
        img,
        x,
        y,
        img.width * scale,
        img.height * scale
      );

      // Convert to data URL and pass to parent
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onProcessed(dataUrl);

      // Clean up
      URL.revokeObjectURL(img.src);
    };
  }, [image, onProcessed]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};