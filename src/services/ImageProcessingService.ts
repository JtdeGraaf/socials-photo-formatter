
export interface ProcessingOptions {
    minSize: number;  // Minimum size for the shortest side
    quality: number;
    maxFileSizeMB?: number;
    preserveOriginalSize?: boolean;
}

export interface ProcessedImage {
    dataUrl: string;
    originalSize: number;
    processedSize: number;
    width: number;
    height: number;
    fileName: string;
    quality: number;
}

export class ImageProcessingService {
    private static DEFAULT_OPTIONS: ProcessingOptions = {
        minSize: 1080,
        quality: 1.0,
        maxFileSizeMB: 8,
        preserveOriginalSize: true
    };

    static async processImage(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        const settings = { ...this.DEFAULT_OPTIONS, ...options };

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Cannot get canvas context');
        }

        // Load image
        const img = await this.loadImage(file);

        // Calculate dimensions while preserving aspect ratio
        let finalWidth: number;
        let finalHeight: number;

        if (settings.preserveOriginalSize &&
            img.width >= settings.minSize &&
            img.height >= settings.minSize) {
            // Keep original dimensions if they're large enough
            finalWidth = img.width;
            finalHeight = img.height;
        } else {
            // Scale up to meet minimum size requirement
            const aspectRatio = img.width / img.height;
            if (aspectRatio > 1) {
                finalHeight = settings.minSize;
                finalWidth = Math.round(settings.minSize * aspectRatio);
            } else {
                finalWidth = settings.minSize;
                finalHeight = Math.round(settings.minSize / aspectRatio);
            }
        }

        // Make the canvas big enough for the image and the white padding
        const maxSide = Math.max(finalWidth, finalHeight);
        canvas.width = maxSide;
        canvas.height = maxSide;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center the image
        const x = (maxSide - finalWidth) / 2;
        const y = (maxSide - finalHeight) / 2;

        // Draw image maintaining its resolution
        ctx.drawImage(
            img,
            x,
            y,
            finalWidth,
            finalHeight
        );

        // Start with maximum quality
        let quality = settings.quality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Only reduce quality if explicitly set maxFileSizeMB and current size exceeds it
        if (settings.maxFileSizeMB) {
            const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
            while (this.getDataUrlSize(dataUrl) > maxSizeBytes && quality > 0.5) {
                quality -= 0.05;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
        }

        return {
            dataUrl,
            originalSize: file.size,
            processedSize: this.getDataUrlSize(dataUrl),
            width: canvas.width,
            height: canvas.height,
            fileName: file.name,
            quality
        };
    }

    private static loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
        });
    }

    private static getDataUrlSize(dataUrl: string): number {
        const base64 = dataUrl.split(',')[1];
        return Math.floor((base64.length * 3) / 4);
    }
}