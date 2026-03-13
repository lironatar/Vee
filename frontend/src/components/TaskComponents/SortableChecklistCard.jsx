import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import ActionMenu from './ActionMenu';
import SortableTaskItem from './SortableTaskItem';
import AddTaskCard from './AddTaskCard';
import AddTaskButton from './AddTaskButton';
import { API_URL } from './utils.jsx';

const SortableChecklistCard = ({
    checklist, idx, expandedChecklists, toggleChecklistExpanded, handleDeleteChecklist,
    todayProgress, sensors, handleDragEnd,
    addingToList, addingToItem, toggleItem, setAddingToItem, setAddingToList, handleAddItem, handleDeleteItem, newItemContent, setNewItemContent, buildHierarchy, calculateProgress,
    handleUpdateItem: handleUpdateItemProp,
    projectTitle = '',
    useSharedDndContext = false,
    useProgressArray = false,
    setIsCreatingList,
    defaultItemDate = null,
    hideTaskCount = false,
    isFlatList = false,
    overrideChecklistForAdd = null,
    expanded,
    onToggleExpand,
    onDeleteChecklist,
    onAddItem,
    onDeleteItem,
    onUpdateItem,
    onToggleItem,
    defaultProject = null,
    visibleTaskIds = null,
    isWaterfalling = false,
    className = '',
    hideAddButton = false
}) => {
    // Local update handler — calls PUT /api/items/:itemId and updates UI eventually via parent reload / socket
    const handleUpdateItem = onUpdateItem || handleUpdateItemProp || ((itemId, updates) => {
        fetch(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }).catch(err => console.error('Failed to update task', err));
    });

    const activeToggleItem = onToggleItem || toggleItem;
    const activeAddItem = onAddItem || handleAddItem;
    const activeDeleteItem = onDeleteItem || handleDeleteItem;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: checklist.id,
        data: { type: 'Checklist', checklist }
    });

    const appliedStyle = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: isDragging ? 'relative' : 'static',
        zIndex: isDragging ? 50 : 'auto',
        padding: 0,
        overflow: 'visible',
        paddingRight: '0'
    };

    const hierarchicalItemsRaw = buildHierarchy ? buildHierarchy(checklist.items) : checklist.items;
    const hierarchicalItems = (isWaterfalling && visibleTaskIds)
        ? hierarchicalItemsRaw.filter(item => visibleTaskIds.has(item.id))
        : hierarchicalItemsRaw;
    const progressPercent = calculateProgress ? calculateProgress(checklist.items) : 0;

    // Support both ways of passing expansion state
    const isExpanded = isFlatList ? true : (expanded !== undefined ? expanded : (expandedChecklists ? expandedChecklists[checklist.id] : true));
    const isAddingRootTask = addingToList === checklist.id;

    // Local state for the inline date picker when creating tasks
    const [newItemDate, setNewItemDate] = useState(defaultItemDate);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleEditTitleSubmit = async () => {
        setIsEditingTitle(false);
        if (!tempTitle.trim() || tempTitle === checklist.title) return;
        try {
            await fetch(`${API_URL}/checklists/${checklist.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: tempTitle })
            });
            window.dispatchEvent(new CustomEvent('refreshTasks'));
            window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
        } catch (err) { console.error(err); }
    };

    const handleCompleteAll = async () => {
        if (!checklist.items) return;
        if (!window.confirm("האם כל המשימות ברשימה זו בוצעו?")) return;
        
        for (const item of checklist.items) {
            let isCompleted = false;
            if (useProgressArray && todayProgress) {
                isCompleted = todayProgress.some(p => p.checklist_item_id === item.id && p.completed === 1);
            } else {
                isCompleted = item.completed;
            }
            if (!isCompleted) {
                if (onToggleItem) onToggleItem(item.id, false);
                else if (toggleItem) toggleItem(item.id, false);
            }
        }
    };

    const handleSetTargetDate = async (itemId, date) => {
        handleUpdateItem(itemId, { target_date: date || null });
    };

    return (
        <div ref={setNodeRef} style={{ ...appliedStyle, marginBottom: '0rem' }} className={`checklist-minimal ${className}`}>
            {!isFlatList && checklist.title !== '' && (
                <div
                    className="checklist-header"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '1.25rem', // Added padding to compensate for stickiness
                        paddingBottom: '0.75rem',
                        marginTop: '0.5rem',
                        direction: 'rtl',
                        gap: '0.5rem',
                        position: 'sticky',
                        top: '-1px', // Sticky at the very top of page-content
                        zIndex: isMenuOpen ? 200 : 40, // Lift when menu is open to stay on top
                        background: 'var(--bg-color)', // Solid background to cover tasks
                        borderBottom: '1px solid transparent',
                        transition: 'all 0.2s ease',
                        marginRight: '-1rem', // Pull out slightly for better alignment if needed
                        paddingRight: '1rem',
                        WebkitTapHighlightColor: 'transparent' // Prevent mobile tap background
                    }}
                >
                    <span 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleExpand) onToggleExpand(checklist.id);
                            else if (toggleChecklistExpanded) toggleChecklistExpanded(checklist.id);
                        }}
                        style={{
                            position: 'absolute',
                            right: '-8px', // Adjusted to stay within the sticky container
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            width: '24px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '24px',
                            opacity: 1,
                            zIndex: 10,
                            cursor: 'pointer'
                        }}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                    </span>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexGrow: 1,
                        padding: '0',
                        margin: 0
                    }}>
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={handleEditTitleSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditTitleSubmit();
                                    if (e.key === 'Escape') setIsEditingTitle(false);
                                }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: 'var(--primary-color)',
                                    letterSpacing: '-0.5px',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    padding: 0,
                                    fontFamily: 'inherit'
                                }}
                            />
                        ) : (
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 700,
                                color: 'var(--primary-color)',
                                userSelect: 'none',
                                letterSpacing: '-0.5px'
                            }}>
                                {checklist.title}
                            </h3>
                        )}
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {!hideTaskCount && hierarchicalItems.length > 0 ? hierarchicalItems.length : ''}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', opacity: 1, transition: 'opacity 0.2s', marginRight: 'auto' }} className="checklist-actions">
                            <ActionMenu 
                                onDelete={(e) => {
                                    if (onDeleteChecklist) onDeleteChecklist(e, checklist.id);
                                    else if (handleDeleteChecklist) handleDeleteChecklist(e, checklist.id);
                                }} 
                                onEdit={() => { setIsEditingTitle(true); setTempTitle(checklist.title); }}
                                onComplete={handleCompleteAll}
                                onOpenChange={setIsMenuOpen}
                                size={16} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {isExpanded && (
                <div style={{ padding: '0', background: 'transparent' }} onClick={e => e.stopPropagation()}>
                    {useSharedDndContext ? (
                        <SortableContext
                            id={checklist.id.toString()}
                            items={hierarchicalItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '10px', paddingRight: 0 }}>
                                {hierarchicalItems.map(item => (
                                    <SortableTaskItem
                                        key={item.id} item={item} checklistId={checklist.id}
                                        sectionTitle={checklist.title}
                                        projectTitle={projectTitle}
                                        allItems={hierarchicalItems}
                                        todayProgress={todayProgress} addingToItem={addingToItem}
                                        toggleItem={activeToggleItem} setAddingToItem={setAddingToItem} setAddingToList={setAddingToList}
                                        handleAddItem={activeAddItem} handleDeleteItem={activeDeleteItem}
                                        newItemContent={newItemContent} setNewItemContent={setNewItemContent}
                                        handleSetTargetDate={handleSetTargetDate}
                                        useProgressArray={useProgressArray}
                                        isCompletedFallback={item.completed}
                                        hideAddButton={hideAddButton}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={pointerWithin}
                            onDragEnd={(e) => handleDragEnd(e, checklist.id)}
                        >
                            <SortableContext
                                id={checklist.id.toString()}
                                items={hierarchicalItems.map(i => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0px', paddingRight: 0 }}>
                                    {hierarchicalItems.map(item => (
                                        <SortableTaskItem
                                            key={item.id} item={item} checklistId={checklist.id}
                                            sectionTitle={checklist.title}
                                            projectTitle={projectTitle}
                                            allItems={hierarchicalItems}
                                            todayProgress={todayProgress} addingToItem={addingToItem}
                                            toggleItem={activeToggleItem} setAddingToItem={setAddingToItem} setAddingToList={setAddingToList}
                                            handleAddItem={activeAddItem} handleDeleteItem={activeDeleteItem}
                                            newItemContent={newItemContent} setNewItemContent={setNewItemContent}
                                            handleSetTargetDate={handleSetTargetDate}
                                            useProgressArray={useProgressArray}
                                            isCompletedFallback={item.completed}
                                            isWaterfalling={isWaterfalling}
                                            hideAddButton={hideAddButton}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {!hideAddButton && (
                        <div style={{ marginTop: '0rem' }}>
                            {isAddingRootTask ? (
                                <AddTaskCard
                                    newItemContent={newItemContent}
                                    setNewItemContent={setNewItemContent}
                                    newItemDate={newItemDate}
                                    setNewItemDate={setNewItemDate}
                                    checklist={overrideChecklistForAdd || checklist}
                                    defaultProject={defaultProject}
                                    setAddingToList={setAddingToList}
                                    handleAddItem={activeAddItem}
                                    suppressDateSpan={newItemDate === defaultItemDate}
                                />
                            ) : (
                                <AddTaskButton noMarginTop={true} onClick={() => { if (setAddingToList) setAddingToList(checklist.id); if (setAddingToItem) setAddingToItem(null); if (setNewItemContent) setNewItemContent(''); }} />
                            )}
                        </div>
                    )}

                    {setIsCreatingList && !hideAddButton && (
                        <button
                            type="button"
                            className="add-section-divider"
                            onMouseDown={(e) => { e.stopPropagation(); setIsCreatingList(checklist.id); }}
                        >
                            + הוסף רשימה
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SortableChecklistCard;
