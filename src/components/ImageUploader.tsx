import React, { type ChangeEvent, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    styled,
    type Theme
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface ImageUploaderProps {
    onImagesUpload: (files: File[]) => void;
}

interface UploadZoneProps {
    isDragActive: boolean;
    theme?: Theme;
}

const UploadZone = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'isDragActive'
})<UploadZoneProps>(({ theme, isDragActive }) => ({
    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(6),
    cursor: 'pointer',
    backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'background-color'], {
        duration: theme.transitions.duration.short,
    }),
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.primary.main,
    },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
}));


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
        <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{ width: '100%' }}
        >
            <input
                type="file"
                id="image-input"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
                multiple
            />
            <label htmlFor="image-input" style={{ width: '100%', display: 'block' }}>
                <UploadZone isDragActive={dragActive} elevation={0}>
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Drag and drop your images here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ my: 1 }}>
                        or
                    </Typography>
                    <Button variant="contained" component="span">
                        Choose files
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                        You can select multiple images
                    </Typography>
                </UploadZone>
            </label>
        </Box>
    );
};