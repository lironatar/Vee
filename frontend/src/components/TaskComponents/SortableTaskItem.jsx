import React, { useState, useEffect, useRef, memo } from 'react';
import { CheckCircle, Check, Plus, RefreshCw, GripVertical, Folder } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DatePickerDropdown from '../DatePickerDropdown';
import TimePickerDropdown from '../TimePickerDropdown';
import TaskEditModal from '../TaskEditModal';
import { renderFormattedDate, TIME_OPTIONS, repeatLabels, repeatOptions } from './utils.jsx';

const SortableTaskItem = ({
    item, checklistId, depth = 0, isCompletedFallback = false, useProgressArray = true, todayProgress, addingToItem,
    toggleItem, setAddingToItem, setAddingToList, handleAddItem, handleDeleteItem,
    newItemContent, setNewItemContent, handleSetTargetDate, handleUpdateItem,
    isWaterfalling = false,
    hideAddButton = false,
    isOverlay = false,
    allItems = [],
    sectionTitle = '',
    projectTitle = '',
    compact = false
}) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showRepeatMenu, setShowRepeatMenu] = useState(false);
    const [showTimeMenu, setShowTimeMenu] = useState(false);
    const [editItem, setEditItem] = useState(item);
    const [anchorRect, setAnchorRect] = useState(null);
    const dateRef = useRef(null);
    const timeBtnRef = useRef(null);

    let isCompleted = false;
    if (useProgressArray && todayProgress) {
        const progress = todayProgress.find(p => p.checklist_item_id === item.id);
        isCompleted = progress ? progress.completed === 1 : false;
    } else {
        isCompleted = isCompletedFallback;
    }

    // Determine Priority Color
    // Priority 1: High (Red), 2: Medium (Orange), 3: Low (Blue), 4: Default (Gray)
    const priority = item.priority || 4;
    let priorityColor = 'var(--text-secondary)'; // Default P4
    let priorityHoverColor = '#ccc'; // Default P4 hover

    if (priority === 1) {
        priorityColor = 'var(--priority-1)';
        priorityHoverColor = 'var(--priority-1)';
    } else if (priority === 2) {
        priorityColor = 'var(--priority-2)';
        priorityHoverColor = 'var(--priority-2)';
    } else if (priority === 3) {
        priorityColor = 'var(--priority-3)';
        priorityHoverColor = 'var(--priority-3)';
    }

    const playCompletionSound = () => {
        try {
            // A simple, pleasant pop/ding sound for checking off tasks
            const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    };

    const isAddingHere = addingToItem === item.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        disabled: depth !== 0,
        data: { type: 'Task', item, checklistId }
    });

    useEffect(() => {
        setEditItem(item);
    }, [item]);

    const style = {
        transform: isOverlay ? undefined : CSS.Transform.toString(transform),
        transition: isOverlay ? undefined : transition,
        zIndex: isDragging || isOverlay ? 50 : 'auto',
        position: 'relative'
    };

    return (
        <>
            <div ref={setNodeRef} style={{ ...style, display: 'flex', flexDirection: 'column', paddingRight: isOverlay ? 0 : `${depth * 1.5}rem` }}>
                <div
                    className={`task-item ${isCompleted ? 'is-completed' : ''} ${isOverlay ? 'is-drag-overlay' : isDragging ? 'is-dragging-origin' : ''} ${isWaterfalling ? 'magic-reveal' : ''}`}
                    {...(!isCompleted && depth === 0 ? { ...attributes, ...listeners } : {})}
                    onClick={(e) => {
                        // Prevent click if we were just dragging
                        if (isDragging) return;
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                        setEditItem(item);
                        setShowEditModal(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        background: 'transparent',
                        cursor: (!isCompleted && depth === 0) ? 'grab' : 'pointer',
                        padding: compact ? '6px 8px' : '10px 0',
                        marginBottom: '0',
                        position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                        const actions = e.currentTarget.querySelector('.task-actions');
                        if (actions) actions.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                        const actions = e.currentTarget.querySelector('.task-actions');
                        if (actions) actions.style.opacity = '0';
                    }}
                >
                    <div style={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        minWidth: 0,
                        padding: 0,
                        margin: 0
                    }}>

                        <div
                            className="check-circle"
                            style={{
                                color: isCompleted ? 'var(--success-color)' : priorityColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '20px', // slightly larger for easier click
                                width: '20px',
                                flexShrink: 0,
                                marginTop: '0',
                                position: 'relative'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isCompleted) {
                                    playCompletionSound();
                                }
                                toggleItem(item.id, isCompleted);
                            }}
                        >
                            {isCompleted
                                ? (
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '6px',
                                            background: 'var(--success-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div
                                        className="empty-circle-container"
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: `1.5px solid ${priority === 4 ? '#d1d1d6' : priorityColor}`,
                                            background: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f2f2f7';
                                            e.currentTarget.style.borderColor = priority === 4 ? '#c7c7cc' : priorityColor;
                                            const check = e.currentTarget.querySelector('.hover-check');
                                            if (check) check.style.opacity = 0.5;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = priority === 4 ? '#d1d1d6' : priorityColor;
                                            const check = e.currentTarget.querySelector('.hover-check');
                                            if (check) check.style.opacity = 0;
                                        }}
                                    >
                                        <Check
                                            className="hover-check"
                                            size={10}
                                            strokeWidth={3}
                                            style={{ color: priority === 4 ? '#8e8e93' : priorityColor, opacity: 0, transition: 'opacity 0.2s' }}
                                        />
                                    </div>
                                )}
                        </div>

                        <div style={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            minWidth: 0,
                        }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1,
                                width: '100%',
                                gap: '2px',
                                opacity: isCompleted ? 0.5 : 1,
                                transition: 'opacity 0.2s',
                                overflow: 'hidden',
                                textAlign: 'right',
                                paddingTop: '0'
                            }}>
                                <span
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        color: isCompleted ? '#8e8e93' : '#1c1c1e',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.4',
                                        display: 'block'
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: item.content
                                    }}
                                />
                                {(item.target_date || item.projectTitle) && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        flexWrap: 'wrap',
                                        rowGap: '4px',
                                        columnGap: '8px',
                                        width: '100%',
                                        marginTop: '4px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {item.target_date && (
                                                <div
                                                    ref={dateRef}
                                                    onClick={(e) => { e.stopPropagation(); setShowDatePicker(true); }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {renderFormattedDate(item.target_date)}
                                                </div>
                                            )}
                                        </div>

                                        {item.projectTitle && (
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexShrink: 0
                                            }}>
                                                <span style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left' }}>
                                                    {item.checklistTitle && item.checklistTitle !== item.projectTitle && item.projectTitle !== 'כללי' && item.checklistTitle !== 'כללי'
                                                        ? `${item.projectTitle} / ${item.checklistTitle}`
                                                        : item.projectTitle === 'כללי' || !item.projectTitle ? 'תיבת המשימות' : item.projectTitle}
                                                </span>
                                                {item.projectTitle === 'כללי' || !item.projectTitle ? '🗳️' : <Folder size={12} style={{ opacity: 0.6 }} />}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {showDatePicker && (
                                    <DatePickerDropdown
                                        isOpen={showDatePicker}
                                        onClose={() => setShowDatePicker(false)}
                                        anchorRef={dateRef}
                                        selectedDate={item.target_date}
                                        selectedTime={item.time}
                                        onSelectDate={(dateValue) => handleSetTargetDate(item.id, dateValue)}
                                    >
                                        <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowTimeMenu(!showTimeMenu); setShowRepeatMenu(false); }}
                                                    ref={timeBtnRef}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
                                                        borderRadius: 'var(--radius-sm)', background: item.time ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
                                                        cursor: 'pointer', color: item.time ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit'
                                                    }}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                    {item.time || 'זמן'}
                                                </button>

                                                <TimePickerDropdown
                                                    isOpen={showTimeMenu}
                                                    onClose={() => setShowTimeMenu(false)}
                                                    anchorRef={timeBtnRef}
                                                    initialTime={item.time}
                                                    timeOptions={TIME_OPTIONS}
                                                    onSave={(val) => {
                                                        if (handleUpdateItem) handleUpdateItem(item.id, { time: val });
                                                    }}
                                                />
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowRepeatMenu(!showRepeatMenu); setShowTimeMenu(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                        width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)',
                                                        borderRadius: 'var(--radius-sm)', background: item.repeat_rule ? 'rgba(var(--primary-rgb,200,120,20),0.06)' : 'var(--bg-color)',
                                                        cursor: 'pointer', color: item.repeat_rule ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                        fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit'
                                                    }}>
                                                    <RefreshCw size={15} />
                                                    {item.repeat_rule ? repeatLabels[item.repeat_rule] : 'חזרה'}
                                                </button>

                                                {showRepeatMenu && (
                                                    <div style={{
                                                        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                                                        background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                                                        borderRadius: '10px', boxShadow: '0 -6px 24px rgba(0,0,0,0.12)',
                                                        overflow: 'hidden', zIndex: 220,
                                                    }}>
                                                        {repeatOptions.map((opt, i) => (
                                                            <button key={i} onClick={(e) => {
                                                                e.stopPropagation();
                                                                const val = opt.value === 'none' ? null : opt.value;
                                                                if (handleUpdateItem) handleUpdateItem(item.id, { repeat_rule: val });
                                                                setShowRepeatMenu(false);
                                                            }}
                                                                style={{
                                                                    display: 'block', width: '100%', padding: '0.6rem 1rem', border: 'none',
                                                                    background: item.repeat_rule === opt.value ? 'var(--bg-secondary)' : 'transparent',
                                                                    cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.87rem',
                                                                    textAlign: 'right', fontFamily: 'inherit', fontWeight: item.repeat_rule === opt.value ? 600 : 400
                                                                }}>
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </DatePickerDropdown>
                                )}
                            </div>

                            <div className="task-actions minimal-actions" style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }} onClick={e => e.stopPropagation()}>
                                {depth === 0 && setAddingToItem && setAddingToList && !hideAddButton && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setAddingToItem(isAddingHere ? null : item.id); setAddingToList(null); setNewItemContent(''); }}
                                        className="btn-icon-soft" title="הוסף תת-משימה" style={{ padding: '0.15rem', color: 'var(--text-secondary)' }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isAddingHere && handleAddItem && !hideAddButton && (
                    <form onSubmit={(e) => { handleAddItem(e, checklistId, item.id, newItemContent); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', paddingRight: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="הכנס תת-משימה חדשה..."
                            value={newItemContent}
                            onChange={(e) => setNewItemContent(e.target.value)}
                            autoFocus
                            style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>הוסף</button>
                    </form>
                )}

                {item.children && item.children.length > 0 && (
                    <div className="subtasks-container" style={{ borderRight: '2px solid var(--border-color)', paddingRight: '0.5rem', marginRight: '0.75rem', marginBottom: '0.5rem' }}>
                        {item.children.map(child => (
                            <SortableTaskItem
                                key={child.id} item={child} checklistId={checklistId} depth={depth + 1}
                                todayProgress={todayProgress} addingToItem={addingToItem}
                                toggleItem={toggleItem} setAddingToItem={setAddingToItem} setAddingToList={setAddingToList}
                                handleAddItem={handleAddItem} handleDeleteItem={handleDeleteItem}
                                newItemContent={newItemContent} setNewItemContent={setNewItemContent}
                                handleSetTargetDate={handleSetTargetDate}
                                handleUpdateItem={handleUpdateItem}
                                allItems={allItems}
                                isCompletedFallback={isCompletedFallback} useProgressArray={useProgressArray}
                                sectionTitle={sectionTitle} projectTitle={projectTitle}
                                isWaterfalling={isWaterfalling}
                                hideAddButton={hideAddButton}
                                isOverlay={isOverlay}
                                compact={compact}
                            />
                        ))}
                    </div>
                )}
            </div >

            {showEditModal && (
                <TaskEditModal
                    item={editItem}
                    sectionTitle={sectionTitle}
                    projectTitle={projectTitle}
                    allItems={allItems}
                    anchorRect={anchorRect}
                    isOpen={showEditModal}
                    onClose={() => { setShowEditModal(false); setEditItem(item); }}
                    isCompleted={useProgressArray && todayProgress
                        ? (todayProgress.find(p => p.checklist_item_id === editItem.id)?.completed === 1)
                        : isCompletedFallback}
                    onToggleComplete={() => {
                        const editItemCompleted = useProgressArray && todayProgress
                            ? (todayProgress.find(p => p.checklist_item_id === editItem.id)?.completed === 1)
                            : isCompletedFallback;
                        toggleItem(editItem.id, editItemCompleted);
                    }}
                    onSave={(updatedFields) => {
                        if (handleUpdateItem) handleUpdateItem(editItem.id, updatedFields);
                    }}
                    onDelete={() => handleDeleteItem({}, editItem.id, checklistId)}
                    onNavigate={(nextItem) => setEditItem(nextItem)}
                />
            )}
        </>
    );
};

