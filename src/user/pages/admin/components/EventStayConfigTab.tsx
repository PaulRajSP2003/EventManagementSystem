import React, { useState, useEffect, useContext } from 'react';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { UserAuthContext } from '../../auth/UserAuthContext';
import { fetchEventStayConfig, saveEventStayConfig } from '../../api/RoomData';
import type { EventStayConfig } from '../../api/RoomData';

const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    enabledLabel?: string;
    disabledLabel?: string;
}> = ({ enabled, onChange, enabledLabel = "Auto", disabledLabel = "Manual" }) => (
    <div className="flex items-center space-x-3">
        <span className={`text-sm font-medium ${enabled ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {disabledLabel}
        </span>
        <button
            type="button"
            className={`${enabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            onClick={() => onChange(!enabled)}
        >
            <span
                className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
        <span className={`text-sm font-medium ${enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
            {enabledLabel}
        </span>
    </div>
);

interface EventStayConfigTabProps {
    eventId: number;
    namingOption: 'manual' | 'auto';
    onNamingChange: (option: 'manual' | 'auto') => void;
    onSaveSuccess: () => void;
    onUnsavedChange: (unsaved: boolean) => void;
    resetUnsaved?: boolean;
    onResetAcknowledged?: () => void;
}

const EventStayConfigTab: React.FC<EventStayConfigTabProps> = ({ eventId, namingOption, onNamingChange, onSaveSuccess, onUnsavedChange, resetUnsaved = false, onResetAcknowledged }) => {
    const context = useContext(UserAuthContext);
    if (!context) {
        return <div>Loading...</div>;
    }
    const { user } = context;
    const [config, setConfig] = useState<EventStayConfig>({
        eventId: eventId,
        namingOption: namingOption,
        parentStayMaxAge: 0,
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
        visible: false,
        type: 'success',
        message: '',
    });
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [initialConfig, setInitialConfig] = useState<EventStayConfig | null>(null);

    // Fetch config on mount
    useEffect(() => {
        fetchConfig();
    }, [eventId]);

    // Sync config with namingOption prop
    useEffect(() => {
        setConfig(prev => ({ ...prev, namingOption: namingOption }));
    }, [namingOption]);

    // Detect unsaved changes
    useEffect(() => {
        if (initialConfig === null) {
            setUnsavedChanges(true);
            onUnsavedChange(true);
        } else {
            const unsaved = JSON.stringify(config) !== JSON.stringify(initialConfig);
            setUnsavedChanges(unsaved);
            onUnsavedChange(unsaved);
        }
    }, [config, initialConfig, onUnsavedChange]);

    useEffect(() => {
        if (resetUnsaved && unsavedChanges) {
            setUnsavedChanges(false);
            setInitialConfig({ ...config });
            onUnsavedChange(false);
            onResetAcknowledged?.();
        }
    }, [resetUnsaved, unsavedChanges, config, onUnsavedChange, onResetAcknowledged]);

    const fetchConfig = async () => {
        if (!user?.email) return;
        try {
            const data = await fetchEventStayConfig();
            if (data) {
                setConfig({
                    eventId: eventId,
                    namingOption: data.namingOption || 'auto',
                    parentStayMaxAge: data.parentStayMaxAge || 0,
                });
                setInitialConfig({
                    eventId: eventId,
                    namingOption: data.namingOption || 'auto',
                    parentStayMaxAge: data.parentStayMaxAge || 0,
                });
                setUnsavedChanges(false);
                // Don't update global naming option from fetch
            } else {
                setConfig({
                    eventId: eventId,
                    namingOption: 'auto',
                    parentStayMaxAge: 0,
                });
                // initialConfig remains null, unsaved will be set to true by useEffect
                setUnsavedChanges(true);
                onUnsavedChange(true);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setConfig({
                eventId: eventId,
                namingOption: 'auto',
                parentStayMaxAge: 0,
            });
            setUnsavedChanges(true);
            onUnsavedChange(true);
        }
    };

    const handleSave = async () => {
        if (!user?.email) return;
        setLoading(true);

        // Immediately disable save button and remove dot
        setUnsavedChanges(false);
        onUnsavedChange(false);

        try {
            const result = await saveEventStayConfig(config);
            if (result.success) {
                setAlert({ visible: true, type: 'success', message: 'Configuration saved successfully!' });
                setInitialConfig({ ...config });
                onNamingChange(config.namingOption);
                onSaveSuccess();
            } else {
                // Re-enable if save failed
                setUnsavedChanges(true);
                onUnsavedChange(true);
                setAlert({ visible: true, type: 'error', message: result.message || 'Failed to save configuration.' });
            }
        } catch (error) {
            // Re-enable if save failed
            setUnsavedChanges(true);
            onUnsavedChange(true);
            setAlert({ visible: true, type: 'error', message: 'Error saving configuration.' });
        } finally {
            setLoading(false);
        }
    };

    const handleMaxAgeChange = (value: number) => {
        setConfig(prev => ({ ...prev, parentStayMaxAge: value }));
    };

    return (
        <div className="space-y-6 bg-transparent rounded-xl">
            {/* Header */}
            <div className="flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Event Stay Configuration
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={loading || !unsavedChanges}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <FiSave className="mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Header - Fixed Style */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-6 py-4 border-b border-blue-600">
                    <h3 className="text-lg font-semibold text-white uppercase tracking-tight">Groups Configuration</h3>
                </div>

                <div className="p-6 space-y-8">
                    {/* Naming Option - Now Editable */}
                    <div className="flex items-center justify-between">
                        <div className="max-w-[70%]">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Naming Option
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                {config.namingOption === 'auto'
                                    ? 'Rooms will be automatically named (e.g., M101, F201)'
                                    : 'You can manually name each room'}
                            </p>
                        </div>

                        <ToggleSwitch
                            enabled={config.namingOption === 'auto'}
                            onChange={(enabled) => {
                                const newOption = enabled ? 'auto' : 'manual';
                                setConfig(prev => ({ ...prev, namingOption: newOption }));
                                // Don't call onNamingChange here to prevent immediate renaming
                            }}
                            enabledLabel="Auto"
                            disabledLabel="Manual"
                        />
                    </div>

                    {/* Max Age Section - Remains Interactive */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Max Age Limit
                            </label>
                            <p className="text-xs text-gray-400">Age threshold for leader assignment</p>
                        </div>
                        <div className="relative flex items-center gap-3">
                            <input
                                type="number"
                                value={config.parentStayMaxAge}
                                onChange={(e) => handleMaxAgeChange(parseInt(e.target.value) || 0)}
                                className="w-20 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800 focus:outline-none"
                                min="0"
                            />
                            <span className="text-xs font-bold text-gray-400 uppercase">Years</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
            {alert.visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            {alert.type === 'success' && <FiCheckCircle className="text-green-500" size={24} />}
                            {alert.type === 'error' && <FiAlertCircle className="text-red-500" size={24} />}
                            {alert.type === 'warning' && <FiAlertCircle className="text-yellow-500" size={24} />}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                {alert.type}
                            </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{alert.message}</p>
                        <button
                            onClick={() => setAlert({ ...alert, visible: false })}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventStayConfigTab;
