import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, ChevronUp, ChevronDown, MoreHorizontal,
    Calendar as CalendarIcon, AlarmClock, Tag, MapPin,
    Flag, Plus, Trash2, CheckCircle, Circle, RefreshCw, Check
} from 'lucide-react';
import DatePickerDropdown from './DatePickerDropdown';
import TimePickerDropdown from './TimePickerDropdown';
import SmartInput from './SmartInput';
import { renderFormattedDate, TIME_OPTIONS, repeatOptions, repeatLabels } from './TaskComponents/index.jsx';

/**
 * TaskEditModal - Mobile popup anchored below (or above) the tapped task.
 *
 * Props:
 *  item            – checklist item object { id, content, description, target_date, created_at, ... }
 *  projectTitle    – e.g. "Home 🏠"       (optional)
 *  sectionTitle    – checklist/list name  (optional)
 *  allItems        – flat sibling item list for prev/next navigation
 *  anchorRect      – DOMRect of the tapped row, to position the dropdown
 *  isOpen          – boolean
 *  onClose         – close callback
 *  onSave          – (updatedFields) => void
 *  onDelete        – () => void
 *  onNavigate      – (item) => void
 *  isCompleted     – boolean
 *  onToggleComplete – () => void
 */
export default function TaskEditModal({
    item,
    projectTitle = '',
    sectionTitle = '',
    allItems = [],
    anchorRect = null,
    isOpen,
    onClose,
    onSave,
    onDelete,
    onNavigate,
    isCompleted = false,
    onToggleComplete,
}) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [time, setTime] = useState('');
    const [showTimeMenu, setShowTimeMenu] = useState(false);
    const [repeatRule, setRepeatRule] = useState(null);
    const [showRepeatMenu, setShowRepeatMenu] = useState(false);
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const dateBtnRef = useRef(null);
    const timeBtnRef = useRef(null);
    const moreMenuRef = useRef(null);
    const contentRef = useRef(null);
    const panelRef = useRef(null);

    // Sync state from incoming item
    useEffect(() => {
        if (item && isOpen) {
            setContent(item.content || '');
            setDescription(item.description || '');
            setTargetDate(item.target_date || '');
            setTime(item.time || '');
            setRepeatRule(item.repeat_rule || null);
            setIsEditing(false);
            setShowMoreMenu(false);
            setShowDatePicker(false);
            setShowRepeatMenu(false);
        }
    }, [item, isOpen]);

    // Auto-focus when entering edit mode
    useEffect(() => {
        if (isEditing && contentRef.current) {
            contentRef.current.focus();
            contentRef.current.select();
        }
    }, [isEditing]);

    // Click-outside to close
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            setTimeout(() => document.addEventListener('mousedown', handler), 10);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    // Click-outside for more-menu
    useEffect(() => {
        const handler = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!isOpen || !item) return null;

    // ---- Prev / Next navigation ----
    const currentIdx = allItems.findIndex(i => i.id === item.id);
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx !== -1 && currentIdx < allItems.length - 1;
    const goToPrev = () => { if (hasPrev && onNavigate) onNavigate(allItems[currentIdx - 1]); };
    const goToNext = () => { if (hasNext && onNavigate) onNavigate(allItems[currentIdx + 1]); };


    const handleSave = () => {
        const plainText = typeof content === 'string' ? content.replace(/<[^>]*>?/gm, '').trim() : '';
        if (onSave) onSave({
            content: plainText,
            description,
            target_date: targetDate || null,
            time: time || null,
            repeat_rule: repeatRule || null
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setContent(item.content || '');
        setDescription(item.description || '');
        setIsEditing(false);
    };

    const handleDateSelect = (dateStr) => {
        setTargetDate(dateStr);
        setShowDatePicker(false);
        if (onSave) onSave({
            target_date: dateStr || null,
        });
    };

    const handleClearDate = (e) => {
        e.stopPropagation();
        setTargetDate('');
        if (onSave) onSave({
            target_date: null
        });
    };

    const handleDelete = () => {
        setShowMoreMenu(false);
        onClose();
        if (onDelete) onDelete();
    };

    // ---- Position the panel near the anchor ----
    // Try to place below the row; if not enough space, place above
    let panelStyle = {};
    if (anchorRect) {
        const PANEL_MAX_HEIGHT = 480;
        const spaceBelow = window.innerHeight - anchorRect.bottom - 8;
        const spaceAbove = anchorRect.top - 8;
        const placeBelow = spaceBelow >= 240 || spaceBelow >= spaceAbove;
        const top = placeBelow
            ? anchorRect.bottom + 6
            : Math.max(8, anchorRect.top - PANEL_MAX_HEIGHT - 6);

        const isDesktop = window.innerWidth > 768;
        panelStyle = {
            position: 'fixed',
            top,
            left: isDesktop ? 'calc(50% - 250px)' : 8,
            right: isDesktop ? 'auto' : 8,
            width: isDesktop ? '500px' : 'calc(100% - 16px)',
            maxHeight: PANEL_MAX_HEIGHT,
        };
    } else {
        // fallback: bottom sheet
        panelStyle = {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '88vh',
            borderRadius: '20px 20px 0 0',
        };
    }

    // ---- Helpers ----
    const hebrewDate = targetDate
        ? new Date(targetDate).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })
        : null;

    const createdAtStr = item.created_at
        ? new Date(item.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    // header label: "project / list" or just one of them
    const headerLabel = [projectTitle, sectionTitle].filter(Boolean).join(' / ');

    // ---- Row style ----
    const rowStyle = {
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.7rem 1.25rem',
        color: 'var(--text-secondary)',
        fontSize: '0.92rem',
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'right',
        fontFamily: 'inherit',
        borderBottom: '1px solid var(--border-color)',
    };

    const iconBox = (color = 'var(--text-secondary)') => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, flexShrink: 0, color
    });

    const navBtn = (active) => ({
        border: 'none', background: 'transparent', padding: '6px',
        cursor: active ? 'pointer' : 'not-allowed',
        color: active ? 'var(--text-secondary)' : 'var(--border-color)',
        display: 'flex', opacity: active ? 1 : 0.4, transition: 'opacity 0.15s',
    });

    // ---- Render ----
    const panel = (
        <>
            {/* invisible full-screen backdrop (captures outside clicks via panelRef click-outside handler) */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'transparent' }} />

            {/* The panel itself */}
            <div
                ref={panelRef}
                style={{
                    ...panelStyle,
                    background: 'var(--bg-color)',
                    borderRadius: anchorRect ? '14px' : '20px 20px 0 0',
                    zIndex: 9999,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
                    animation: 'fadeIn 0.15s ease',
                    overflowY: 'auto',
                    direction: 'rtl',
                    border: '1px solid var(--border-color)',
                }}
            >
                {/* ===== HEADER ===== */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'sticky', top: 0,
                    background: 'var(--bg-color)', zIndex: 10,
                    gap: '0.4rem',
                }}>
                    <span style={{
                        fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flexShrink: 1,
                    }}>
                        # {headerLabel || 'משימה'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.05rem', flexShrink: 0 }}>
                        {/* ↑ prev */}
                        <button onClick={goToPrev} disabled={!hasPrev} style={navBtn(hasPrev)} title="משימה קודמת">
                            <ChevronUp size={19} />
                        </button>
                        {/* ↓ next */}
                        <button onClick={goToNext} disabled={!hasNext} style={navBtn(hasNext)} title="משימה הבאה">
                            <ChevronDown size={19} />
                        </button>

                        <div style={{ width: '4px' }} />

                        {/* X */}
                        <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-gray-soft)', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', borderRadius: 'var(--radius-sm)' }}>
                            <X size={19} />
                        </button>
                    </div>
                </div>

                {/* ===== TASK CONTENT (tap-to-edit) ===== */}
                <div
                    style={{
                        padding: '0.45rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex', gap: '0.7rem', alignItems: 'flex-start',
                    }}
                    onClick={() => { if (!isEditing) setIsEditing(true); }}
                >
                    <div
                        className="check-circle"
                        style={{ marginTop: '3px', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); if (onToggleComplete) onToggleComplete(); }}
                    >
                        {isCompleted
                            ? <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <CheckCircle size={14} strokeWidth={2.5} />
                            </div>
                            : <div className="empty-circle-container" style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #ccc', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                <Check className="hover-check" size={12} strokeWidth={3} style={{ color: '#ccc', opacity: 0, transition: 'opacity 0.2s' }} />
                            </div>
                        }
                    </div>

                    {isEditing ? (
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ border: '1.5px solid var(--primary-color)', borderRadius: '10px', padding: '0.3rem 0.8rem' }}>
                                <SmartInput
                                    html={content || ''}
                                    setHtml={setContent}
                                    placeholder="שם משימה"
                                    autoFocus={true}
                                    date={targetDate}
                                    time={time}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') handleCancelEdit();
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSave();
                                        }
                                    }}
                                    style={{
                                        width: '100%', border: 'none', outline: 'none',
                                        fontSize: '1rem', fontWeight: 600, background: 'transparent',
                                        color: 'var(--text-primary)', fontFamily: 'inherit', direction: 'rtl',
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                    }}
                                />
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="= תיאור"
                                    rows={2}
                                    style={{
                                        width: '100%', border: 'none', outline: 'none', resize: 'none',
                                        fontSize: '0.86rem', background: 'transparent',
                                        color: 'var(--text-secondary)', fontFamily: 'inherit',
                                        marginTop: '0.25rem', direction: 'rtl',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <button onClick={e => { e.stopPropagation(); handleCancelEdit(); }}
                                    style={{ padding: '0.35rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                                    ביטול
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleSave(); }}
                                    style={{ padding: '0.35rem 0.9rem', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.82rem', color: 'white', fontWeight: 600, fontFamily: 'inherit' }}>
                                    שמירה
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flexGrow: 1 }}>
                            <div
                                style={{
                                    fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)',
                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                    opacity: isCompleted ? 0.65 : 1, lineHeight: 1.4,
                                }}
                                dangerouslySetInnerHTML={{ __html: content || 'ללא שם...' }}
                            />
                            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', opacity: description ? 1 : 0.4, marginTop: '0.2rem' }}>
                                = {description || 'תיאור'}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative' }}>
                    <button ref={dateBtnRef} style={{
                        ...rowStyle,
                        color: hebrewDate ? 'var(--primary-color)' : 'var(--text-secondary)',
                    }} onClick={() => setShowDatePicker(!showDatePicker)}>
                        <span style={iconBox(targetDate ? 'var(--primary-color)' : 'var(--text-secondary)')}>
                            {/* Icon is now inside renderFormattedDate helper or we can keep it here but renderFormattedDate includes one. Actually I'll use targetDate ? renderFormattedDate(targetDate) : 'תאריך'  */}
                        </span>
                        <div style={{ fontSize: '12px' }}>
                            {targetDate ? renderFormattedDate(targetDate) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CalendarIcon size={17} />
                                    <span>תאריך</span>
                                </div>
                            )}
                        </div>
                        {repeatRule && (
                            <span style={{ marginRight: '0.5rem', fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-color)' }}>
                                {repeatLabels[repeatRule] || 'חוזר'}
                            </span>
                        )}
                        {time && (
                            <span style={{ marginRight: '0.5rem', fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-color)' }}>
                                {time}
                            </span>
                        )}
                        {hebrewDate && (
                            <button onClick={handleClearDate}
                                style={{ marginRight: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '2px' }}>
                                <X size={13} />
                            </button>
                        )}
                    </button>
                    <DatePickerDropdown
                        isOpen={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        anchorRef={dateBtnRef}
                        selectedDate={targetDate}
                        selectedTime={time}
                        onSelectDate={handleDateSelect}
                    >
                        <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ position: 'relative' }}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowTimeMenu(!showTimeMenu); setShowRepeatMenu(false); }}
                                    ref={timeBtnRef}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', background: time ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
                                        cursor: 'pointer', color: time ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit'
                                    }}>
                                    <AlarmClock size={15} />
                                    {time || 'זמן'}
                                </button>

                                <TimePickerDropdown
                                    isOpen={showTimeMenu}
                                    onClose={() => setShowTimeMenu(false)}
                                    anchorRef={timeBtnRef}
                                    initialTime={time}
                                    timeOptions={TIME_OPTIONS}
                                    onSave={(val) => {
                                        setTime(val);
                                        if (onSave) onSave({ content, description, target_date: targetDate || null, time: val, repeat_rule: repeatRule });
                                    }}
                                />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <button type="button" onClick={() => { setShowRepeatMenu(!showRepeatMenu); setShowTimeMenu(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', background: repeatRule ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
                                        cursor: 'pointer', color: repeatRule ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit'
                                    }}>
                                    <RefreshCw size={15} />
                                    {repeatRule ? repeatLabels[repeatRule] : 'חזרה'}
                                </button>

                                {showRepeatMenu && (
                                    <div style={{
                                        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                                        background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                                        borderRadius: '10px', boxShadow: '0 -6px 24px rgba(0,0,0,0.12)',
                                        overflow: 'hidden', zIndex: 220,
                                    }}>
                                        {repeatOptions.map((opt, i) => (
                                            <button key={i} onClick={() => {
                                                const val = opt.value === 'none' ? null : opt.value;
                                                setRepeatRule(val);
                                                setShowRepeatMenu(false);
                                                if (onSave) onSave({ content, description, target_date: targetDate || null, time, repeat_rule: val });
                                            }}
                                                style={{
                                                    display: 'block', width: '100%', padding: '0.6rem 1rem', border: 'none',
                                                    background: repeatRule === opt.value ? 'var(--bg-secondary)' : 'transparent',
                                                    cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.87rem',
                                                    textAlign: 'right', fontFamily: 'inherit', fontWeight: repeatRule === opt.value ? 600 : 400
                                                }}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DatePickerDropdown>
                </div>

                {/* ===== ADD SUB-TASK ===== */}
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.15rem 0' }} />
                <button style={{ ...rowStyle, color: 'var(--text-secondary)' }}>
                    <span style={iconBox()}><Plus size={17} /></span>
                    <span>הוסף תת-משימה</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.15rem 0' }} />
                <button
                    onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(); onClose(); }}
                    style={{ ...rowStyle, color: 'var(--danger-color)', borderBottom: 'none' }}
                >
                    <span style={iconBox('var(--danger-color)')}><Trash2 size={17} /></span>
                    <span>מחק משימה</span>
                </button>
            </div>
        </>
    );

    return createPortal(panel, document.body);
}
