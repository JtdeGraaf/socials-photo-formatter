export interface RenderOptions {
    backgroundType?: 'white' | 'blurred';
    enableShadow?: boolean;
}

export class CanvasRenderer {
    static createSquareCanvas(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        return canvas;
    }

    static async renderImageToSquareCanvas(img: HTMLImageElement, options: RenderOptions = {}): Promise<HTMLCanvasElement> {
        const canvasSize = Math.max(img.width, img.height);
        const canvas = this.createSquareCanvas(canvasSize);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Cannot get canvas context');

        const xOffset = (canvas.width - img.width) / 2;
        const yOffset = (canvas.height - img.height) / 2;

        const backgroundType = options.backgroundType || 'white';

        if (backgroundType === 'blurred') {
            const tempCanvas = this.createSquareCanvas(canvas.width);
            const tempCtx = tempCanvas.getContext('2d', { alpha: false });
            if (!tempCtx) throw new Error('Cannot get temp canvas context');

            tempCtx.filter = 'blur(80px)';
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

            ctx.filter = 'blur(80px)';
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.filter = 'none';

            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const shouldApplyShadow = options.enableShadow !== false;

        if (shouldApplyShadow) {
            this.applyShadow(ctx, img, xOffset, yOffset, canvasSize);
        } else {
            ctx.drawImage(img, xOffset, yOffset, img.width, img.height);
        }

        return canvas;
    }

    private static applyShadow(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, canvasSize: number) {
        ctx.save();

        const ambientBlur = Math.round(canvasSize * 0.03);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = ambientBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.drawImage(img, x, y, img.width, img.height);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = Math.round(canvasSize * 0.02);
        ctx.drawImage(img, x, y, img.width, img.height);

        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = Math.round(canvasSize * 0.02);
        ctx.drawImage(img, x, y, img.width, img.height);

        // Final draw to ensure the image is crisp on top of shadows
        ctx.drawImage(img, x, y, img.width, img.height);

        ctx.restore();
    }
}
