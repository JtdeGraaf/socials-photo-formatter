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
    static async processImage(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        const settings = { ...options };

        // First, let's create an object URL and load the image to get its dimensions
        const img = await this.loadImage(file);

        // Determine the size of the square canvas (use the larger dimension)
        const canvasSize = Math.max(img.width, img.height);

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Cannot get canvas context');

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
            //ctx.shadowOffsetX = Math.round(canvasSize * 0.015);
            //ctx.shadowOffsetY = Math.round(canvasSize * 0.015);
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);


            // 3) Gentle top-left lift (makes the top edge read more)
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = Math.round(canvasSize * 0.02);
            //ctx.shadowOffsetX = -Math.round(canvasSize * 0.008);
            //ctx.shadowOffsetY = -Math.round(canvasSize * 0.008);
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
}