import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Check, Plus, RefreshCw, GripVertical } from 'lucide-react';
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
    sectionTitle = '', projectTitle = '', allItems = [], isOverlay = false
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
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging || isOverlay ? 50 : 'auto',
        position: 'relative'
    };

    return (
        <>
            <div ref={setNodeRef} style={{ ...style, display: 'flex', flexDirection: 'column', paddingRight: `${depth * 1.5}rem` }}>
                <div
                    className={`task-item ${isCompleted ? 'is-completed' : ''} ${isOverlay ? 'is-drag-overlay' : isDragging ? 'is-dragging-origin' : ''}`}
                    onClick={(e) => {
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                        setEditItem(item);
                        setShowEditModal(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        borderBottom: '1px solid var(--border-color)',
                        padding: '8px 0',
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        right: '-24px',
                        width: '24px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        height: '24px',
                        zIndex: 10,
                        marginTop: '0'
                    }}>
                        {!isCompleted && depth === 0 && (
                            <div
                                className="drag-handle"
                                {...attributes}
                                {...listeners}
                                style={{
                                    cursor: 'grab',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '20px'
                                }}
                            >
                                <GripVertical size={16} />
                            </div>
                        )}
                    </div>

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
                                color: isCompleted ? 'var(--success-color)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '18px',
                                width: '18px',
                                flexShrink: 0,
                                marginTop: '0'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item.id, isCompleted);
                            }}
                        >
                            {isCompleted
                                ? (
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            background: 'var(--success-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}
                                    >
                                        <CheckCircle size={10} strokeWidth={2.4} />
                                    </div>
                                ) : (
                                    <div
                                        className="empty-circle-container"
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: '1.5px solid #ccc',
                                            background: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Check
                                            className="hover-check"
                                            size={10}
                                            strokeWidth={2.6}
                                            style={{ color: '#ccc', opacity: 0, transition: 'opacity 0.2s' }}
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
                                        fontSize: '15.5px',
                                        fontWeight: 400,
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: '20px',
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
                                        justifyContent: 'space-between',
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
                                                <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.checklistTitle && item.checklistTitle !== item.projectTitle && item.projectTitle !== 'כללי' && item.checklistTitle !== 'כללי'
                                                        ? `${item.projectTitle} / ${item.checklistTitle}`
                                                        : item.projectTitle === 'כללי' || !item.projectTitle ? 'תיבת דואר' : item.projectTitle}
                                                </span>
                                                {item.projectTitle === 'כללי' || !item.projectTitle ? '🗳️' : '#'}
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
                                {depth === 0 && setAddingToItem && setAddingToList && (
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

                {isAddingHere && handleAddItem && (
                    <form onSubmit={(e) => { handleAddItem(e, checklistId, item.id); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', paddingRight: '1.5rem' }} onClick={e => e.stopPropagation()}>
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

export default SortableTaskItem;
