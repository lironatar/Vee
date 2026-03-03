import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, X, ArrowLeft, ChevronDown } from 'lucide-react';
import SmartInput from '../SmartInput';
import DatePickerDropdown from '../DatePickerDropdown';
import TimePickerDropdown from '../TimePickerDropdown';
import { getRandomTaskPlaceholder } from '../../utils/taskPlaceholders';
import ProjectSelectorDropdown from './ProjectSelectorDropdown';
import { hebrewDayNames, hebrewMonthNames, TIME_OPTIONS, getDateDisplayInfo } from './utils.jsx';

const AddTaskCard = ({ newItemContent, setNewItemContent, newItemDate, setNewItemDate, checklist, setAddingToList, handleAddItem, suppressDateSpan = false }) => {
    const [description, setDescription] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showRepeatMenu, setShowRepeatMenu] = useState(false);
    const [showTimeMenu, setShowTimeMenu] = useState(false);
    const [repeatRule, setRepeatRule] = useState(null);
    const [time, setTime] = useState('');
    const [dynamicPlaceholder, setDynamicPlaceholder] = useState(() => getRandomTaskPlaceholder());
    const [selectedChecklist, setSelectedChecklist] = useState(checklist);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const inputContainerRef = useRef(null);

    useEffect(() => {
        setSelectedChecklist(checklist);
    }, [checklist]);

    const dateBtnRef = useRef(null);
    const timeBtnRef = useRef(null);
    const projectBtnRef = useRef(null);

    const today = new Date();

    const repeatOptions = [
        { label: 'כל יום', value: 'daily' },
        { label: `כל שבוע ביום ${hebrewDayNames[today.getDay()]} `, value: 'weekly' },
        { label: 'כל יום חול (א׳-ה׳)', value: 'weekdays' },
        { label: `כל חודש בתאריך ${today.getDate()} `, value: 'monthly' },
        { label: `כל שנה ב - ${today.getDate()} ב${hebrewMonthNames[today.getMonth()]} `, value: 'yearly' },
        { label: 'מותאם אישית...', value: 'custom' },
    ];

    const repeatLabels = { daily: 'כל יום', weekly: 'שבועי', weekdays: 'ימי חול', monthly: 'חודשי', yearly: 'שנתי', custom: 'מותאם' };

    const smartInputRef = useRef(null);

    const handleSubmit = (e, explicitContent = null) => {
        let plainText;
        if (explicitContent !== null) {
            plainText = explicitContent.replace(/<[^>]*>?/gm, '').trim();
        } else {
            // Fallback to ref or state
            const raw = smartInputRef.current
                ? (smartInputRef.current.innerText || smartInputRef.current.textContent)
                : newItemContent;
            plainText = raw.replace(/<[^>]*>?/gm, '').trim();
        }

        if (!plainText) return;

        e.preventDefault();
        window.globalNewItemContent = plainText;
        window.globalNewItemDesc = description;
        window.globalNewItemDate = newItemDate || null;
        window.globalNewItemRepeatRule = repeatRule || null;
        window.globalNewItemTime = time || null;

        handleAddItem(e, selectedChecklist?.id || checklist.id, null, plainText);

        setNewItemContent('');
        setDescription('');
        setTime('');
        setNewItemDate('');
        setRepeatRule(null);
        setDynamicPlaceholder(getRandomTaskPlaceholder());

        if (inputContainerRef.current) {
            const input = inputContainerRef.current.querySelector('.smart-input-area');
            if (input) input.focus();
        }
    };

    const pillStyle = (active, customColor) => ({
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${customColor ? customColor : (active ? 'var(--primary-color)' : 'var(--border-color)')} `,
        background: active ? 'color-mix(in srgb, var(--primary-color) 8%, transparent)' : 'var(--bg-color)',
        color: customColor ? customColor : (active ? 'var(--primary-color)' : 'var(--text-secondary)'),
        cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        fontWeight: customColor ? 600 : 400
    });

    const bottomBtn = (isActive) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        background: isActive ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
        cursor: 'pointer',
        color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit',
        transition: 'background 0.12s',
    });

    return (
        <div className="add-task-card-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'visible', position: 'relative', background: 'var(--bg-color)', boxShadow: 'var(--glass-shadow)', transition: 'var(--transition)' }}>
            <div style={{ padding: '0.4rem 0.6rem' }}>
                <div
                    ref={inputContainerRef}
                    style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.2rem', width: '100%', cursor: 'text' }}
                    onClick={(e) => {
                        const input = e.currentTarget.querySelector('.smart-input-area');
                        if (input) input.focus();
                    }}
                >
                    {newItemDate && !suppressDateSpan && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: getDateDisplayInfo(newItemDate).color,
                            fontWeight: 600, fontSize: '0.85em', cursor: 'pointer', zIndex: 10,
                            userSelect: 'none'
                        }} onClick={(e) => { e.stopPropagation(); setShowDateDropdown(true); }}>
                            {(() => {
                                const { text } = getDateDisplayInfo(newItemDate);
                                return <>{text} {time ? time : ''}</>;
                            })()}
                        </div>
                    )}

                    <SmartInput
                        ref={smartInputRef}
                        html={newItemContent}
                        setHtml={setNewItemContent}
                        placeholder={(!newItemContent || newItemContent === '<br>') ? dynamicPlaceholder : ''}
                        autoFocus={true}
                        date={newItemDate}
                        time={time}
                        showSpan={false}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const currentContent = e.target.innerText || e.target.textContent;
                                handleSubmit(e, currentContent);
                            }
                        }}
                        style={{ minWidth: '80px', flexGrow: 1, border: 'none', outline: 'none', fontSize: '16px', fontWeight: 500, background: 'transparent', color: 'var(--text-primary)', padding: 0 }}
                    />
                </div>

                <input
                    type="text"
                    placeholder="תיאור"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', fontWeight: 400, background: 'transparent', color: 'var(--text-secondary)', padding: 0 }}
                />
            </div>

            <div style={{ padding: '0.2rem 0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${newItemDate ? getDateDisplayInfo(newItemDate).color : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-color)'}
                >
                    <button
                        ref={dateBtnRef}
                        type="button"
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: newItemDate ? '0.3rem 0.6rem 0.3rem 0.2rem' : '0.3rem 0.6rem',
                            border: 'none',
                            background: 'transparent',
                            color: newItemDate ? getDateDisplayInfo(newItemDate).color : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap',
                            fontFamily: 'inherit',
                            fontWeight: newItemDate ? 600 : 500
                        }}
                    >
                        <CalendarIcon size={14} style={{ opacity: 0.8 }} />
                        {newItemDate ? getDateDisplayInfo(newItemDate).text : 'תאריך'}
                    </button>
                    {newItemDate && (
                        <div style={{ padding: '0 0.15rem 0 0.15rem', display: 'flex', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNewItemDate('');
                                    setTime('');
                                    setRepeatRule(null);
                                    setShowDateDropdown(false);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0.15rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s, color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F5F5F5';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <DatePickerDropdown
                        isOpen={showDateDropdown}
                        onClose={() => setShowDateDropdown(false)}
                        anchorRef={dateBtnRef}
                        selectedDate={newItemDate}
                        selectedTime={time}
                        onSelectDate={(date) => {
                            setNewItemDate(date);
                            setTimeout(() => {
                                if (inputContainerRef.current) {
                                    const input = inputContainerRef.current.querySelector('.smart-input-area');
                                    if (input) input.focus();
                                }
                            }, 10);
                        }}
                    >
                        <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ position: 'relative' }}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowTimeMenu(!showTimeMenu); setShowRepeatMenu(false); }}
                                    ref={timeBtnRef}
                                    style={bottomBtn(!!time)}
                                    onMouseEnter={e => { if (!time) e.currentTarget.style.background = '#F5F5F5'; }}
                                    onMouseLeave={e => { if (!time) e.currentTarget.style.background = 'var(--bg-color)'; }}>
                                    <Clock size={15} />
                                    {time || 'זמן'}
                                </button>

                                <TimePickerDropdown
                                    isOpen={showTimeMenu}
                                    onClose={() => setShowTimeMenu(false)}
                                    anchorRef={timeBtnRef}
                                    initialTime={time}
                                    timeOptions={TIME_OPTIONS}
                                    onSave={(val) => setTime(val)}
                                />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowRepeatMenu(!showRepeatMenu); setShowTimeMenu(false); }}
                                    style={bottomBtn(!!repeatRule)}
                                    onMouseEnter={e => { if (!repeatRule) e.currentTarget.style.background = '#F5F5F5'; }}
                                    onMouseLeave={e => { if (!repeatRule) e.currentTarget.style.background = 'var(--bg-color)'; }}>
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
                                            <button key={i} onClick={() => { setRepeatRule(opt.value === 'custom' ? null : opt.value); setShowRepeatMenu(false); }}
                                                style={{
                                                    display: 'block', width: '100%', padding: '0.6rem 1rem', border: 'none',
                                                    background: repeatRule === opt.value ? '#F5F5F5' : 'transparent',
                                                    cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.87rem',
                                                    textAlign: 'right', fontFamily: 'inherit',
                                                    fontWeight: repeatRule === opt.value ? 600 : 400,
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                                                onMouseLeave={e => e.currentTarget.style.background = repeatRule === opt.value ? '#F5F5F5' : 'transparent'}>
                                                {opt.label}
                                            </button>
                                        ))}
                                        {repeatRule && (
                                            <>
                                                <div style={{ height: '1px', background: 'var(--border-color)' }} />
                                                <button onClick={() => { setRepeatRule(null); setShowRepeatMenu(false); }}
                                                    style={{
                                                        display: 'block', width: '100%', padding: '0.6rem 1rem', border: 'none',
                                                        background: 'transparent', cursor: 'pointer', color: '#d1453b', fontSize: '0.87rem',
                                                        textAlign: 'right', fontWeight: 500, fontFamily: 'inherit',
                                                        transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    הסר חזרה
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DatePickerDropdown>
                </div>

                <button type="button" style={{ ...pillStyle(false), transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-color)'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    עדיפות
                </button>

                {repeatRule && (
                    <span style={{ ...pillStyle(true), cursor: 'default' }}>
                        <RefreshCw size={12} />
                        {repeatLabels[repeatRule]}
                    </span>
                )}
            </div>

            <ProjectSelectorDropdown
                isOpen={showProjectSelector}
                onClose={() => setShowProjectSelector(false)}
                anchorRef={projectBtnRef}
                selectedChecklistId={selectedChecklist?.id}
                onSelect={(cl, proj) => {
                    setSelectedChecklist(cl);
                    setSelectedProject(proj);
                }}
            />

            <div style={{ padding: '0.4rem 0.6rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', justifyContent: 'flex-start' }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexGrow: 1 }}>
                        <button
                            ref={projectBtnRef}
                            onClick={() => setShowProjectSelector(!showProjectSelector)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.5rem',
                                background: showProjectSelector ? 'var(--hover-bg)' : 'transparent',
                                border: '1px solid transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'inherit',
                                fontWeight: 500,
                                transition: 'var(--transition)',
                                marginLeft: 'auto'
                            }}
                            onMouseEnter={e => !showProjectSelector && (e.currentTarget.style.background = 'var(--hover-bg)')}
                            onMouseLeave={e => !showProjectSelector && (e.currentTarget.style.background = 'transparent')}
                        >
                            {selectedProject ? `${selectedProject.title} / ` : ''}
                            {selectedChecklist?.title || (selectedProject ? selectedProject.title : 'תיבת דואר')}
                            <ChevronDown size={14} style={{ marginRight: '0.25rem' }} />
                        </button>
                    </div>

                    <button type="button" onClick={() => { if (setAddingToList) setAddingToList(null); }} className="desktop-only" style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.87rem', transition: 'var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        ביטול
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={!newItemContent.trim()} className="desktop-only"
                        style={{ padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', background: newItemContent.trim() ? 'var(--primary-color)' : 'rgba(var(--primary-rgb, 209, 87, 0), 0.4)', color: 'var(--btn-text-primary, white)', cursor: newItemContent.trim() ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.87rem', transition: 'var(--transition)', boxShadow: newItemContent.trim() ? '0 2px 6px rgba(var(--primary-rgb, 209, 87, 0), 0.3)' : 'none' }}>
                        הוסף משימה
                    </button>
                    <button type="button" onClick={() => { if (setAddingToList) setAddingToList(null); }} className="mobile-only" style={{ padding: '0.5rem', border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <X size={20} />
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={!newItemContent.trim()} className="mobile-only"
                        style={{ padding: '0.5rem', border: 'none', background: newItemContent.trim() ? 'var(--primary-color)' : 'rgba(209,87,0,0.5)', color: 'var(--btn-text-primary, white)', borderRadius: 'var(--radius-sm)', cursor: newItemContent.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTaskCard;
