import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';

export const useTaskDnD = ({
    checklists,
    setChecklists,
    API_URL,
    user,
    fetchData // optional callback to refresh data on failure or undo
}) => {
    const [activeDragItem, setActiveDragItem] = useState(null);
    const lastActionRef = useRef(null);

    // Helpers
    const buildHierarchy = (items) => {
        const itemMap = new Map();
        const roots = [];

        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        items.forEach(item => {
            if (item.parent_item_id) {
                const parent = itemMap.get(item.parent_item_id);
                if (parent) {
                    parent.children.push(itemMap.get(item.id));
                } else {
                    roots.push(itemMap.get(item.id));
                }
            } else {
                roots.push(itemMap.get(item.id));
            }
        });

        return roots;
    };

    const findContainer = (id, items) => {
        // If the ID matches a checklist, return the checklist ID
        if (checklists.find(c => c.id === id)) {
            return id;
        }

        // Otherwise find which checklist contains this item ID
        for (const list of checklists) {
            if (list.items?.some(item => item.id === id)) {
                return list.id;
            }
        }
        return null;
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragItem(active);
        document.body.classList.add('is-dragging');
    };

    const handleDragCancel = () => {
        setActiveDragItem(null);
        document.body.classList.remove('is-dragging');
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeItemType = active.data.current?.type || 'item';
        const overItemType = over.data.current?.type || 'item';

        // We only handle cross-container logic for tasks, not checklists
        if (activeItemType === 'checklist') return;

        const activeContainerId = findContainer(active.id);
        const overContainerId = overItemType === 'checklist' ? over.id : findContainer(over.id);

        if (!activeContainerId || !overContainerId || activeContainerId === overContainerId) {
            return;
        }

        // Move item to different checklist optimistically
        setChecklists((prev) => {
            const activeListIndex = prev.findIndex(c => c.id === activeContainerId);
            const overListIndex = prev.findIndex(c => c.id === overContainerId);

            if (activeListIndex === -1 || overListIndex === -1) return prev;

            const activeList = prev[activeListIndex];
            const overList = prev[overListIndex];

            const activeItemIndex = activeList.items.findIndex(i => i.id === active.id);
            if (activeItemIndex === -1) return prev;

            const activeItem = activeList.items[activeItemIndex];

            const overItemsType = over.data.current?.type;
            let overItemIndex;
            if (overItemsType === 'checklist') {
                // Determine if we should put it at top or bottom
                overItemIndex = overList.items.length;
            } else {
                overItemIndex = overList.items.findIndex(i => i.id === over.id);
                if (overItemIndex === -1) {
                    overItemIndex = overList.items.length;
                }
            }

            const activeListItems = [...activeList.items];
            activeListItems.splice(activeItemIndex, 1);

            const overListItems = [...overList.items];
            overListItems.splice(overItemIndex, 0, { ...activeItem, checklist_id: overContainerId });

            const newChecklists = [...prev];
            newChecklists[activeListIndex] = { ...activeList, items: activeListItems };
            newChecklists[overListIndex] = { ...overList, items: overListItems };

            return newChecklists;
        });
    };

    const handleDragEnd = async (event, currentProjectId = null) => {
        const { active, over } = event;

        // Always clear active item and dragging state
        setActiveDragItem(null);
        document.body.classList.remove('is-dragging');

        if (!over || active.id === over.id) return;

        const activeItemType = active.data.current?.type || 'item';

        // 1. Checklist Reordering
        if (activeItemType === 'checklist') {
            setChecklists(prev => {
                const oldIndex = prev.findIndex(c => c.id === active.id);
                const newIndex = prev.findIndex(c => c.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newChecklists = arrayMove(prev, oldIndex, newIndex);
                    const checklistIds = newChecklists.map(c => c.id);

                    // API Call
                    const endpoint = currentProjectId
                        ? `${API_URL}/projects/${currentProjectId}/checklists/reorder`
                        : `${API_URL}/users/${user.id}/checklists/reorder`;

                    fetch(endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ checklistIds })
                    }).then(res => {
                        if (res.ok) toast.success("סדר הרשימות עודכן בהצלחה", { duration: 2500 });
                    }).catch(e => {
                        console.error("Failed to save checklist reorder", e);
                        toast.error("שגיאה בעדכון סדר הרשימות");
                        if (fetchData) fetchData();
                    });

                    return newChecklists;
                }
                return prev;
            });
            return;
        }

        // 2. Task Reordering / Moving
        const activeContainerId = findContainer(active.id);
        const overContainerId = over.data.current?.type === 'checklist' ? over.id : findContainer(over.id);

        if (!activeContainerId || !overContainerId) return;

        // Inside the same container
        if (activeContainerId === overContainerId) {
            const listIndex = checklists.findIndex(c => c.id === activeContainerId);
            if (listIndex === -1) return;

            const list = checklists[listIndex];
            const hItems = buildHierarchy(list.items);

            const oldIndex = hItems.findIndex(i => i.id === active.id);
            const newIndex = hItems.findIndex(i => i.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Save original IDs for undo
                const originalItemIds = hItems.map(i => i.id);

                const newHItems = arrayMove(hItems, oldIndex, newIndex);

                const newFlat = [];
                const traverse = (items) => {
                    items.forEach(item => {
                        newFlat.push(item);
                        if (item.children) traverse(item.children);
                    });
                };
                traverse(newHItems);

                setChecklists(prev => {
                    const newChecklists = [...prev];
                    newChecklists[listIndex] = { ...list, items: newFlat };
                    return newChecklists;
                });

                const itemIds = newFlat.map(i => i.id);
                fetch(`${API_URL}/checklists/${activeContainerId}/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds })
                }).then(res => {
                    if (res.ok) {
                        // Show Undo Toast for same-list reordering
                        const undoAction = async () => {
                            toast.dismiss();
                            try {
                                await fetch(`${API_URL}/checklists/${activeContainerId}/reorder`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ itemIds: originalItemIds })
                                });
                                if (fetchData) fetchData();
                                toast.success('הפעולה בוטלה. המשימות חזרו לסדרן המקורי.');
                            } catch (e) {
                                console.error('Undo failed', e);
                                toast.error('שגיאה בביטול הפעולה');
                            }
                        };

                        toast.success('סדר המשימות עודכן בהצלחה', {
                            action: {
                                label: 'בטל',
                                onClick: undoAction
                            },
                            duration: 4000,
                        });
                    }
                }).catch(e => {
                    console.error("Failed to save reorder", e);
                    toast.error("שגיאה בעדכון סדר המשימות");
                    if (fetchData) fetchData();
                });
            }
        } else {
            // Moved to a different container (DragOver handled the UI optimistic update)
            const activeDbItem = active.data.current?.item;
            const originalChecklistId = activeDbItem?.checklist_id || activeContainerId; // Fallback to current UI container

            // Re-find the list since UI jumped list
            const newListIndex = checklists.findIndex(c => c.id === overContainerId);
            const newList = checklists[newListIndex];

            // In API we need to PUT the item to update its checklist_id
            try {
                // 1. Update checklist ID of item
                await fetch(`${API_URL}/items/${active.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checklist_id: overContainerId })
                });

                // 2. Save the new order in the target container
                const targetList = checklists.find(c => c.id === overContainerId);
                if (targetList) {
                    const targetItemIds = targetList.items.map(i => i.id);
                    await fetch(`${API_URL}/checklists/${overContainerId}/reorder`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemIds: targetItemIds })
                    });
                }

                // Show Undo Toast
                const undoAction = async () => {
                    toast.dismiss();
                    try {
                        await fetch(`${API_URL}/items/${active.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ checklist_id: originalChecklistId })
                        });
                        if (fetchData) fetchData();
                        toast.success('הפעולה בוטלה. המשימה הוחזרה.');
                    } catch (e) {
                        console.error('Undo failed', e);
                        toast.error('שגיאה בביטול הפעולה');
                    }
                };

                toast.success('המשימה הועברה בהצלחה', {
                    action: {
                        label: 'בטל',
                        onClick: undoAction
                    },
                    duration: 4000,
                });

            } catch (err) {
                console.error("Failed to handle cross-list drop", err);
                toast.error("שגיאה בהעברת המשימה");
                if (fetchData) fetchData(); // Revert
            }
        }
    };

    return {
        activeDragItem,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel
    };
};
