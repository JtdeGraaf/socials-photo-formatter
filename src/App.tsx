
import { useState } from 'react'
import './App.css'
import { ImageUploader } from './components/ImageUploader'
import {ImageProcessingService, type ProcessedImage} from "./services/ImageProcessingService.ts";


function App() {
    const [images, setImages] = useState<{ original: File; processed?: ProcessedImage }[]>([]);
    const [processing, setProcessing] = useState(false);

    const handleImagesUpload = async (files: File[]) => {
        setProcessing(true);

        const newImages = files.map(file => ({ original: file }));
        setImages(prev => [...prev, ...newImages]);

        try {
            const processed = await Promise.all(
                files.map(async (file) => {
                    const processedImage = await ImageProcessingService.processImage(file);
                    return { original: file, processed: processedImage };
                })
            );

            setImages(prev => {
                const existing = prev.filter(
                    img => !files.includes(img.original)
                );
                return [...existing, ...processed];
            });
        } catch (error) {
            console.error('Error processing images:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = (processedImage: ProcessedImage) => {
        const link = document.createElement('a');
        link.href = processedImage.dataUrl;
        link.download = `instagram-${processedImage.fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        images.forEach(img => {
            if (img.processed) {
                handleDownload(img.processed);
            }
        });
    };

    const getProcessedImagesCount = () =>
        images.filter(img => img.processed).length;

    return (
        <div className="app">
            <h1>Instagram Photo Formatter</h1>
            <div className="info-box">
                <h3>Processing Settings:</h3>
                <ul>
                    <li>Preserves original resolution if larger than 1080px</li>
                    <li>Maintains maximum possible quality</li>
                    <li>Only compresses if exceeding Instagram's 8MB limit</li>
                    <li>Adds white padding to make square format</li>
                </ul>
            </div>
            <ImageUploader onImagesUpload={handleImagesUpload} />


            {processing && <div className="processing">Processing images...</div>}

            {images.length > 0 && (
                <div className="results-container">
                    <div className="results-header">
                        <h2>
                            Processed Images ({getProcessedImagesCount()}/{images.length})
                        </h2>
                        <button
                            onClick={handleDownloadAll}
                            className="download-all-button"
                            disabled={processing || getProcessedImagesCount() === 0}
                        >
                            Download All
                        </button>
                    </div>

                    <div className="image-grid">
                        {images.map((img, index) => (
                            <div key={index} className="image-item">
                                {img.processed ? (
                                    <>
                                        <img
                                            src={img.processed.dataUrl}
                                            alt={`Processed ${img.processed.fileName}`}
                                            className="preview-image"
                                        />
                                        <div className="image-info">
                                            <p>{img.processed.fileName}</p>
                                            <p>Dimensions: {img.processed.width}x{img.processed.height}px</p>
                                            <p>Original: {(img.processed.originalSize / 1024 / 1024).toFixed(2)}MB</p>
                                            <p>Processed: {(img.processed.processedSize / 1024 / 1024).toFixed(2)}MB</p>
                                            <p>Quality: {Math.round(img.processed.quality * 100)}%</p>
                                        </div>
                                        <button
                                            onClick={() => img.processed && handleDownload(img.processed)}
                                            className="download-button"
                                        >
                                            Download
                                        </button>
                                    </>
                                ) : (
                                    <div className="processing-placeholder">
                                        Processing...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;