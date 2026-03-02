import React, { useRef, useEffect, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { parse } from 'date-fns';

const SmartInput = ({ html, setHtml, placeholder, autoFocus, style, onKeyDown, date, setDate, time, setTime, showSpan = true }) => {
    const contentEditable = useRef(null);
    const [lastSyncText, setLastSyncText] = useState('');
    const hebrewMonthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

    useEffect(() => {
        if (autoFocus && contentEditable.current) {
            // Use a small timeout to ensure the element is ready and visible
            const timer = setTimeout(() => {
                contentEditable.current.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    const handleChange = (evt) => {
        const currentHtml = evt.target.value;
        setHtml(currentHtml);

        // Strip HTML to get plain text
        const plainText = currentHtml.replace(/<[^>]*>?/gm, '').trim();

        // Prevent infinite loop by not parsing text that hasn't conceptually changed
        if (plainText === lastSyncText) return;
        setLastSyncText(plainText);

        // Parse Time: @15:30 or @9:00
        const timeRegex = /@(\d{1,2}:\d{2})/;
        const timeMatch = plainText.match(timeRegex);

        if (timeMatch && setTime) {
            // Keep basic validation (e.g. 25:99 isn't real time, but we'll trust user intent for now)
            setTime(timeMatch[1].padStart(5, '0'));
            // Remove the trigger from html to prevent double-typing
            const cleanedHtml = currentHtml.replace(timeRegex, '').trim();
            setHtml(cleanedHtml);
        }

        // Expanded date parsing could go here: (e.g., #tomorrow)
    };

    return (
        <ContentEditable
            innerRef={contentEditable}
            html={html || ''}
            disabled={false}
            onChange={handleChange}
            tagName="div"
            style={{
                ...style,
                minHeight: '1.5em',
                cursor: 'text'
            }}
            onKeyDown={onKeyDown}
            data-placeholder={placeholder}
            className={`smart-input-area ${(!html || html === '<br>') ? 'is-empty' : ''}`}
        />
    );
};

export default SmartInput;
