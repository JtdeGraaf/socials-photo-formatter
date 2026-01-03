import piexif, { type PiexifData } from 'piexifjs';
import { ProcessingQueue } from './ProcessingQueue';

export interface ProcessingOptions {
    maxFileSizeMB?: number;  // undefined means no compression
    enableShadow?: boolean;  // undefined or true means shadow enabled
    backgroundType?: 'white' | 'blurred';  // undefined or 'white' means white background
}

export interface ProcessedImage {
    dataUrl: string;
    originalSize: number;
    processedSize: number;
    width: number;
    height: number;
    fileName: string;
    wasCompressed: boolean;
}

export class ImageProcessingService {
    // Single ProcessingQueue instance for the service (default concurrency 5)
    private static _queue = new ProcessingQueue(2);

    static async processImage(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        return this._queue.enqueue(() => this._processImageImpl(file, options));
    }

    // The actual heavy implementation — moved out so the public method can be a queued wrapper.
    private static async _processImageImpl(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        const settings = { ...options };

        // Yield once to give the browser a chance to handle input/paint before heavy work
        await new Promise((r) => setTimeout(r, 0));

        // Read original file as data URL so we can extract EXIF if present
        let originalDataUrl: string | null;
        try {
            originalDataUrl = await this.readFileAsDataUrl(file);
        } catch {
            // If reading fails, continue without EXIF
            originalDataUrl = null;
        }

        // Try to extract EXIF from original if it's a JPEG
        let exifObject: PiexifData | null = null;
        if (originalDataUrl && originalDataUrl.startsWith('data:image/jpeg')) {
            try {
                exifObject = piexif.load(originalDataUrl);
                // If load returns an object, exifObject will be non-null
            } catch {
                // Not much to do — proceed without EXIF
                exifObject = null;
            }
        }

        // First, let's create an object URL and load the image to get its dimensions
        const img = await this.loadImage(file);

        // Determine the size of the square canvas (use the larger dimension)
        const canvasSize = Math.max(img.width, img.height);

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Cannot get canvas context');

        // Yield to the event loop so the browser can update UI before heavy drawing starts
        await new Promise((r) => setTimeout(r, 0));

        // Center the image
        const xOffset = (canvas.width - img.width) / 2;
        const yOffset = (canvas.height - img.height) / 2;

        // Draw background based on backgroundType setting
        const backgroundType = settings.backgroundType || 'white';

        if (backgroundType === 'blurred') {
            // Draw a heavily blurred version of the image as background
            // Apply multiple blur passes for a more intense effect

            // Create a temporary canvas for the blur effect
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { alpha: false });
            if (!tempCtx) throw new Error('Cannot get temp canvas context');

            // Draw image to temp canvas with heavy blur
            tempCtx.filter = 'blur(80px)';
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

            // Draw the blurred image to main canvas with additional blur
            ctx.filter = 'blur(80px)';
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.filter = 'none';


            // Add a darkening overlay for better contrast
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // Fill the canvas with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Yield before shadow drawing; shadow draws can be expensive
        await new Promise((r) => setTimeout(r, 0));

        // Apply shadow effect if enabled (default is true)
        const shouldApplyShadow = settings.enableShadow !== false;

        if (shouldApplyShadow) {
            //// START DRAWING SHADOWS AND IMAGE ////

            // === First layer: soft ambient halo (around the image) ===
            const ambientBlur = Math.round(canvasSize * 0.03);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = ambientBlur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw the image once to create the soft glow
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);

            // === Second layer: stronger, directional shadow underneath ===
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = Math.round(canvasSize * 0.02);
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);

            // 3) Gentle top-left lift (makes the top edge read more)
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = Math.round(canvasSize * 0.02);
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);

            // Draw the image again to layer in the deeper shadow
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);

            // Reset shadow
            ctx.shadowColor = 'transparent';

            //// END DRAWING SHADOWS AND IMAGE ////
        } else {
            // Draw the image without shadow
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);
        }

        let dataUrl: string;
        let wasCompressed = false;

        // Yield before encoding to give the browser a chance to paint
        await new Promise((r) => setTimeout(r, 0));

        if (settings.maxFileSizeMB) {
             // Start with reasonable quality
             let quality = 0.92; // JPEG default quality
             dataUrl = canvas.toDataURL('image/jpeg', quality);
             let currentSize = this.getDataUrlSize(dataUrl);

             // Reduce quality if needed
             const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
             while (currentSize > maxSizeBytes && quality > 0.5) {
                 wasCompressed = true;
                 quality -= 0.05;
                 // Yield between compression attempts so the main thread can service input
                 await new Promise((r) => setTimeout(r, 0));
                 dataUrl = canvas.toDataURL('image/jpeg', quality);
                 currentSize = this.getDataUrlSize(dataUrl);
             }
         } else {
             // Even without compression limit, use JPEG for very large images
             const isVeryLarge = img.width * img.height > 4096 * 4096;
             if (isVeryLarge) {
                 dataUrl = canvas.toDataURL('image/jpeg', 0.92);
             } else {
                 dataUrl = canvas.toDataURL('image/png');
             }
         }

        // If the final output is JPEG and we extracted EXIF from the original, re-insert it.
        if (exifObject && dataUrl.startsWith('data:image/jpeg')) {
            try {
                const exifStr = piexif.dump(exifObject);
                dataUrl = piexif.insert(exifStr, dataUrl);
            } catch {
                // If reinsertion fails, fall back to the dataUrl without EXIF
            }
        }

        const processedSize = this.getDataUrlSize(dataUrl);

        return {
            dataUrl,
            originalSize: file.size,
            processedSize,
            width: canvas.width,
            height: canvas.height,
            fileName: file.name,
            wasCompressed
        };

    }


    private static getDataUrlSize(dataUrl: string): number {
        // Remove the data URL prefix to get just the base64 string
        const base64 = dataUrl.split(',')[1];
        // Convert base64 to raw binary size
        return (base64.length * 3) / 4;
    }

    private static loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // Helper to read a File as a data URL
    private static readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Unexpected FileReader result type'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}