// Custom comparison function to determine if the component needs to re-render
const areEqual = (prevProps, nextProps) => {
    // 1. Check if the core item data has changed (title, completed status, priority, time)
    if (prevProps.item.id !== nextProps.item.id) return false;
    if (prevProps.item.content !== nextProps.item.content) return false;
    if (prevProps.item.priority !== nextProps.item.priority) return false;
    if (prevProps.item.target_date !== nextProps.item.target_date) return false;
    if (prevProps.item.time !== nextProps.item.time) return false;
    if (prevProps.item.projectTitle !== nextProps.item.projectTitle) return false;
    if (prevProps.item.checklistTitle !== nextProps.item.checklistTitle) return false;
    if (prevProps.item.repeat_rule !== nextProps.item.repeat_rule) return false;
    
    // Check if children lengths changed (simple check for subtasks)
    if ((prevProps.item.children?.length || 0) !== (nextProps.item.children?.length || 0)) return false;

    // 2. Check if the visual state we care about has changed
    const prevCompleted = prevProps.useProgressArray && prevProps.todayProgress 
        ? prevProps.todayProgress.find(p => p.checklist_item_id === prevProps.item.id)?.completed === 1 
        : prevProps.isCompletedFallback;
    const nextCompleted = nextProps.useProgressArray && nextProps.todayProgress 
        ? nextProps.todayProgress.find(p => p.checklist_item_id === nextProps.item.id)?.completed === 1 
        : nextProps.isCompletedFallback;
    if (prevCompleted !== nextCompleted) return false;

    // 3. Check UI states
    if (prevProps.isOverlay !== nextProps.isOverlay) return false;
    if (prevProps.isWaterfalling !== nextProps.isWaterfalling) return false;
    if (prevProps.addingToItem !== nextProps.addingToItem) return false;
    if (prevProps.hideAddButton !== nextProps.hideAddButton) return false;
    if (prevProps.depth !== nextProps.depth) return false;
    if (prevProps.compact !== nextProps.compact) return false;
    
    // We do NOT check callback functions like toggleItem, since they are often un-memoized 
    // and would break the optimization. We assume the functions don't change in ways that matter.

    // If we get here, the component doesn't need to visually change
    return true; 
};

export default memo(SortableTaskItem, areEqual);
