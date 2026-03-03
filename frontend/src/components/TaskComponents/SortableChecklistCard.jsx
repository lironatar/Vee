import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
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
    onToggleItem
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

    const hierarchicalItems = buildHierarchy ? buildHierarchy(checklist.items) : checklist.items;
    const progressPercent = calculateProgress ? calculateProgress(checklist.items) : 0;

    // Support both ways of passing expansion state
    const isExpanded = isFlatList ? true : (expanded !== undefined ? expanded : (expandedChecklists ? expandedChecklists[checklist.id] : true));
    const isAddingRootTask = addingToList === checklist.id;

    // Local state for the inline date picker when creating tasks
    const [newItemDate, setNewItemDate] = useState(defaultItemDate);

    const handleSetTargetDate = async (itemId, date) => {
        handleUpdateItem(itemId, { target_date: date || null });
    };

    return (
        <div ref={setNodeRef} style={{ ...appliedStyle, marginBottom: '0rem' }} className="checklist-minimal">
            {!isFlatList && checklist.title && (
                <div
                    className="checklist-header"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        marginBottom: '0.25rem',
                        direction: 'rtl',
                        gap: '0.1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '0.2rem'
                    }}
                    onClick={() => {
                        if (onToggleExpand) onToggleExpand(checklist.id);
                        else if (toggleChecklistExpanded) toggleChecklistExpanded(checklist.id);
                    }}
                >
                    <span style={{
                        position: 'absolute',
                        right: '-24px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        width: '24px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '24px',
                        opacity: 1,
                        zIndex: 10
                    }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                    </span>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexGrow: 1,
                        padding: '0.5rem 0',
                        margin: 0
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '15.5px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            flexGrow: 1,
                            userSelect: 'none'
                        }}>
                            {checklist.title || 'תיבת המשימות'}
                        </h3>
                        <span style={{ fontSize: '13px', color: '#b3b3b3', fontWeight: 500 }}>
                            {!hideTaskCount && hierarchicalItems.length > 0 ? hierarchicalItems.length : ''}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s', marginRight: 'auto' }} className="checklist-actions">
                            <ActionMenu onDelete={(e) => {
                                if (onDeleteChecklist) onDeleteChecklist(e, checklist.id);
                                else if (handleDeleteChecklist) handleDeleteChecklist(e, checklist.id);
                            }} size={16} />
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
                                        handleUpdateItem={handleUpdateItem}
                                        useProgressArray={useProgressArray}
                                        isCompletedFallback={item.completed}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
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
                                            handleUpdateItem={handleUpdateItem}
                                            useProgressArray={useProgressArray}
                                            isCompletedFallback={item.completed}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    <div style={{ marginTop: '0rem' }}>
                        {isAddingRootTask ? (
                            <AddTaskCard
                                newItemContent={newItemContent}
                                setNewItemContent={setNewItemContent}
                                newItemDate={newItemDate}
                                setNewItemDate={setNewItemDate}
                                checklist={overrideChecklistForAdd || checklist}
                                setAddingToList={setAddingToList}
                                handleAddItem={activeAddItem}
                                suppressDateSpan={newItemDate === defaultItemDate}
                            />
                        ) : (
                            <AddTaskButton onClick={() => { if (setAddingToList) setAddingToList(checklist.id); if (setAddingToItem) setAddingToItem(null); if (setNewItemContent) setNewItemContent(''); }} />
                        )}
                    </div>

                    {setIsCreatingList && (
                        <button
                            type="button"
                            className="add-section-divider"
                            onMouseDown={(e) => { e.stopPropagation(); setIsCreatingList(checklist.id); }}
                        >
                            הוסף רשימה (Section)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SortableChecklistCard;
