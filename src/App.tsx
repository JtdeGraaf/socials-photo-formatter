import { useState } from 'react'
import './App.css'
import { ImageUploader } from './components/ImageUploader'
import { ImageProcessor } from './components/ImageProcessor'

function App() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        setSelectedImage(file);
    };

    const handleProcessedImage = (dataUrl: string) => {
        setProcessedImage(dataUrl);
    };

    const handleDownload = () => {
        if (processedImage) {
            const link = document.createElement('a');
            link.href = processedImage;
            link.download = 'instagram-formatted.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="app">
            <h1>Instagram Photo Formatter</h1>
            <ImageUploader onImageUpload={handleImageUpload} />
            <ImageProcessor image={selectedImage} onProcessed={handleProcessedImage} />

            {processedImage && (
                <div className="result-container">
                    <img
                        src={processedImage}
                        alt="Processed"
                        className="preview-image"
                    />
                    <button onClick={handleDownload} className="download-button">
                        Download
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;