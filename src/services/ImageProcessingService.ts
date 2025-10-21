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
    static async processImage(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        const settings = { ...options };

        // First, let's create an object URL and load the image to get its dimensions
        const img = await this.loadImage(file);


        // Create canvas at the same size as the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d', {
            alpha: false  // Disable alpha channel since we don't need it
        });
        if (!ctx) throw new Error('Cannot get canvas context');

        // Draw directly without any padding
        ctx.drawImage(img, 0, 0, img.width, img.height);

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