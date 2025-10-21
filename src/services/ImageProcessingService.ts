export interface ProcessingOptions {
    maxFileSizeMB?: number;  // undefined means no compression
    preserveOriginalSize: boolean;
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
    private static DEFAULT_OPTIONS: ProcessingOptions = {
        maxFileSizeMB: 8,  // Instagram's limit
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

        if (settings.preserveOriginalSize) {
            // Keep original dimensions
            finalWidth = img.width;
            finalHeight = img.height;
        } else {
            // Scale to 1080px minimum
            const aspectRatio = img.width / img.height;
            if (aspectRatio > 1) {
                finalHeight = 1080;
                finalWidth = Math.round(1080 * aspectRatio);
            } else {
                finalWidth = 1080;
                finalHeight = Math.round(1080 / aspectRatio);
            }
        }

        // Make the canvas big enough for the image and padding
        const maxSide = Math.max(finalWidth, finalHeight);
        canvas.width = maxSide;
        canvas.height = maxSide;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center the image
        const x = (maxSide - finalWidth) / 2;
        const y = (maxSide - finalHeight) / 2;

        // Draw image
        ctx.drawImage(
            img,
            x,
            y,
            finalWidth,
            finalHeight
        );

        let dataUrl: string;
        let wasCompressed = false;

        if (settings.maxFileSizeMB) {
            // Start with maximum quality
            let quality = 1.0;
            dataUrl = canvas.toDataURL('image/jpeg', quality);

            // Reduce quality only if needed
            const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
            while (this.getDataUrlSize(dataUrl) > maxSizeBytes && quality > 0.5) {
                wasCompressed = true;
                quality -= 0.05;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
        } else {
            // No compression, use PNG for maximum quality
            dataUrl = canvas.toDataURL('image/png');
        }

        return {
            dataUrl,
            originalSize: file.size,
            processedSize: this.getDataUrlSize(dataUrl),
            width: canvas.width,
            height: canvas.height,
            fileName: file.name,
            wasCompressed
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