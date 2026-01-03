import { FileUtils } from './FileUtils';

export class Compressor {
    static async compressCanvasToDataUrl(canvas: HTMLCanvasElement, maxFileSizeMB?: number): Promise<{ dataUrl: string; wasCompressed: boolean; }>{
        let dataUrl: string;
        let wasCompressed = false;

        if (maxFileSizeMB) {
            let quality = 0.92;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            let currentSize = FileUtils.getDataUrlSize(dataUrl);
            const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

            while (currentSize > maxSizeBytes && quality > 0.5) {
                wasCompressed = true;
                quality -= 0.05;
                await new Promise((r) => setTimeout(r, 0));
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                currentSize = FileUtils.getDataUrlSize(dataUrl);
            }
        } else {
            const isVeryLarge = canvas.width * canvas.height > 4096 * 4096;
            if (isVeryLarge) {
                dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            } else {
                dataUrl = canvas.toDataURL('image/png');
            }
        }

        return { dataUrl, wasCompressed };
    }
}

