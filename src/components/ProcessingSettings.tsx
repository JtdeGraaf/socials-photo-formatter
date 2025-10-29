
import React from 'react';
import {
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Paper,
    TextField,
    InputAdornment,
    RadioGroup,
    Radio,
    FormControl,
    FormLabel
} from '@mui/material';
import { type ProcessingOptions } from '../services/ImageProcessingService';

interface ProcessingSettingsProps {
    settings: ProcessingOptions;
    onSettingsChange: (settings: ProcessingOptions) => void;
    disabled?: boolean;
}

export const ProcessingSettings: React.FC<ProcessingSettingsProps> = ({
                                                                          settings,
                                                                          onSettingsChange,
                                                                          disabled = false
                                                                      }) => {
    const handleCompressionToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({
            ...settings,
            maxFileSizeMB: event.target.checked ? 8 : undefined
        });
    };

    const handleShadowToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({
            ...settings,
            enableShadow: event.target.checked
        });
    };

    const handleBackgroundTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({
            ...settings,
            backgroundType: event.target.value as 'white' | 'blurred'
        });
    };

    const handleSizeLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        onSettingsChange({
            ...settings,
            maxFileSizeMB: !isNaN(value) && value > 0 ? value : undefined
        });
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Processing Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.enableShadow !== false}
                            onChange={handleShadowToggle}
                            disabled={disabled}
                        />
                    }
                    label="Enable shadow effect"
                />

                <FormControl component="fieldset">
                    <FormLabel component="legend">Background Type</FormLabel>
                    <RadioGroup
                        row
                        value={settings.backgroundType || 'white'}
                        onChange={handleBackgroundTypeChange}
                    >
                        <FormControlLabel
                            value="white"
                            control={<Radio />}
                            label="White"
                            disabled={disabled}
                        />
                        <FormControlLabel
                            value="blurred"
                            control={<Radio />}
                            label="Blurred Image"
                            disabled={disabled}
                        />
                    </RadioGroup>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.maxFileSizeMB !== undefined}
                                onChange={handleCompressionToggle}
                                disabled={disabled}
                            />
                        }
                        label="Enable compression"
                    />

                    {settings.maxFileSizeMB !== undefined && (
                        <TextField
                            type="number"
                            size="small"
                            label="Size limit"
                            value={settings.maxFileSizeMB}
                            onChange={handleSizeLimitChange}
                            disabled={disabled}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">MB</InputAdornment>,
                            }}
                            inputProps={{
                                min: 0.1,
                                step: 0.1
                            }}
                            sx={{ width: 150 }}
                        />
                    )}
                </Box>
            </Box>
        </Paper>
    );
};