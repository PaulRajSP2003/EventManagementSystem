import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    FiBold,
    FiItalic,
    FiUnderline,
    FiList,
    FiLink,
    FiImage,
    FiAlignLeft,
    FiAlignCenter,
    FiAlignRight,
    FiAlignJustify,
    FiMinus,
    FiRotateCcw,
    FiRotateCw,
    FiType,
} from 'react-icons/fi';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'system';
    showToolbar?: boolean;
    autoFocus?: boolean;
    maxChars?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Start writing...",
    minHeight = "200px",
    readOnly = false,
    theme = 'light',
    showToolbar = true,
    autoFocus = false,
    maxChars = 2500
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<string[]>([value || '']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showListTypes, setShowListTypes] = useState(false);
    const [listType, setListType] = useState('1');
    const [showBulletTypes, setShowBulletTypes] = useState(false);
    const [unorderedStyle, setUnorderedStyle] = useState('disc');
    const [selectedText, setSelectedText] = useState('');
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [textColor, setTextColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    // Initialize editor content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
            editorRef.current.innerHTML = value || '';
            updateWordCount(value || '');
        }
    }, [value]);

    // Auto-focus
    useEffect(() => {
        if (autoFocus && editorRef.current && !readOnly) {
            editorRef.current.focus();
        }
    }, [autoFocus, readOnly]);

    // Save selection before losing focus
    const saveSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0));
        }
    }, []);

    // Restore saved selection
    const restoreSelection = useCallback(() => {
        if (savedRange && editorRef.current) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }
        }
    }, [savedRange]);

    // Update word count
    const updateWordCount = (html: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        setWordCount({ words, chars });
    };

    // Save to history
    const saveToHistory = useCallback((newValue: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, newValue];
        });
        setHistoryIndex(prev => prev + 1);
        updateWordCount(newValue);
    }, [historyIndex]);

    // Execute command with MS Word-like alignment for lists
    const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
        if (readOnly) return;

        // Handle alignment commands specially for lists
        if (command.startsWith('justify')) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node: Node | null = range.commonAncestorContainer;

                // Find if we're in a list
                if (node.nodeType !== 1) node = node.parentElement;
                const listItem = (node as Element)?.closest('li');

                if (listItem) {
                    // We're in a list - apply alignment to list items individually
                    const list = listItem.closest('ul, ol');
                    if (list) {
                        const listItems = list.querySelectorAll('li');

                        // Apply alignment to each list item
                        listItems.forEach(item => {
                            (item as HTMLElement).style.textAlign = command.replace('justify', '').toLowerCase() as any;
                        });

                        // Also apply to any nested lists
                        const nestedLists = list.querySelectorAll('ul, ol');
                        nestedLists.forEach(nestedList => {
                            (nestedList as HTMLElement).style.textAlign = command.replace('justify', '').toLowerCase() as any;
                        });

                        // Update content
                        if (editorRef.current) {
                            const newContent = editorRef.current.innerHTML;
                            onChange(newContent);
                            saveToHistory(newContent);
                        }

                        updateActiveFormats();
                        return;
                    }
                }
            }
        }

        // Check char limit before executing (except for deletions/undo)
        if (command !== 'delete' && command !== 'undo' && wordCount.chars >= maxChars) {
            const selection = window.getSelection();
            if (selection && selection.isCollapsed) {
                return;
            }
        }

        // Execute standard command
        document.execCommand(command, false, value);

        // Update content
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            onChange(newContent);
            saveToHistory(newContent);
        }

        // Update active formats
        setTimeout(() => updateActiveFormats(), 0);
    }, [onChange, saveToHistory, readOnly, wordCount.chars, maxChars]);

    // Handle ordered list types
    const handleOrderedList = useCallback((type: string) => {
        if (readOnly) return;

        const isCurrentlyOrdered = document.queryCommandState('insertOrderedList');

        if (isCurrentlyOrdered && listType === type) {
            // Toggle off if same type
            execCommand('insertOrderedList');
            setListType('1');
        } else {
            // If not ordered list, make it one
            if (!isCurrentlyOrdered) {
                execCommand('insertOrderedList');
            }

            setTimeout(() => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
                    if (node.nodeType !== 1) node = node.parentElement;
                    const ol = (node as Element)?.closest('ol');
                    if (ol) {
                        ol.setAttribute('type', type);
                        setListType(type);
                        if (editorRef.current) {
                            const newContent = editorRef.current.innerHTML;
                            onChange(newContent);
                            saveToHistory(newContent);
                        }
                    }
                }
            }, 0);
        }
        setShowListTypes(false);
    }, [readOnly, execCommand, listType, onChange, saveToHistory]);

    // Handle unordered list types
    const handleUnorderedList = useCallback((style: string) => {
        if (readOnly) return;

        const isCurrentlyUnordered = document.queryCommandState('insertUnorderedList');

        if (isCurrentlyUnordered && unorderedStyle === style) {
            execCommand('insertUnorderedList');
            setUnorderedStyle('disc');
        } else {
            if (!isCurrentlyUnordered) {
                execCommand('insertUnorderedList');
            }

            setTimeout(() => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
                    if (node.nodeType !== 1) node = node.parentElement;
                    const ul = (node as Element)?.closest('ul');
                    if (ul) {
                        ul.style.listStyleType = style;
                        setUnorderedStyle(style);
                        if (editorRef.current) {
                            const newContent = editorRef.current.innerHTML;
                            onChange(newContent);
                            saveToHistory(newContent);
                        }
                    }
                }
            }, 0);
        }
        setShowBulletTypes(false);
    }, [readOnly, execCommand, unorderedStyle, onChange, saveToHistory]);

    // Update active formats
    const updateActiveFormats = useCallback(() => {
        const formats = new Set<string>();

        // Check formatting commands
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        if (document.queryCommandState('strikethrough')) formats.add('strikethrough');
        if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');

        // Check alignment
        if (document.queryCommandState('justifyLeft')) formats.add('justifyLeft');
        if (document.queryCommandState('justifyCenter')) formats.add('justifyCenter');
        if (document.queryCommandState('justifyRight')) formats.add('justifyRight');
        if (document.queryCommandState('justifyFull')) formats.add('justifyFull');

        setActiveFormats(formats);
    }, []);

    // Handle selection change
    useEffect(() => {
        document.addEventListener('selectionchange', updateActiveFormats);
        return () => document.removeEventListener('selectionchange', updateActiveFormats);
    }, [updateActiveFormats]);

    // Handle input
    const handleInput = useCallback(() => {
        if (editorRef.current && !readOnly) {
            const newContent = editorRef.current.innerHTML;
            onChange(newContent);
            updateWordCount(newContent);
        }
    }, [onChange, readOnly]);

    // Handle blur
    const handleBlur = useCallback(() => {
        if (editorRef.current && !readOnly) {
            saveToHistory(editorRef.current.innerHTML);
        }
    }, [saveToHistory, readOnly]);

    // Handle keydown
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (readOnly) return;

        // Block new printable characters when at the char limit
        const isModifier = e.ctrlKey || e.metaKey || e.altKey;
        const isNavigation = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key);
        const isDeletion = ['Backspace', 'Delete'].includes(e.key);
        const isSpecial = e.key.length > 1; // Tab, Enter, Escape, F-keys, etc.

        if (!isModifier && !isNavigation && !isDeletion && !isSpecial && wordCount.chars >= maxChars) {
            // Allow if there's a selection (replacement won't increase length)
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                e.preventDefault();
                return;
            }
        }

        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
                case 'k':
                    e.preventDefault();
                    handleAddLink();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    handleRedo();
                    break;
            }
        }

        // Handle escape key
        if (e.key === 'Escape') {
            setShowLinkInput(false);
            setShowColorPicker(false);
            setShowListTypes(false);
            setShowBulletTypes(false);
        }
    }, [execCommand, readOnly]);

    // Handle add link
    const handleAddLink = useCallback(() => {
        saveSelection();
        const selection = window.getSelection();
        const selected = selection?.toString() || '';

        if (selected) {
            setSelectedText(selected);
            setShowLinkInput(true);
        } else {
            const url = prompt('Enter URL:');
            if (url) {
                execCommand('createLink', url);
            }
        }
    }, [execCommand, saveSelection]);

    // Handle insert link
    const handleInsertLink = useCallback(() => {
        restoreSelection();
        if (linkUrl) {
            execCommand('createLink', linkUrl);
            setShowLinkInput(false);
            setLinkUrl('');
            setSelectedText('');
        }
    }, [execCommand, linkUrl, restoreSelection]);

    // Handle undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            if (editorRef.current) {
                editorRef.current.innerHTML = history[newIndex];
                onChange(history[newIndex]);
                updateWordCount(history[newIndex]);
            }
        }
    }, [history, historyIndex, onChange]);

    // Handle redo
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            if (editorRef.current) {
                editorRef.current.innerHTML = history[newIndex];
                onChange(history[newIndex]);
                updateWordCount(history[newIndex]);
            }
        }
    }, [history, historyIndex, onChange]);

    // Handle insert image
    const handleInsertImage = useCallback(() => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    }, [execCommand]);

    // Handle insert horizontal rule
    const handleInsertHorizontalRule = useCallback(() => {
        execCommand('insertHorizontalRule');
    }, [execCommand]);

    // Handle clear formatting
    const handleClearFormatting = useCallback(() => {
        execCommand('removeFormat');
    }, [execCommand]);

    // Handle format block - FIXED: Prevent headers from going under toolbar
    const handleFormatBlock = useCallback((tag: string) => {
        execCommand('formatBlock', `<${tag}>`);

        // Add scroll margin to headers to prevent them from going under toolbar
        setTimeout(() => {
            if (editorRef.current) {
                const headers = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headers.forEach(header => {
                    (header as HTMLElement).style.scrollMarginTop = '70px';
                });
            }
        }, 0);
    }, [execCommand]);

    // Handle set color
    const handleSetColor = useCallback((color: string, type: 'text' | 'background') => {
        restoreSelection();
        if (type === 'text') {
            execCommand('foreColor', color);
            setTextColor(color);
        } else {
            execCommand('hiliteColor', color);
            setBgColor(color);
        }
        setShowColorPicker(false);
    }, [execCommand, restoreSelection]);



    // Check if format is active
    const isActive = (format: string) => activeFormats.has(format);

    // Get theme classes
    const getThemeClasses = () => {
        switch (theme) {
            case 'dark':
                return 'bg-gray-900 text-gray-100 border-gray-700';
            case 'system':
                return window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'bg-gray-900 text-gray-100 border-gray-700'
                    : 'bg-white text-gray-800 border-gray-200';
            default:
                return 'bg-white text-gray-800 border-gray-200';
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.editor-dropdown-trigger')) {
                setShowListTypes(false);
                setShowBulletTypes(false);
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`
            relative w-full h-full flex flex-col rounded-xl transition-all duration-200
            ${getThemeClasses()}
            ${readOnly ? 'bg-gray-50' : ''}
        `}>
            {/* Toolbar - Now sticky with higher z-index */}
            {showToolbar && !readOnly && (
                <>
                    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-white shadow-sm">
                        {/* History Controls */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={handleUndo}
                                icon={<FiRotateCcw className="w-4 h-4" />}
                                title="Undo (Ctrl+Z)"
                                disabled={historyIndex <= 0}
                                isActive={false}
                            />
                            <ToolbarButton
                                onClick={handleRedo}
                                icon={<FiRotateCw className="w-4 h-4" />}
                                title="Redo (Ctrl+Y)"
                                disabled={historyIndex >= history.length - 1}
                                isActive={false}
                            />
                        </div>

                        <ToolbarDivider />

                        {/* Text Formatting */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => execCommand('bold')}
                                icon={<FiBold className="w-4 h-4" />}
                                title="Bold (Ctrl+B)"
                                isActive={isActive('bold')}
                            />
                            <ToolbarButton
                                onClick={() => execCommand('italic')}
                                icon={<FiItalic className="w-4 h-4" />}
                                title="Italic (Ctrl+I)"
                                isActive={isActive('italic')}
                            />
                            <ToolbarButton
                                onClick={() => execCommand('underline')}
                                icon={<FiUnderline className="w-4 h-4" />}
                                title="Underline (Ctrl+U)"
                                isActive={isActive('underline')}
                            />
                        </div>

                        <ToolbarDivider />

                        {/* Headers - Fixed: Added scroll margin to prevent hiding under toolbar */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => handleFormatBlock('h1')}
                                icon={<span className="text-xs font-bold">H1</span>}
                                title="Heading 1"
                                isActive={false}
                            />
                            <ToolbarButton
                                onClick={() => handleFormatBlock('h2')}
                                icon={<span className="text-xs font-bold">H2</span>}
                                title="Heading 2"
                                isActive={false}
                            />
                            <ToolbarButton
                                onClick={() => handleFormatBlock('h3')}
                                icon={<span className="text-xs font-bold">H3</span>}
                                title="Heading 3"
                                isActive={false}
                            />
                        </div>

                        {/* Lists Group */}
                        <div className="flex items-center gap-0.5">
                            {/* Bullet List */}
                            <div className="relative editor-dropdown-trigger">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowBulletTypes(!showBulletTypes)}
                                    className={`
                                        flex items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200
                                        ${isActive('insertUnorderedList')
                                            ? 'text-indigo-600 bg-indigo-50 shadow-sm'
                                            : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
                                        }
                                    `}
                                    title="Bullet List Styles"
                                >
                                    <FiList className="w-3.5 h-3.5" />
                                    <svg className={`w-2 h-2 transition-transform ${showBulletTypes ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                                {showBulletTypes && (
                                    <div className="absolute top-full left-0 mt-1 p-1 bg-white rounded-lg shadow-xl border border-gray-200 z-40 min-w-[120px] animate-in fade-in slide-in-from-top-1">
                                        {[
                                            { style: 'disc', label: '●', title: 'Disc' },
                                            { style: 'circle', label: '○', title: 'Circle' },
                                            { style: 'square', label: '■', title: 'Square' },
                                        ].map((item) => (
                                            <button
                                                key={item.style}
                                                onClick={() => handleUnorderedList(item.style)}
                                                className={`
                                                    w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left rounded-md transition-colors
                                                    ${unorderedStyle === item.style && isActive('insertUnorderedList')
                                                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <span className="w-5 text-center text-sm">{item.label}</span>
                                                <span className="flex-1">{item.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Decimal List (123) */}
                            <div className="relative editor-dropdown-trigger">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleOrderedList('1')}
                                    className={`
                                        flex items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200
                                        ${isActive('insertOrderedList') && listType === '1'
                                            ? 'text-indigo-600 bg-indigo-50 shadow-sm'
                                            : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
                                        }
                                    `}
                                    title="Decimal List (1, 2, 3)"
                                >
                                    <div className="flex flex-col items-center leading-[0.7] py-0.5">
                                        <span className="text-[9px] font-bold">1</span>
                                        <span className="text-[9px] font-bold">2</span>
                                        <span className="text-[9px] font-bold">3</span>
                                    </div>
                                    <svg className="w-2 h-2 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mixed List (1ai) */}
                            <div className="relative editor-dropdown-trigger">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowListTypes(!showListTypes)}
                                    className={`
                                        flex items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200
                                        ${isActive('insertOrderedList') && listType !== '1'
                                            ? 'text-indigo-600 bg-indigo-50 shadow-sm'
                                            : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
                                        }
                                    `}
                                    title="More List Types (a, i, A, I)"
                                >
                                    <div className="flex flex-col items-center leading-[0.7] py-0.5">
                                        <span className="text-[9px] font-bold">1</span>
                                        <span className="text-[9px] font-bold">a</span>
                                        <span className="text-[9px] font-bold">i</span>
                                    </div>
                                    <svg className={`w-2 h-2 ml-0.5 transition-transform ${showListTypes ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                                {showListTypes && (
                                    <div className="absolute top-full left-0 mt-1 p-1 bg-white rounded-lg shadow-xl border border-gray-200 z-40 min-w-[140px] animate-in fade-in slide-in-from-top-1">
                                        {[
                                            { type: 'a', label: 'a, b, c', title: 'Lower Alpha' },
                                            { type: 'A', label: 'A, B, C', title: 'Upper Alpha' },
                                            { type: 'i', label: 'i, ii, iii', title: 'Lower Roman' },
                                            { type: 'I', label: 'I, II, III', title: 'Upper Roman' },
                                        ].map((item) => (
                                            <button
                                                key={item.type}
                                                onClick={() => handleOrderedList(item.type)}
                                                className={`
                                                    w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left rounded-md transition-colors
                                                    ${listType === item.type && isActive('insertOrderedList')
                                                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <span className="w-8 font-mono text-center bg-gray-100 rounded text-[9px]">{item.label.split(',')[0]}</span>
                                                <span className="flex-1">{item.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <ToolbarDivider />

                        {/* Alignment Group - FIXED: Now works properly with lists */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => execCommand('justifyLeft')}
                                icon={<FiAlignLeft className="w-4 h-4" />}
                                title="Align Left"
                                isActive={isActive('justifyLeft')}
                            />
                            <ToolbarButton
                                onClick={() => execCommand('justifyCenter')}
                                icon={<FiAlignCenter className="w-4 h-4" />}
                                title="Align Center (MS Word style)"
                                isActive={isActive('justifyCenter')}
                            />
                            <ToolbarButton
                                onClick={() => execCommand('justifyRight')}
                                icon={<FiAlignRight className="w-4 h-4" />}
                                title="Align Right"
                                isActive={isActive('justifyRight')}
                            />
                            <ToolbarButton
                                onClick={() => execCommand('justifyFull')}
                                icon={<FiAlignJustify className="w-4 h-4" />}
                                title="Justify"
                                isActive={isActive('justifyFull')}
                            />
                        </div>

                        <ToolbarDivider />

                        {/* Insert Elements */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={handleAddLink}
                                icon={<FiLink className="w-4 h-4" />}
                                title="Insert Link (Ctrl+K)"
                                isActive={false}
                            />
                            <ToolbarButton
                                onClick={handleInsertImage}
                                icon={<FiImage className="w-4 h-4" />}
                                title="Insert Image"
                                isActive={false}
                            />
                            <ToolbarButton
                                onClick={handleInsertHorizontalRule}
                                icon={<FiMinus className="w-4 h-4" />}
                                title="Horizontal Rule"
                                isActive={false}
                            />
                        </div>

                        <ToolbarDivider />

                        {/* Color Picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    if (!showColorPicker) saveSelection();
                                    setShowColorPicker(!showColorPicker);
                                }}
                                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                                title="Text color"
                            >
                                <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: textColor }} />
                            </button>

                            {showColorPicker && (
                                <div className="absolute top-full left-0 mt-1 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium text-gray-500">Text Color</label>
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => handleSetColor(e.target.value, 'text')}
                                            className="w-full h-8 cursor-pointer"
                                        />
                                        <label className="text-xs font-medium text-gray-500 mt-2">Background Color</label>
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => handleSetColor(e.target.value, 'background')}
                                            className="w-full h-8 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <ToolbarDivider />

                        {/* Clear Formatting */}
                        <ToolbarButton
                            onClick={handleClearFormatting}
                            icon={<FiType className="w-4 h-4" />}
                            title="Clear Formatting"
                            isActive={false}
                        />

                        <div className="flex-1" />

                        {/* Live Character Counter */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium tabular-nums transition-colors ${wordCount.chars >= maxChars
                            ? 'text-red-500 bg-red-50'
                            : wordCount.chars >= maxChars * 0.85
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-gray-400 bg-gray-50'
                            }`}>
                            <span className="font-semibold">{wordCount.chars}</span>
                            <span className="text-gray-300 mx-0.5">/</span>
                            <span>{maxChars - wordCount.chars} remaining</span>
                        </div>
                    </div>

                    {/* Link Input Popup */}
                    {showLinkInput && (
                        <div className="absolute left-1/2 top-14 -translate-x-1/2 w-96 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FiLink className="w-4 h-4 text-indigo-500" />
                                <h4 className="font-medium text-gray-700">Insert Link</h4>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInsertLink();
                                        if (e.key === 'Escape') setShowLinkInput(false);
                                    }}
                                />
                                {selectedText && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">Linking:</span>
                                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                            "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setShowLinkInput(false)}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInsertLink}
                                        disabled={!linkUrl}
                                        className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Insert
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Editable Area - FIXED: Added scroll margin to prevent headers from going under toolbar */}
            <div
                ref={editorRef}
                contentEditable={!readOnly}
                onInput={handleInput}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onWheel={(e) => e.stopPropagation()}
                style={{
                    minHeight,
                    scrollPaddingTop: '70px',
                    overscrollBehavior: 'contain',
                    scrollbarWidth: 'none',  // Firefox
                    msOverflowStyle: 'none'  // IE/Edge
                }}
                className={`
                    w-full flex-1 overflow-y-auto p-4 outline-none text-sm prose prose-sm max-w-none
                    ${readOnly ? 'cursor-default' : 'cursor-text'}
                    [&_ul]:list-inside [&_ol]:list-inside
                    [&_li]:text-inherit
                    [text-align:inherit]
                    scroll-mt-16
                    relative
                    [&_h1]:scroll-mt-20 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20
                    [&::-webkit-scrollbar]:hidden
                `}
                suppressContentEditableWarning
            />

            {/* Placeholder - FIXED: Position adjusted for toolbar */}
            {(!value || value === '<br>' || value === '') && !readOnly && (
                <div className="absolute top-[4.2rem] left-4 pointer-events-none text-gray-400 text-sm italic">
                    {placeholder}
                </div>
            )}

            {/* Stats Panel */}

            {/* Read-only indicator */}
            {readOnly && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg border border-gray-200 z-20">
                    Read Only
                </div>
            )}
        </div>
    );
};

interface ToolbarButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    disabled?: boolean;
    isActive: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, icon, title, disabled = false, isActive }) => (
    <button
        type="button"
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        className={`
            p-1.5 rounded-lg transition-all duration-200 relative
            ${disabled
                ? 'text-gray-300 cursor-not-allowed'
                : isActive
                    ? 'text-indigo-600 bg-indigo-50 shadow-sm'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
            }
        `}
        title={title}
    >
        {icon}
    </button>
);

const ToolbarDivider = () => (
    <div className="w-px h-5 bg-gray-200 mx-1" />
);

export default RichTextEditor;