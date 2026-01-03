import { ProcessingQueue } from './ProcessingQueue';
import { FileUtils } from './FileUtils';
import { ExifHandler } from './ExifHandler';
import { CanvasRenderer, type RenderOptions } from './CanvasRenderer';
import { Compressor } from './Compressor';
import type { PiexifData } from 'piexifjs';

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
        const settings = { ...options } as ProcessingOptions;

        // Give the browser a chance to update before heavy work
        await new Promise((r) => setTimeout(r, 0));

        // Extract EXIF (File metadata) if present
        const exifObject: PiexifData | null = await ExifHandler.loadExifFromFile(file);

        // Load image and render to canvas
        const img = await FileUtils.loadImage(file);
        const canvas = await CanvasRenderer.renderImageToSquareCanvas(img, {
            backgroundType: settings.backgroundType,
            enableShadow: settings.enableShadow
        } as RenderOptions);

        // Compress/encode the canvas into a data URL
        const { dataUrl, wasCompressed } = await Compressor.compressCanvasToDataUrl(canvas, settings.maxFileSizeMB);

        // Re-insert EXIF if appropriate
        const finalDataUrl = ExifHandler.insertExifIntoDataUrl(exifObject, dataUrl);

        return {
            dataUrl: finalDataUrl,
            originalSize: file.size,
            processedSize: FileUtils.getDataUrlSize(finalDataUrl),
            width: canvas.width,
            height: canvas.height,
            fileName: file.name,
            wasCompressed
        };
    }
}