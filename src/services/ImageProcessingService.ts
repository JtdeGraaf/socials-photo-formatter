export interface ProcessingOptions {
    targetSize: number;
    quality: number;
    maxFileSizeMB?: number;
}

export interface ProcessedImage {
    dataUrl: string;
    originalSize: number;
    processedSize: number;
    width: number;
    height: number;
    fileName: string;
}

export class ImageProcessingService {
    private static DEFAULT_OPTIONS: ProcessingOptions = {
        targetSize: 1080,
        quality: 0.9,
        maxFileSizeMB: 8 // Instagram's limit is 8MB
    };

    static async processImage(
        file: File,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ProcessedImage> {
        const settings = { ...this.DEFAULT_OPTIONS, ...options };

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Cannot get canvas context');
        }

        // Load image
        const img = await this.loadImage(file);

        // Set canvas size
        canvas.width = settings.targetSize;
        canvas.height = settings.targetSize;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling and positioning
        const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
        );

        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        // Draw image
        ctx.drawImage(
            img,
            x,
            y,
            img.width * scale,
            img.height * scale
        );

        // Convert to data URL
        let quality = settings.quality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Reduce quality if size exceeds max file size
        if (settings.maxFileSizeMB) {
            const maxSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
            while (this.getDataUrlSize(dataUrl) > maxSizeBytes && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
        }

        return {
            dataUrl,
            originalSize: file.size,
            processedSize: this.getDataUrlSize(dataUrl),
            width: settings.targetSize,
            height: settings.targetSize,
            fileName: file.name
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