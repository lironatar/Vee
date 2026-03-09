import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '../context/UserContext';
import {
    X, ChevronUp, ChevronDown, MoreHorizontal,
    Calendar as CalendarIcon, AlarmClock, Tag, MapPin,
    Flag, Plus, Trash2, CheckCircle, Circle, RefreshCw, Check,
    Home, List, MessageSquare, Paperclip, CheckSquare, Bell, Inbox, Folder, Send
} from 'lucide-react';
import DatePickerDropdown from './DatePickerDropdown';
import TimePickerDropdown from './TimePickerDropdown';
import SmartInput from './SmartInput';
import { renderFormattedDate, TIME_OPTIONS, repeatOptions, repeatLabels } from './TaskComponents/index.jsx';
import ProjectSelectorDropdown from './TaskComponents/ProjectSelectorDropdown';
import { toast } from 'sonner';

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
    const { user } = useUser();
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
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [priority, setPriority] = useState(4);
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const [reminderMinutes, setReminderMinutes] = useState(null);
    const [showReminderMenu, setShowReminderMenu] = useState(false);

    // Comments State
    const [itemComments, setItemComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const commentsEndRef = useRef(null);

    const dateBtnRef = useRef(null);
    const timeBtnRef = useRef(null);
    const moreMenuRef = useRef(null);
    const projectBtnRef = useRef(null);
    const priorityBtnRef = useRef(null);
    const contentRef = useRef(null);
    const panelRef = useRef(null);

    const prevItemIdRef = useRef(null);

    // Sync state from incoming item
    useEffect(() => {
        if (item && isOpen) {
            const isSameItem = prevItemIdRef.current === item.id;

            // Only perform full reset and comment fetch if item ID changed
            if (!isSameItem) {
                setContent(item.content || '');
                setDescription(item.description || '');
                setTargetDate(item.target_date || '');
                setTime(item.time || '');
                setRepeatRule(item.repeat_rule || null);
                setPriority(item.priority || 4);
                setReminderMinutes(item.reminder_minutes ?? null);
                setIsEditing(false);
                setShowMoreMenu(false);
                setShowDatePicker(false);
                setShowRepeatMenu(false);
                setShowProjectSelector(false);
                setShowPriorityMenu(false);
                setShowReminderMenu(false);
                fetchTaskComments(item.id);
                prevItemIdRef.current = item.id;
            } else {
                // If same item, only sync values without resetting UI state (menus, etc)
                // This prevents "flashing" when changing priority or dates
                if (item.content !== undefined && !isEditing) setContent(item.content || '');
                if (item.description !== undefined && !isEditing) setDescription(item.description || '');
                setTargetDate(item.target_date || '');
                setTime(item.time || '');
                setRepeatRule(item.repeat_rule || null);
                setPriority(item.priority || 4);
                setReminderMinutes(item.reminder_minutes ?? null);
            }
        } else if (!isOpen) {
            prevItemIdRef.current = null;
        }
    }, [item, isOpen, isEditing]); // added isEditing to correctly handle syncs

    const fetchTaskComments = async (itemId) => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/checklist-items/${itemId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setItemComments(data);
                setTimeout(scrollToBottom, 100);
            }
        } catch (err) {
            console.error('Failed to fetch task comments', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newCommentText.trim()) return;
        try {
            const res = await fetch(`/api/checklist-items/${item.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    content: newCommentText.trim()
                })
            });
            if (res.ok) {
                const comment = await res.json();
                setItemComments(prev => [...prev, comment]);
                setNewCommentText('');
                setTimeout(scrollToBottom, 100);
            }
        } catch (err) {
            console.error('Failed to post comment', err);
            toast.error('שגיאה בשליחת התגובה');
        }
    };

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Click-outside to close
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                // If clicking outside, try to save if we're currently editing
                if (isEditing) {
                    handleSave();
                }
                onClose();
            }
        };
        if (isOpen) {
            setTimeout(() => document.addEventListener('mousedown', handler), 10);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose, isEditing, content, description, targetDate, time, repeatRule, priority, reminderMinutes]); // Re-bind if save dependencies change

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
            repeat_rule: repeatRule || null,
            priority: priority,
            reminder_minutes: reminderMinutes
        });
        setIsEditing(false);
    };

    const handleDateSelect = (dateStr) => {
        setTargetDate(dateStr);
        setShowDatePicker(false);
        if (onSave) onSave({
            target_date: dateStr || null,
        });
    };

    const handleDelete = () => {
        setShowMoreMenu(false);
        onClose();
        if (onDelete) onDelete();
    };

    // Card modal positioning (centered on desktop, drawer on bottom for mobile)
    const isDesktop = window.innerWidth > 768;
    const panelStyle = {
        position: 'fixed',
        top: isDesktop ? '50%' : 'auto',
        left: isDesktop ? '50%' : 0,
        right: isDesktop ? 'auto' : 0,
        bottom: isDesktop ? 'auto' : 0,
        transform: isDesktop ? 'translate(-50%, -50%)' : 'none',
        width: isDesktop ? '550px' : '100%',
        maxHeight: isDesktop ? '85vh' : '90vh',
        background: 'var(--bg-color)',
        borderRadius: isDesktop ? '12px' : '20px 20px 0 0',
        zIndex: 9999,
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        animation: isDesktop ? 'fadeIn 0.05s ease' : 'slideUp 0.05s ease',
        overflowY: 'auto',
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
    };

    // ---- Helpers ----
    const headerLabel = [
        projectTitle || 'תיבת המשימות',
        (sectionTitle && sectionTitle !== projectTitle && sectionTitle !== 'כללי' && sectionTitle !== 'תיבת המשימות') ? sectionTitle : ''
    ].filter(Boolean).join(' / ');

    const isInboxInHeader = !projectTitle || projectTitle === 'כללי' || projectTitle === 'תיבת המשימות';
    const HeaderIcon = isInboxInHeader ? Inbox : Folder;

    // Format full date (e.g., 21 עבר 2025) or relative (היום, מחר)
    let formattedDateString = 'הוסף תאריך';
    if (targetDate) {
        const d = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateCopy = new Date(d);
        dateCopy.setHours(0, 0, 0, 0);

        const diffTime = dateCopy.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const getNextDay = (dow) => {
            const temp = new Date();
            const diff = (dow - temp.getDay() + 7) % 7;
            temp.setDate(temp.getDate() + (diff === 0 ? 7 : diff));
            temp.setHours(0, 0, 0, 0);
            return temp;
        };

        const saturday = getNextDay(6);
        const nextMonday = getNextDay(1);

        if (diffDays === 0) formattedDateString = 'היום';
        else if (diffDays === 1) formattedDateString = 'מחר';
        else if (diffDays === -1) formattedDateString = 'אתמול';
        else if (dateCopy.getTime() === saturday.getTime()) formattedDateString = 'סוף השבוע';
        else if (dateCopy.getTime() === nextMonday.getTime()) formattedDateString = 'שבוע הבא';
        else {
            const hebrewMonthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
            formattedDateString = `${d.getDate()} ב${hebrewMonthNames[d.getMonth()]} ${d.getFullYear()}`;
        }
    }

    const navBtn = (active) => ({
        border: 'none', background: 'transparent', padding: '6px',
        cursor: active ? 'pointer' : 'not-allowed',
        color: active ? 'var(--text-secondary)' : 'var(--border-color)',
        display: 'flex', opacity: active ? 1 : 0.4, transition: 'opacity 0.15s',
        borderRadius: '4px'
    });

    const actionRowStyle = {
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.8rem 1.25rem',
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border-color)',
        width: '100%',
        textAlign: 'right',
        fontFamily: 'inherit',
        transition: 'background 0.15s'
    };

    const panel = (
        <>
            {/* Backdrop */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />

            {/* Modal Panel */}
            <div ref={panelRef} style={panelStyle} className="hide-scrollbar">

                {/* Header Navbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                    position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10,
                }}>
                    {/* Left side in RTL (Breadcrumbs) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 1, minWidth: 0 }}>
                        <HeaderIcon size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        <span style={{
                            fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                            {headerLabel}
                        </span>
                    </div>

                    {/* Right side in RTL (Actions) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                        <button onClick={goToNext} disabled={!hasNext} style={navBtn(hasNext)} title="משימה הבאה בדפדוף הפוך RTL"><ChevronUp size={20} /></button>
                        <button onClick={goToPrev} disabled={!hasPrev} style={navBtn(hasPrev)} title="משימה קודמת בדפדוף הפוך RTL"><ChevronDown size={20} /></button>

                        <div style={{ position: 'relative' }} ref={moreMenuRef}>
                            <button onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ ...navBtn(true), color: 'var(--text-secondary)' }}>
                                <MoreHorizontal size={20} />
                            </button>
                            {showMoreMenu && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem',
                                    background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    zIndex: 100, minWidth: '150px', overflow: 'hidden'
                                }}>
                                    <button onClick={handleDelete} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                                        padding: '0.7rem 1rem', border: 'none', background: 'transparent',
                                        color: 'var(--danger-color)', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit'
                                    }}>
                                        <Trash2 size={16} /> מחק משימה
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ width: '4px' }} />
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Task Title & Description Area */}
                <div style={{ padding: '1.25rem', paddingBottom: '0.75rem', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Check Circle - Now Priority Aware */}
                        <div
                            onClick={(e) => { e.stopPropagation(); if (onToggleComplete) onToggleComplete(); }}
                            style={{
                                marginTop: '4px', cursor: 'pointer', flexShrink: 0,
                                width: 24, height: 24, borderRadius: '50%',
                                // Professional UI: Border is more saturated, fill is softer
                                border: isCompleted ? 'none' : `2px solid ${priority === 1 ? 'var(--priority-1)' :
                                    priority === 2 ? 'var(--priority-2)' :
                                        priority === 3 ? 'var(--priority-3)' : 'var(--primary-color)'
                                    }`,
                                background: isCompleted ? 'var(--primary-color)' : (
                                    priority !== 4 ? `rgba(${priority === 1 ? '209, 69, 59' :
                                        priority === 2 ? '235, 137, 9' :
                                            '36, 111, 224'
                                        }, 0.12)` : 'transparent'
                                ),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: !isCompleted && priority !== 4 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            {isCompleted && <Check size={14} strokeWidth={3} color="white" />}
                        </div>

                        {/* Text Content */}
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <input
                                type="text"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => handleSave()}
                                onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); handleSave(); } }}
                                placeholder="שם משימה"
                                style={{
                                    width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)',
                                    fontFamily: 'inherit', textDecoration: isCompleted ? 'line-through' : 'none',
                                    opacity: isCompleted ? 0.6 : 1, padding: 0, marginBottom: '0.5rem'
                                }}
                            />

                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => handleSave()}
                                placeholder="≡ תיאור..."
                                rows={2}
                                style={{
                                    width: '100%', border: 'none', outline: 'none', resize: 'none',
                                    fontSize: '0.95rem', background: 'transparent',
                                    color: 'var(--text-secondary)', fontFamily: 'inherit',
                                    padding: 0, lineHeight: 1.5
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Attributes List */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Project Label */}
                    <div style={{ position: 'relative' }}>
                        <button
                            ref={projectBtnRef}
                            onClick={() => setShowProjectSelector(!showProjectSelector)}
                            style={actionRowStyle}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <HeaderIcon size={18} />
                            <span>{headerLabel || 'תיבת המשימות'}</span>
                        </button>
                    </div>

                    <ProjectSelectorDropdown
                        isOpen={showProjectSelector}
                        onClose={() => setShowProjectSelector(false)}
                        anchorRef={projectBtnRef}
                        selectedChecklistId={item.checklist_id}
                        onSelect={(checklist, _project) => {
                            if (checklist && checklist.id !== item.checklist_id) {
                                if (onSave) onSave({ checklist_id: checklist.id });
                            }
                        }}
                    />

                    {/* Due Date & Repeat Row */}
                    <div style={{ position: 'relative' }}>
                        <button
                            ref={dateBtnRef}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            style={{
                                ...actionRowStyle,
                                borderBottom: 'none',
                                color: targetDate ? 'var(--primary-color)' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <CalendarIcon size={18} />
                            <span>{formattedDateString}</span>
                            {repeatRule && <RefreshCw size={14} style={{ marginRight: '0.5rem' }} />}
                        </button>
                    </div>

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
                                <button type="button" onClick={() => { setShowRepeatMenu(!showRepeatMenu); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', background: repeatRule ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
                                        cursor: 'pointer', color: repeatRule ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = repeatRule ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)'}
                                >
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

                    {/* Stub attributes matching design */}
                    <button style={actionRowStyle}><AlarmClock size={18} /><span>תאריך יעד סופי</span></button>

                    {/* Priority Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            ref={priorityBtnRef}
                            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                            style={{
                                ...actionRowStyle,
                                color: priority === 1 ? 'var(--priority-1)' : priority === 2 ? 'var(--priority-2)' : priority === 3 ? 'var(--priority-3)' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Flag size={18} fill={priority !== 4 ? (priority === 1 ? 'var(--priority-1)' : priority === 2 ? 'var(--priority-2)' : 'var(--priority-3)') : 'transparent'} />
                            <span>
                                {priority === 1 ? 'עדיפות 1 (גבוהה ביותר)' : priority === 2 ? 'עדיפות 2' : priority === 3 ? 'עדיפות 3' : 'עדיפות 4 (רגילה)'}
                            </span>
                        </button>

                        {showPriorityMenu && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% - 4px)', left: '1.25rem', right: '1.25rem',
                                background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                                borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                overflow: 'hidden', zIndex: 1000, display: 'flex', flexDirection: 'column'
                            }}>
                                {[
                                    { level: 1, label: 'עדיפות 1', color: 'var(--priority-1)' },
                                    { level: 2, label: 'עדיפות 2', color: 'var(--priority-2)' },
                                    { level: 3, label: 'עדיפות 3', color: 'var(--priority-3)' },
                                    { level: 4, label: 'עדיפות 4', color: 'var(--text-secondary)' }
                                ].map(p => (
                                    <button
                                        key={p.level}
                                        onClick={() => {
                                            setPriority(p.level);
                                            setShowPriorityMenu(false);
                                            if (onSave) onSave({ priority: p.level });
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            width: '100%', padding: '0.75rem 1rem', border: 'none',
                                            background: priority === p.level ? 'var(--dropdown-selected)' : 'transparent',
                                            cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                                            borderBottom: p.level !== 4 ? '1px solid var(--border-color)' : 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (priority !== p.level) e.currentTarget.style.background = 'var(--dropdown-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (priority !== p.level) e.currentTarget.style.background = 'transparent';
                                            else e.currentTarget.style.background = 'var(--dropdown-selected)';
                                        }}
                                    >
                                        <Flag size={16} style={{ color: p.color }} fill={p.level !== 4 ? p.color : 'transparent'} />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: priority === p.level ? 600 : 400 }}>{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reminder Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowReminderMenu(!showReminderMenu)}
                            style={{
                                ...actionRowStyle,
                                color: reminderMinutes !== null ? 'var(--primary-color)' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Bell size={18} />
                            <span>
                                {reminderMinutes === null ? 'תזכורות' : (
                                    reminderMinutes === 0 ? 'בזמן האירוע' :
                                        reminderMinutes === 5 ? '5 דקות לפני' :
                                            reminderMinutes === 15 ? '15 דקות לפני' :
                                                reminderMinutes === 30 ? '30 דקות לפני' :
                                                    reminderMinutes === 60 ? 'שעה לפני' :
                                                        reminderMinutes === 1440 ? 'יום לפני' : 'תזכורת פעילה'
                                )}
                            </span>
                        </button>

                        {showReminderMenu && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% - 4px)', left: '1.25rem', right: '1.25rem',
                                background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                                borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                overflow: 'hidden', zIndex: 1000, display: 'flex', flexDirection: 'column'
                            }}>
                                {[
                                    { value: null, label: 'ללא תזכורת' },
                                    { value: 0, label: 'בזמן האירוע' },
                                    { value: 5, label: '5 דקות לפני' },
                                    { value: 15, label: '15 דקות לפני' },
                                    { value: 30, label: '30 דקות לפני' },
                                    { value: 60, label: 'שעה לפני' },
                                    { value: 1440, label: 'יום לפני' }
                                ].map(opt => (
                                    <button
                                        key={opt.value === null ? 'null' : opt.value}
                                        onClick={() => {
                                            setReminderMinutes(opt.value);
                                            setShowReminderMenu(false);
                                            if (onSave) onSave({ reminder_minutes: opt.value });
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            width: '100%', padding: '0.75rem 1rem', border: 'none',
                                            background: reminderMinutes === opt.value ? 'var(--dropdown-selected)' : 'transparent',
                                            cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                                            borderBottom: opt.value !== 1440 ? '1px solid var(--border-color)' : 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (reminderMinutes !== opt.value) e.currentTarget.style.background = 'var(--dropdown-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (reminderMinutes !== opt.value) e.currentTarget.style.background = 'transparent';
                                            else e.currentTarget.style.background = 'var(--dropdown-selected)';
                                        }}
                                    >
                                        <Bell size={16} style={{ color: reminderMinutes === opt.value ? 'var(--primary-color)' : 'var(--text-secondary)' }} />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: reminderMinutes === opt.value ? 600 : 400 }}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button style={actionRowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Tag size={18} /><span>תוויות</span></button>
                    <button style={actionRowStyle} onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><MapPin size={18} /><span>מיקום</span></button>

                    {/* Add Sub-task */}
                    <button
                        style={{ ...actionRowStyle, marginTop: '0.5rem', borderBottom: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Plus size={18} /><span>הוסף תת-משימה</span>
                    </button>
                </div>

                {/* Filler to push footer down if there is space */}
                <div style={{ flexGrow: 1, minHeight: '40px' }} />

                {/* Footer Comments Area */}
                {/* Task Comments Section - Now Functional */}
                <div style={{
                    padding: '0 1.25rem 1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <MessageSquare size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>תגובות</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '0.2rem'
                    }} className="hide-scrollbar">
                        {loadingComments ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>טוען תגובות...</div>
                        ) : itemComments.length === 0 ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', opacity: 0.6 }}>אין תגובות עדיין. היה הראשון לתמוך!</div>
                        ) : (
                            itemComments.map(comment => (
                                <div key={comment.id} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: comment.user_id === user?.id ? 'var(--primary-color)' : '#94a3b8',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', flexShrink: 0, overflow: 'hidden'
                                    }}>
                                        {comment.profile_image ? (
                                            <img src={`/api${comment.profile_image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            comment.username ? comment.username.charAt(0).toUpperCase() : '?'
                                        )}
                                    </div>
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '0.5rem 0.75rem',
                                        flexGrow: 1,
                                        fontSize: '0.88rem',
                                        color: 'var(--text-primary)',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{comment.username}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {new Date(comment.created_at).toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {comment.content}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>
                </div>

                {/* Footer Comment Input */}
                <div style={{
                    padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-color)', position: 'sticky', bottom: 0,
                    borderRadius: isDesktop ? '0 0 12px 12px' : 0
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '24px', padding: '0.35rem 0.5rem 0.35rem 1rem',
                        transition: 'border-color 0.2s',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                    }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        {/* Current User Avatar */}
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-color)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', flexShrink: 0, overflow: 'hidden'
                        }}>
                            {user?.profile_image ? (
                                <img src={`/api${user.profile_image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : 'אני'}
                        </div>

                        <input
                            type="text"
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && newCommentText.trim()) {
                                    handlePostComment();
                                }
                            }}
                            placeholder="הוסף תגובה..."
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                flexGrow: 1, fontSize: '0.9rem', color: 'var(--text-primary)',
                                fontFamily: 'inherit'
                            }}
                        />

                        <button
                            onClick={handlePostComment}
                            disabled={!newCommentText.trim()}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: newCommentText.trim() ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                transition: 'color 0.2s'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </>
    );

    return createPortal(panel, document.body);
}

// Simple internal icon for Hashes if we don't import one
const HashIcon = ({ size, style }) => (
    <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
);
