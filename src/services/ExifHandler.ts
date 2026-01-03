import piexif, { type PiexifData } from 'piexifjs';
import { FileUtils } from './FileUtils';

export class ExifHandler {
    static async loadExifFromFile(file: File): Promise<PiexifData | null> {
        try {
            const dataUrl = await FileUtils.readFileAsDataUrl(file);
            if (dataUrl && (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg'))) {
                try {
                    return piexif.load(dataUrl);
                } catch {
                    return null;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    static insertExifIntoDataUrl(exifObject: PiexifData | null, dataUrl: string): string {
        if (!exifObject) return dataUrl;
        if (!(dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg'))) return dataUrl;
        try {
            return piexif.insert(piexif.dump(exifObject), dataUrl);
        } catch {
            return dataUrl;
        }
    }
}

