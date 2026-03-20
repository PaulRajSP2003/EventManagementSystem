import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiMapPin, FiRefreshCw, FiX } from 'react-icons/fi';
import PlaceAPI, { type PhotonFeature } from '../api/PlaceList';

export interface PlaceSelectResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface PlaceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: PlaceSelectResult) => void;
  onBlur?: (value: string) => void;
  status?: 'verified' | 'not_found' | 'pending' | undefined;
  placeholder?: string;
  className?: string;
}

const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  value,
  onChange,
  onSelect,
  onBlur,
  status,
  placeholder = 'Type any location...',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Position state for the portal dropdown
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute and update dropdown position relative to input element
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      top: rect.bottom + 4,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const update = () => updatePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, updatePosition]);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const features = await PlaceAPI.searchPlaces(query, 10);
      const limited = features.slice(0, 5);
      setSuggestions(limited);
      if (limited.length > 0) {
        updatePosition();
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [updatePosition]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.trim().length >= 2) search(v);
    else { setSuggestions([]); setIsOpen(false); }
  };

  const handleFocus = () => {
    if (value.trim().length >= 2 && suggestions.length > 0) {
      updatePosition();
      setIsOpen(true);
    } else if (value.trim().length >= 2) {
      search(value);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      onBlur?.(value);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const selectSuggestion = (feature: PhotonFeature) => {
    const displayName = PlaceAPI.getPlaceDisplayName(feature);
    const { lat, lng } = PlaceAPI.getPlaceCoordinates(feature);
    onChange(displayName);
    onSelect({ displayName, latitude: lat, longitude: lng });
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    onBlur?.('');
  };

  const borderClass =
    status === 'verified'
      ? 'border-green-400 bg-green-50 focus:ring-green-100'
      : status === 'not_found'
        ? 'border-orange-400 bg-orange-50 focus:ring-orange-100'
        : 'border-slate-200 bg-white focus:ring-indigo-100';

  const dropdown = isOpen && suggestions.length > 0
    ? createPortal(
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiMapPin className="w-3 h-3 text-indigo-400" />
            Suggested Places
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((feature, idx) => {
            const isActive = highlightedIndex === idx;
            const mainName = feature.properties.name || '';
            const subTitle = [
              feature.properties.city,
              feature.properties.state,
              feature.properties.country,
            ]
              .filter((p): p is string => Boolean(p && p !== mainName))
              .join(', ');
            const placeType = feature.properties.osm_value || 'place';

            return (
              <div
                key={idx}
                onMouseDown={() => selectSuggestion(feature)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-slate-100 last:border-b-0
                    ${isActive ? 'bg-indigo-50' : 'bg-white hover:bg-indigo-50/30'}`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0
                    ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <FiMapPin className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {mainName || 'Unknown Place'}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {subTitle || 'Location details unavailable'}
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex-shrink-0 mt-0.5
                    ${isActive ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  {placeType}
                </span>
              </div>
            );
          })}
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Input row */}
      <div className="relative">
        <FiMapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none
          ${status === 'verified' ? 'text-green-500' : status === 'not_found' ? 'text-orange-400' : 'text-slate-400'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={1000}
          className={`w-full pl-8 pr-8 py-2 border rounded-lg text-sm transition-all duration-200 outline-none
            focus:ring-2 focus:border-transparent ${borderClass}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <FiRefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); clearInput(); }}
              className="text-slate-300 hover:text-slate-500 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Portal dropdown — rendered on document.body, above everything */}
      {dropdown}
    </div>
  );
};

export default PlaceSearchInput;