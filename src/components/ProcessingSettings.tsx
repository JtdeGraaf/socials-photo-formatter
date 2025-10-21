
import React from 'react';
import type {ProcessingOptions} from '../services/ImageProcessingService';

interface ProcessingSettingsProps {
    settings: ProcessingOptions;
    onSettingsChange: (settings: ProcessingOptions) => void;
    disabled: boolean;
}

export const ProcessingSettings: React.FC<ProcessingSettingsProps> = ({
                                                                          settings,
                                                                          onSettingsChange,
                                                                          disabled
                                                                      }) => {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        let parsedValue: string | number | boolean = value;

        if (type === 'number') {
            parsedValue = parseFloat(value);
        } else if (type === 'checkbox') {
            parsedValue = (e.target as HTMLInputElement).checked;
        }

        onSettingsChange({
            ...settings,
            [name]: parsedValue
        });
    };

    return (
        <div className="processing-settings">
            <h3>Processing Settings</h3>
            <div className="settings-grid">
                <div className="setting-item">
                    <label htmlFor="minSize">Minimum Size (px)</label>
                    <input
                        type="number"
                        id="minSize"
                        name="minSize"
                        value={settings.minSize}
                        onChange={handleChange}
                        min={320}
                        max={2048}
                        disabled={disabled}
                    />
                    <small>Minimum size for the shortest side (320-2048px)</small>
                </div>

                <div className="setting-item">
                    <label htmlFor="quality">Initial Quality</label>
                    <input
                        type="number"
                        id="quality"
                        name="quality"
                        value={settings.quality}
                        onChange={handleChange}
                        min={0.5}
                        max={1}
                        step={0.1}
                        disabled={disabled}
                    />
                    <small>Initial JPEG quality (0.5-1.0)</small>
                </div>

                <div className="setting-item">
                    <label htmlFor="maxFileSizeMB">Max File Size (MB)</label>
                    <input
                        type="number"
                        id="maxFileSizeMB"
                        name="maxFileSizeMB"
                        value={settings.maxFileSizeMB}
                        onChange={handleChange}
                        min={1}
                        max={20}
                        disabled={disabled}
                    />
                    <small>Maximum file size in MB (Instagram limit: 8MB)</small>
                </div>

                <div className="setting-item checkbox">
                    <label>
                        <input
                            type="checkbox"
                            name="preserveOriginalSize"
                            checked={settings.preserveOriginalSize}
                            onChange={handleChange}
                            disabled={disabled}
                        />
                        Preserve Original Size
                    </label>
                    <small>Keep original dimensions if larger than minimum size</small>
                </div>
            </div>
        </div>
    );
};