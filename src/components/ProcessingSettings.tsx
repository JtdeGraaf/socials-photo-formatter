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
    const handleCompressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const useCompression = e.target.checked;
        onSettingsChange({
            ...settings,
            maxFileSizeMB: useCompression ? 8 : undefined
        });
    };

    const handleMaxSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        onSettingsChange({
            ...settings,
            maxFileSizeMB: value
        });
    };

    const handlePreserveSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({
            ...settings,
            preserveOriginalSize: e.target.checked
        });
    };

    return (
        <div className="processing-settings">
            <h3>Processing Settings</h3>
            <div className="settings-grid">
                <div className="setting-group">
                    <div className="setting-item checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.maxFileSizeMB !== undefined}
                                onChange={handleCompressionChange}
                                disabled={disabled}
                            />
                            Enable Size Limit
                        </label>
                    </div>

                    {settings.maxFileSizeMB !== undefined && (
                        <div className="setting-item size-limit">
                            <label htmlFor="maxSize">Maximum Size (MB):</label>
                            <input
                                type="number"
                                id="maxSize"
                                value={settings.maxFileSizeMB}
                                onChange={handleMaxSizeChange}
                                min={1}
                                max={20}
                                step={0.5}
                                disabled={disabled}
                            />
                            <small>Instagram limit is 8MB</small>
                        </div>
                    )}
                </div>

                <div className="setting-item checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.preserveOriginalSize}
                            onChange={handlePreserveSize}
                            disabled={disabled}
                        />
                        Keep Original Resolution
                    </label>
                    <small>Preserve original image dimensions</small>
                </div>
            </div>
        </div>
    );
};