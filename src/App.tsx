import { useState } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { ProcessingSettings } from './components/ProcessingSettings'
import { ImageProcessingService, type ProcessingOptions, type ProcessedImage } from './services/ImageProcessingService'
import {
    Container,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    LinearProgress,
    Paper,
    Stack,
    Chip
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { CloudDownload, Delete as DeleteIcon } from '@mui/icons-material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    const [images, setImages] = useState<{ original: File; processed?: ProcessedImage }[]>([]);
    const [processing, setProcessing] = useState(false);
    const [settings, setSettings] = useState<ProcessingOptions>({
        maxFileSizeMB: 8,
        preserveOriginalSize: true
    });


    const handleImagesUpload = async (files: File[]) => {
        setProcessing(true);

        const newImages = files.map(file => ({ original: file }));
        setImages(prev => [...prev, ...newImages]);

        try {
            const processed = await Promise.all(
                files.map(async (file) => {
                    const processedImage = await ImageProcessingService.processImage(file, settings);
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

    const handleReprocessAll = async () => {
        setProcessing(true);
        try {
            const reprocessed = await Promise.all(
                images.map(async (img) => ({
                    original: img.original,
                    processed: await ImageProcessingService.processImage(img.original, settings)
                }))
            );
            setImages(reprocessed);
        } catch (error) {
            console.error('Error reprocessing images:', error);
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


    const handleDeleteImage = (indexToDelete: number) => {
        setImages(images.filter((_, index) => index !== indexToDelete));
    };

    const handleDeleteAll = () => {
        setImages([]);
    };


    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="lg">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom align="center">
                        Instagram Photo Formatter
                    </Typography>

                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <ProcessingSettings
                            settings={settings}
                            onSettingsChange={(newSettings) => {
                                setSettings(newSettings);
                                if (images.length > 0) {
                                    handleReprocessAll();
                                }
                            }}
                            disabled={processing}
                        />
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <ImageUploader onImagesUpload={handleImagesUpload} />
                    </Paper>

                    {processing && <LinearProgress sx={{ my: 2 }} />}

                    {images.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h5">
                                    Processed Images ({getProcessedImagesCount()}/{images.length})
                                </Typography>
                                <Stack direction="row" spacing={2}>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleDeleteAll}
                                    disabled={processing}
                                >
                                    Delete All
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<CloudDownload />}
                                    onClick={handleDownloadAll}
                                    disabled={processing || getProcessedImagesCount() === 0}
                                >
                                    Download All
                                </Button>
                                </Stack>
                            </Stack>

                            <Grid container spacing={3}>
                                {images.map((img, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card sx={{ position: 'relative' }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteImage(index)}
                                                sx={{
                                                    position: 'absolute',
                                                    right: 8,
                                                    top: 8,
                                                    zIndex: 2,
                                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                    }
                                                }}
                                                disabled={processing}
                                            >
                                                <CloseIcon />
                                            </IconButton>

                                            {img.processed ? (
                                                <>
                                                    <Box sx={{
                                                        pt: '100%',
                                                        position: 'relative',
                                                        backgroundColor: '#f5f5f5'
                                                    }}>
                                                        <Box
                                                            component="img"
                                                            src={img.processed.dataUrl}
                                                            alt={`Processed ${img.processed.fileName}`}
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'contain'
                                                            }}
                                                        />
                                                    </Box>
                                                    <CardContent>
                                                        <Typography variant="subtitle1" noWrap>
                                                            {img.processed.fileName}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {img.processed.width}x{img.processed.height}px
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                            <Chip
                                                                label={`Original: ${(img.processed.originalSize / 1024 / 1024).toFixed(2)}MB`}
                                                                size="small"
                                                            />
                                                            <Chip
                                                                label={`Processed: ${(img.processed.processedSize / 1024 / 1024).toFixed(2)}MB`}
                                                                size="small"
                                                                color={img.processed.wasCompressed ? "warning" : "default"}
                                                            />
                                                        </Stack>
                                                    </CardContent>
                                                    <CardActions>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            startIcon={<CloudDownload />}
                                                            onClick={() => img.processed && handleDownload(img.processed)}
                                                        >
                                                            Download
                                                        </Button>
                                                    </CardActions>
                                                </>
                                            ) : (
                                                <CardContent>
                                                    <Box sx={{ p: 3 }}>
                                                        <LinearProgress />
                                                        <Typography sx={{ mt: 2 }} align="center">
                                                            Processing...
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            )}
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Container>
        </ThemeProvider>
    );

}

export default App;