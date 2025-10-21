import React, {type ChangeEvent, useState } from 'react';

interface ImageUploaderProps {
    onImagesUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUpload }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.type.startsWith('image/')
        );
        if (files.length > 0) {
            onImagesUpload(files);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(
                file => file.type.startsWith('image/')
            );
            onImagesUpload(files);
        }
    };

    return (
        <div
            className={`upload-container ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="image-input"
                accept="image/*"
                onChange={handleChange}
                className="file-input"
                multiple
            />
            <label htmlFor="image-input" className="upload-label">
                <div>
                    <p>Drag and drop your images here or</p>
                    <button type="button">Choose files</button>
                    <p className="upload-hint">You can select multiple images</p>
                </div>
            </label>
        </div>
    );
};