import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface CalendarPickerProps {
    value: Date | DateRange | null;
    onChange: (val: any) => void;
    minDate?: Date;
    maxDate?: Date;
    placeholder?: string;
    className?: string;
    pickerTitle?: string;
    disabled?: boolean;
    allowSingleDay?: boolean; // If true, allows selecting just one day in range mode
    mode?: 'single' | 'range';
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
    value,
    onChange,
    minDate,
    maxDate,
    placeholder = "Select Date Range...",
    className = "",
    pickerTitle,
    disabled = false,
    allowSingleDay = false,
    mode = 'range'
}) => {
    // Helper to normalize the value to a Range for internal logic
    const getNormalizedValue = (val: Date | DateRange | null): DateRange => {
        if (!val) return { startDate: null, endDate: null };
        if (val instanceof Date) return { startDate: val, endDate: null };
        // Check if it's a DateRange object
        if (typeof val === 'object' && ('startDate' in val || 'endDate' in val)) {
            return val as DateRange;
        }
        return { startDate: null, endDate: null };
    };

    const normalizedValue = getNormalizedValue(value);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectingEndDate, setSelectingEndDate] = useState(false);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Reset calendar view when opening
    useEffect(() => {
        if (showCalendar) {
            setCurrentMonth(normalizedValue.startDate || new Date());
            setSelectingEndDate(false);
        }
    }, [showCalendar, normalizedValue.startDate]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        setCurrentMonth(newDate);
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        setCurrentMonth(newDate);
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        if (mode === 'single') {
            onChange(selectedDate);
            setShowCalendar(false);
            return;
        }

        // --- Range Mode Logic ---
        // If no start date or we're selecting end date
        if (!normalizedValue.startDate || selectingEndDate) {
            // If we have a start date and the selected date is before it, swap them
            if (normalizedValue.startDate && selectedDate < normalizedValue.startDate) {
                onChange({
                    startDate: selectedDate,
                    endDate: normalizedValue.startDate
                });
            } else {
                onChange({
                    startDate: normalizedValue.startDate,
                    endDate: selectedDate
                });
            }
            setSelectingEndDate(false);
            if (!allowSingleDay) {
                setShowCalendar(false);
            }
        } else {
            // Start selecting end date
            if (selectedDate < normalizedValue.startDate) {
                // If selected date is before start date, make it the new start date
                onChange({
                    startDate: selectedDate,
                    endDate: null
                });
                setSelectingEndDate(true);
            } else {
                onChange({
                    startDate: normalizedValue.startDate,
                    endDate: selectedDate
                });
                if (!allowSingleDay) {
                    setShowCalendar(false);
                } else {
                    setSelectingEndDate(false);
                }
            }
        }
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        if (minDate) {
            const normalizedMin = new Date(minDate);
            normalizedMin.setHours(0, 0, 0, 0);
            if (date < normalizedMin) return true;
        }

        if (maxDate) {
            const normalizedMax = new Date(maxDate);
            normalizedMax.setHours(23, 59, 59, 999);
            if (date > normalizedMax) return true;
        }
        
        return false;
    };

    const isInRange = (day: number) => {
        if (!normalizedValue.startDate) return false;

        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        if (mode === 'single') {
            return date.getTime() === normalizedValue.startDate.getTime();
        }

        const endDate = normalizedValue.endDate || hoveredDate;

        if (normalizedValue.startDate && endDate) {
            const start = normalizedValue.startDate < endDate ? normalizedValue.startDate : endDate;
            const end = normalizedValue.startDate < endDate ? endDate : normalizedValue.startDate;
            return date >= start && date <= end;
        }
        return false;
    };

    const isRangeStart = (day: number) => {
        if (!normalizedValue.startDate) return false;

        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        return date.getTime() === normalizedValue.startDate.getTime();
    };

    const isRangeEnd = (day: number) => {
        if (!normalizedValue.endDate) return false;

        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        return date.getTime() === normalizedValue.endDate.getTime();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const renderDays = () => {
        const days = [];
        const numDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
        const firstDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

        // Empty cells for days before month starts
        for (let i = 0; i < adjustedFirstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        // Days of the month
        for (let d = 1; d <= numDays; d++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
            date.setHours(12, 0, 0, 0);

            const disabled = isDateDisabled(d);
            const today = isToday(d);
            const inRange = isInRange(d);
            const rangeStart = isRangeStart(d);
            const rangeEnd = isRangeEnd(d);
            const isHovered = hoveredDate && hoveredDate.getTime() === date.getTime();

            let rangeClasses = '';
            if (inRange && !rangeStart && !rangeEnd) {
                rangeClasses = 'bg-indigo-50';
            }
            if (rangeStart || rangeEnd) {
                rangeClasses = 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200';
            }

            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => !disabled && handleDateClick(d)}
                    onMouseEnter={() => !disabled && normalizedValue.startDate && !normalizedValue.endDate && setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    disabled={disabled}
                    className={`
                        relative h-10 w-10 rounded-xl text-sm font-semibold transition-all
                        ${disabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : rangeStart || rangeEnd
                                ? rangeClasses
                                : inRange
                                    ? `${rangeClasses} hover:bg-indigo-100`
                                    : today
                                        ? 'text-indigo-600 font-bold hover:bg-indigo-50 border border-indigo-200'
                                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
                        }
                        ${isHovered && !rangeEnd && !rangeStart ? 'bg-indigo-100' : ''}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                    `}
                >
                    {d}
                    {today && !rangeStart && !rangeEnd && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
                    )}
                </button>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const formatDisplayDate = (range: DateRange) => {
        if (!range.startDate) return placeholder;

        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };

        if (!range.endDate) {
            return formatDate(range.startDate);
        }

        return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
    };

    const getRangeLength = () => {
        if (!normalizedValue.startDate || !normalizedValue.endDate) return null;
        const diffTime = Math.abs(normalizedValue.endDate.getTime() - normalizedValue.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleReset = () => {
        if (mode === 'single') {
            onChange(null);
        } else {
            onChange({ startDate: null, endDate: null });
        }
        setSelectingEndDate(false);
        setHoveredDate(null);
    };

    const rangeLength = getRangeLength();

    return (
        <div className={`relative ${className}`} ref={calendarRef}>
            <button
                type="button"
                onClick={() => !disabled && setShowCalendar(!showCalendar)}
                disabled={disabled}
                className={`
                    w-full px-5 py-4 bg-white border-2 rounded-2xl flex items-center justify-between
                    text-sm font-medium transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' :
                        showCalendar
                            ? 'border-indigo-300 bg-indigo-50/30 shadow-lg shadow-indigo-100'
                            : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10'
                    }
                    focus:outline-none focus:ring-4 focus:ring-indigo-500/10
                    group
                `}
            >
                <div className="flex items-center gap-3">
                    <FiCalendar className={`
                        w-5 h-5 transition-colors
                        ${normalizedValue.startDate ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'}
                    `} />
                    <span className={`
                        font-semibold
                        ${normalizedValue.startDate ? 'text-slate-800' : 'text-slate-400'}
                    `}>
                        {formatDisplayDate(normalizedValue)}
                    </span>
                </div>

                {/* Quick action indicators */}
                {normalizedValue.startDate && (
                    <div className="flex items-center gap-2">
                        {rangeLength !== null && (
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full">
                                {rangeLength} {rangeLength === 1 ? 'day' : 'days'}
                            </span>
                        )}
                        {normalizedValue.endDate && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-50 px-2 py-1 rounded-full">
                                <FiClock className="w-3 h-3 inline mr-1" />
                                {normalizedValue.startDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                <FiArrowRight className="w-3 h-3 inline mx-1" />
                                {normalizedValue.endDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                        )}
                    </div>
                )}
            </button>

            {showCalendar && (
                <>
                    {/* Backdrop for all screens */}
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[160]" onClick={() => setShowCalendar(false)} />

                    {/* Calendar dropdown */}
                    <div className={`
                        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[170] 
                        bg-white rounded-3xl shadow-2xl border border-slate-100 
                        p-6 min-w-[340px] 
                        animate-in zoom-in-95 duration-200
                    `}>
                        {/* Header with month selector */}
                        <div className="flex flex-col mb-4">
                            {pickerTitle && (
                                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                                    {pickerTitle}
                                </h3>
                            )}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {currentMonth.getFullYear()}
                                    </h4>
                                    <h3 className="text-xl font-black text-slate-800">
                                        {monthNames[currentMonth.getMonth()]}
                                    </h3>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-indigo-600"
                                    >
                                        <FiChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleNextMonth}
                                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-indigo-600"
                                    >
                                        <FiChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Selection status */}
                        <div className="mb-4 text-sm">
                            <span className="text-xs font-medium text-slate-500">
                                {mode === 'single'
                                    ? 'Select date'
                                    : !normalizedValue.startDate
                                        ? 'Select start date'
                                        : !normalizedValue.endDate
                                            ? 'Select end date'
                                            : 'Range selected'}
                            </span>
                        </div>

                        {/* Week days header */}
                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {weekDays.map(day => (
                                <div key={day} className="text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {day}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {renderDays()}
                        </div>

                        {/* Footer with quick actions */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        today.setHours(12, 0, 0, 0);
                                        if (mode === 'single') {
                                            onChange(today);
                                        } else {
                                            onChange({
                                                startDate: today,
                                                endDate: today
                                            });
                                        }
                                        setShowCalendar(false);
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    Today
                                </button>
                                {(normalizedValue.startDate || normalizedValue.endDate) && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCalendar(false)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarPicker;