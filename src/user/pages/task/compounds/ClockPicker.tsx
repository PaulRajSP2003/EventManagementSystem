import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiPlus, FiMinus } from 'react-icons/fi';

interface ClockPickerProps {
    value: { hour: number; minute: number } | null;
    onChange: (time: { hour: number; minute: number }) => void;
    pickerTitle?: string;
    minTime?: { hour: number; minute: number };
    maxTime?: { hour: number; minute: number };
    disabled?: boolean;
}

// Time period definitions with colors and labels
const TIME_PERIODS = [
    {
        name: 'Early Morning',
        color: '#4B6CB7',
        bgColor: 'bg-[#4B6CB7]',
        textColor: 'text-white',
        start: { hour: 0, minute: 0 },
        end: { hour: 5, minute: 59 }
    },
    {
        name: 'Late Morning',
        color: '#FFF9C4',
        bgColor: 'bg-[#FFF9C4]',
        textColor: 'text-slate-800',
        start: { hour: 6, minute: 0 },
        end: { hour: 11, minute: 59 }
    },
    {
        name: 'Noon',
        color: '#FFB74D',
        bgColor: 'bg-[#FFB74D]',
        textColor: 'text-white',
        start: { hour: 12, minute: 0 },
        end: { hour: 12, minute: 59 }
    },
    {
        name: 'Afternoon',
        color: '#81D4FA',
        bgColor: 'bg-[#81D4FA]',
        textColor: 'text-slate-800',
        start: { hour: 13, minute: 0 },
        end: { hour: 16, minute: 59 }
    },
    {
        name: 'Evening',
        color: '#FF8A65',
        bgColor: 'bg-[#FF8A65]',
        textColor: 'text-white',
        start: { hour: 17, minute: 0 },
        end: { hour: 20, minute: 59 }
    },
    {
        name: 'Night',
        color: '#121212',
        bgColor: 'bg-[#121212]',
        textColor: 'text-white',
        start: { hour: 21, minute: 0 },
        end: { hour: 23, minute: 59 }
    }
];

const ClockPicker: React.FC<ClockPickerProps> = ({ value, onChange, pickerTitle, minTime, maxTime, disabled = false }) => {
    const [showClock, setShowClock] = useState(false);
    const [selectedHour, setSelectedHour] = useState(value?.hour || 7);
    const [selectedMinute, setSelectedMinute] = useState(value?.minute || 0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
        value?.hour ? (value.hour >= 12 ? 'PM' : 'AM') : 'AM'
    );
    const [tempHour, setTempHour] = useState(selectedHour % 12 || 12); // Convert to 12-hour format
    const clockRef = useRef<HTMLDivElement>(null);

    // Get current time period based on hour
    const getCurrentTimePeriod = (hour: number) => {
        return TIME_PERIODS.find(period =>
            hour >= period.start.hour && hour <= period.end.hour
        ) || TIME_PERIODS[0];
    };

    const currentPeriod = value ? getCurrentTimePeriod(value.hour) : null;

    // Initialize or reset clock when opening
    useEffect(() => {
        if (showClock) {
            if (value) {
                setSelectedHour(value.hour);
                setSelectedMinute(value.minute);
                setSelectedPeriod(value.hour >= 12 ? 'PM' : 'AM');
                setTempHour(value.hour % 12 || 12);
            } else {
                const now = new Date();
                const curHour = now.getHours();
                const curMin = now.getMinutes();
                setSelectedHour(curHour);
                setSelectedMinute(curMin);
                setSelectedPeriod(curHour >= 12 ? 'PM' : 'AM');
                setTempHour(curHour % 12 || 12);
            }
        }
    }, [showClock, value]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clockRef.current && !clockRef.current.contains(event.target as Node)) {
                setShowClock(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHourSelect = (hour: number) => {
        setTempHour(hour);
        // Convert to 24-hour format for storage
        let convertedHour = hour;
        if (selectedPeriod === 'PM' && hour !== 12) convertedHour = hour + 12;
        if (selectedPeriod === 'AM' && hour === 12) convertedHour = 0;
        setSelectedHour(convertedHour);
    };

    const handlePeriodChange = (period: 'AM' | 'PM') => {
        setSelectedPeriod(period);
        // Adjust hour based on period
        let newHour = tempHour;
        if (period === 'PM' && tempHour !== 12) newHour = tempHour + 12;
        if (period === 'AM' && tempHour === 12) newHour = 0;
        if (period === 'AM' && tempHour !== 12) newHour = tempHour;
        if (period === 'PM' && tempHour === 12) newHour = 12;
        setSelectedHour(newHour);
    };

    const handleConfirm = () => {
        onChange({ hour: selectedHour, minute: selectedMinute });
        setShowClock(false);
    };

    const handleCancel = () => {
        // Reset to original value
        if (value) {
            setSelectedHour(value.hour);
            setSelectedMinute(value.minute);
            setSelectedPeriod(value.hour >= 12 ? 'PM' : 'AM');
            setTempHour(value.hour % 12 || 12);
        }
        setShowClock(false);
    };

    // Clock numbers (1-12)
    const clockNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    // Calculate positions for clock numbers (270° offset to start at 12 at top)
    const getPosition = (index: number) => {
        const angle = (index * 30 - 90) * (Math.PI / 180); // -90 to start at top (12)
        const radius = 110; // Radius for number positions
        const centerX = 140;
        const centerY = 140;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { x, y };
    };

    // Calculate hand position
    const getHandPosition = () => {
        const hourAngle = (tempHour % 12) * 30 + (selectedMinute / 60) * 30;
        const minuteAngle = selectedMinute * 6;
        return { hour: hourAngle, minute: minuteAngle };
    };

    const handAngles = getHandPosition();

    const formatTime = (time: { hour: number; minute: number } | null | undefined) => {
        if (!time) return 'Select Time...';
        const hours = time.hour % 12 || 12;
        const minutes = time.minute.toString().padStart(2, '0');
        const period = time.hour >= 12 ? 'PM' : 'AM';
        return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
    };

    const formatDisplayTime = () => formatTime(value);

    const isInvalidTime = React.useMemo(() => {
        if (minTime) {
            if (selectedHour < minTime.hour) return true;
            if (selectedHour === minTime.hour && selectedMinute < minTime.minute) return true;
        }
        if (maxTime) {
            if (selectedHour > maxTime.hour) return true;
            if (selectedHour === maxTime.hour && selectedMinute > maxTime.minute) return true;
        }
        return false;
    }, [selectedHour, selectedMinute, minTime, maxTime]);

    return (
        <div className="relative" ref={clockRef}>
            {/* Time Input Button */}
            <button
                type="button"
                onClick={() => !disabled && setShowClock(!showClock)}
                disabled={disabled}
                className={`
                    w-full px-5 py-4 bg-white border-2 rounded-2xl flex items-center justify-between
                    text-sm font-medium transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' :
                        showClock
                            ? 'border-indigo-300 bg-indigo-50/30 shadow-lg shadow-indigo-100'
                            : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10'
                    }
                    focus:outline-none focus:ring-4 focus:ring-indigo-500/10
                    group
                `}
            >
                <div className="flex items-center gap-3">
                    <FiClock className={`
                        w-5 h-5 transition-colors
                        ${value ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'}
                    `} />
                    <span className={`
                        font-semibold
                        ${value ? 'text-slate-800' : 'text-slate-400'}
                    `}>
                        {formatDisplayTime()}
                    </span>
                </div>

                {value && currentPeriod && (
                    <div className="flex items-center gap-2">
                        <span
                            className={`
                                text-[10px] font-bold px-2 py-1 rounded-full
                                ${currentPeriod.bgColor} ${currentPeriod.textColor}
                            `}
                        >
                            {currentPeriod.name}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full">
                            {value.hour >= 12 ? 'PM' : 'AM'}
                        </span>
                    </div>
                )}
            </button>

            {/* Clock Picker Modal */}
            {showClock && (
                <>
                    {/* Backdrop for all screens */}
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[160]" onClick={handleCancel} />

                    {/* Clock Interface */}
                    <div className="
                        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[170] 
                        bg-white rounded-3xl shadow-2xl border border-slate-100 
                        p-6 w-[380px]
                        animate-in zoom-in-95 duration-200
                    ">
                        {/* Header - SELECT TIME */}
                        <div className="text-center mb-4 flex flex-col items-center">
                            {pickerTitle && (
                                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                                    {pickerTitle}
                                </h3>
                            )}
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                SELECT TIME
                            </h3>
                        </div>

                        {/* Digital Display with Period Name */}
                        <div className="text-center mb-2 flex items-center justify-center gap-1 mt-4">
                            <div className="flex items-baseline">
                                <span
                                    onClick={() => handleHourSelect((tempHour % 12) + 1 || 1)}
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        const delta = e.deltaY > 0 ? -1 : 1;
                                        const newHour = ((tempHour - 1 + delta + 12) % 12) + 1;
                                        handleHourSelect(newHour);
                                    }}
                                    className="text-5xl font-black text-slate-800 hover:text-indigo-600 hover:bg-slate-50 px-2 rounded-2xl transition-all cursor-ns-resize select-none"
                                    title="Click or Scroll to change hour"
                                >
                                    {tempHour.toString().padStart(2, '0')}
                                </span>
                                <span className="text-4xl font-black text-slate-300 mx-1">:</span>
                                <span
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        const delta = e.deltaY > 0 ? -1 : 1;
                                        setSelectedMinute(prev => (prev + delta + 60) % 60);
                                    }}
                                    className="text-5xl font-black text-slate-800 hover:text-indigo-600 hover:bg-slate-50 px-2 rounded-2xl transition-all cursor-ns-resize select-none"
                                    title="Scroll to change minute"
                                >
                                    {selectedMinute.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handlePeriodChange(selectedPeriod === 'AM' ? 'PM' : 'AM')}
                                className="ml-4 text-xl font-black text-indigo-500 hover:bg-indigo-50 px-3 py-1 rounded-xl transition-all cursor-pointer select-none"
                                title="Click to toggle AM/PM"
                            >
                                {selectedPeriod}
                            </button>
                        </div>

                        {/* Current Time Period Display */}
                        <div className="flex justify-center mb-4">
                            <div
                                className={`
                                    px-4 py-1 rounded-full text-sm font-bold
                                    ${getCurrentTimePeriod(selectedHour).bgColor} 
                                    ${getCurrentTimePeriod(selectedHour).textColor}
                                `}
                            >
                                {getCurrentTimePeriod(selectedHour).name}
                            </div>
                        </div>

                        {/* AM/PM Toggle */}
                        <div className="flex justify-center gap-2 mb-8">
                            {(['AM', 'PM'] as const).map(period => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => handlePeriodChange(period)}
                                    className={`
                                        px-6 py-2 rounded-xl text-sm font-bold transition-all
                                        ${selectedPeriod === period
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }
                                    `}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>

                        {/* Analog Clock Face */}
                        <div className="relative w-[280px] h-[280px] mx-auto mb-8">
                            {/* Clock Circle */}
                            <div className="absolute inset-0 bg-slate-50 rounded-full border-4 border-slate-200">
                                {/* Hour Hand */}
                                <div
                                    className="absolute left-1/2 w-1 h-16 bg-slate-800 rounded-full"
                                    style={{
                                        transform: `translateX(-50%) rotate(${handAngles.hour}deg)`,
                                        transformOrigin: '50% 100%',
                                        bottom: '50%',
                                        top: 'auto'
                                    }}
                                />

                                {/* Minute Hand */}
                                <div
                                    className="absolute left-1/2 w-0.5 h-20 bg-indigo-600 rounded-full"
                                    style={{
                                        transform: `translateX(-50%) rotate(${handAngles.minute}deg)`,
                                        transformOrigin: '50% 100%',
                                        bottom: '50%',
                                        top: 'auto'
                                    }}
                                />

                                {/* Center Dot */}
                                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white" />
                            </div>

                            {/* Clock Numbers */}
                            {clockNumbers.map((num, index) => {
                                const pos = getPosition(index);
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleHourSelect(num)}
                                        className={`
                                            absolute w-8 h-8 rounded-full flex items-center justify-center
                                            text-sm font-bold transition-all
                                            transform -translate-x-1/2 -translate-y-1/2
                                            ${tempHour === num
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                                                : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                                            }
                                        `}
                                        style={{
                                            left: `${pos.x}px`,
                                            top: `${pos.y}px`
                                        }}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Minute Controls */}
                        <div className="flex justify-center flex-wrap gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setSelectedMinute(p => (p - 1 + 60) % 60)}
                                className="w-10 flex items-center justify-center py-2 rounded-xl transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600"
                            >
                                <FiMinus className="w-4 h-4" />
                            </button>

                            <div className="flex gap-2">
                                {[0, 15, 30, 45].map(minute => (
                                    <button
                                        key={minute}
                                        type="button"
                                        onClick={() => setSelectedMinute(minute)}
                                        className={`
                                            w-10 py-2 rounded-xl text-xs font-bold transition-all
                                            ${selectedMinute === minute
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }
                                        `}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedMinute(p => (p + 1) % 60)}
                                className="w-10 flex items-center justify-center py-2 rounded-xl transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600"
                            >
                                <FiPlus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Error Message */}
                        {isInvalidTime && (
                           <div className="text-center mb-4 text-xs font-bold text-rose-500 bg-rose-50 py-1.5 rounded-lg px-2">
                               {minTime && (selectedHour < minTime.hour || (selectedHour === minTime.hour && selectedMinute < minTime.minute)) && (
                                   <>Please select a time after {formatTime(minTime)}</>
                               )}
                               {maxTime && (selectedHour > maxTime.hour || (selectedHour === maxTime.hour && selectedMinute > maxTime.minute)) && (
                                   <>Please select a time before {formatTime(maxTime)}</>
                               )}
                           </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isInvalidTime}
                                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition-colors shadow-lg ${isInvalidTime
                                    ? 'bg-slate-300 shadow-none cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                                    }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClockPicker;