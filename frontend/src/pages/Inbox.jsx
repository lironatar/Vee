import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ActionMenu, SortableChecklistCard, AddTaskButton } from '../components/TaskComponents/index.jsx';
import TaskPageLayout from '../components/TaskPageLayout';
import { useTaskDnD } from '../hooks/useTaskDnD';

const API_URL = '/api';

const Inbox = () => {
    const { user } = useUser();
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToList, setAddingToList] = useState(null);
    const [addingToItem, setAddingToItem] = useState(null);
    const [newItemContent, setNewItemContent] = useState('');
    const [expandedChecklists, setExpandedChecklists] = useState({});
    const [todayProgress, setTodayProgress] = useState([]);
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [scrollTop, setScrollTop] = useState(0);

    const selectedDate = new Date().toLocaleDateString('en-CA');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const {
        activeDragItem,
        handleDragStart,
        handleDragOver,
        handleDragEnd: handleDnDUpdate
    } = useTaskDnD({
        checklists,
        setChecklists,
        API_URL,
        user,
        fetchData: () => fetchInbox()
    });

    const activeChecklists = checklists.filter(c => !c.parent_id);

    useEffect(() => {
        if (user?.id) {
            fetchInbox();
        }
    }, [user?.id]);

    const fetchInbox = async () => {
        try {
            const [inboxRes, progressRes] = await Promise.all([
                fetch(`${API_URL}/users/${user.id}/inbox`),
                fetch(`${API_URL}/users/${user.id}/progress?date=${selectedDate}`)
            ]);

            if (inboxRes.ok) {
                const data = await inboxRes.json();
                setChecklists(data);
                // Expand all by default for Inbox
                const expandMap = {};
                data.forEach(c => expandMap[c.id] = true);
                setExpandedChecklists(expandMap);
            }

            if (progressRes.ok) {
                const data = await progressRes.json();
                setTodayProgress(data);
            }
        } catch (err) {
            console.error("Failed to fetch inbox:", err);
            toast.error("שגיאה בטעינת תיבת המשימות");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e, _checklistId, parentId = null, explicitContent = null) => {
        if (e) e.preventDefault();
        const contentToSave = explicitContent !== null ? explicitContent : newItemContent;
        if (!contentToSave || !contentToSave.trim()) return;

        // In Inbox, handleAddItem is passed _checklistId which might be from a different project if selected in dropdown
        try {
            const res = await fetch(`${API_URL}/checklists/${_checklistId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToSave, parent_item_id: parentId })
            });
            if (res.ok) {
                const newItem = await res.json();

                // Only update local UI if the item belongs to an Inbox checklist we are currently viewing
                setChecklists(prev => {
                    const exists = prev.some(c => c.id === _checklistId);
                    if (exists) {
                        return prev.map(c => {
                            if (c.id === _checklistId) {
                                return { ...c, items: [...c.items, newItem] };
                            }
                            return c;
                        });
                    } else {
                        toast.success("משימה נוספה בהצלחה לפרויקט אחר");
                        return prev;
                    }
                });

                setNewItemContent('');
            }
        } catch (err) {
            toast.error("שגיאה בהוספת משימה");
        }
    };

    const handleDeleteItem = async (checklistId, itemId) => {
        try {
            const res = await fetch(`${API_URL}/checklist_items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                setChecklists(prev => prev.map(c => {
                    if (c.id === checklistId) {
                        return { ...c, items: c.items.filter(i => i.id !== itemId) };
                    }
                    return c;
                }));
            }
        } catch (err) {
            toast.error("שגיאה במחיקה");
        }
    };

    const toggleItem = async (itemId, isCompleted) => {
        const newStatus = !isCompleted;

        try {
            // Optimistic update for unchecking (immediate)
            if (!newStatus) {
                setTodayProgress(prev => {
                    const existing = prev.find(p => p.checklist_item_id === itemId);
                    if (existing) {
                        return prev.map(p => p.checklist_item_id === itemId ? { ...p, completed: 0 } : p);
                    }
                    return prev;
                });
            }

            const res = await fetch(`${API_URL}/users/${user.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checklist_item_id: itemId, date: selectedDate, completed: newStatus })
            });

            if (res.ok) {
                const delay = newStatus ? 400 : 0;
                setTimeout(() => {
                    setTodayProgress(prev => {
                        const filtered = prev.filter(p => p.checklist_item_id !== itemId);
                        return [...filtered, { checklist_item_id: itemId, user_id: user.id, date: selectedDate, completed: newStatus ? 1 : 0 }];
                    });
                }, delay);
            } else {
                throw new Error("Failed to update");
            }
        } catch (err) {
            fetchInbox(); // Revert on error
            toast.error("שגיאה בעדכון משימה");
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        // Optimistic
        setChecklists(prev => prev.map(c => ({
            ...c,
            items: c.items.map(i => i.id == itemId ? { ...i, ...updates } : i)
        })));

        try {
            const res = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedItem = await res.json();
                setChecklists(prev => prev.map(c => ({
                    ...c,
                    items: c.items.map(i => i.id == itemId ? { ...i, ...updatedItem } : i)
                })));
            }
        } catch (err) {
            toast.error("שגיאה בעדכון המשימה");
        }
    };

    const handleDeleteChecklist = async (e, checklistId) => {
        if (e) e.stopPropagation();
        if (!window.confirm("האם למחוק את הרשימה?")) return;
        try {
            const res = await fetch(`${API_URL}/checklists/${checklistId}`, { method: 'DELETE' });
            if (res.ok) {
                setChecklists(prev => prev.filter(c => c.id !== checklistId));
                toast.success("הרשימה נמחקה");
            }
        } catch (err) {
            toast.error("שגיאה במחיקת הרשימה");
        }
    };

    const handleCreateCustomList = async (e) => {
        if (e) e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newListTitle,
                    active_days: '0,1,2,3,4,5,6',
                    project_id: null
                })
            });
            if (res.ok) {
                const newList = await res.json();
                setChecklists(prev => [...prev, newList]);
                setExpandedChecklists(prev => ({ ...prev, [newList.id]: true }));
                setNewListTitle('');
                setIsCreatingList(false);
                toast.success("קבוצה חדשה נוצרה");
            }
        } catch (err) {
            toast.error("שגיאה ביצירת קבוצה");
        }
    };

    const toggleChecklistExpanded = (id) => {
        setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGlobalAddTask = async () => {
        const emptyList = checklists.find(c => c.title === '');
        if (emptyList) {
            setExpandedChecklists(prev => ({ ...prev, [emptyList.id]: true }));
            setAddingToList(emptyList.id);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '',
                    project_id: null,
                    active_days: '0,1,2,3,4,5,6'
                })
            });
            if (res.ok) {
                const newList = await res.json();
                setChecklists([newList, ...checklists]);
                setExpandedChecklists(prev => ({ ...prev, [newList.id]: true }));
                setAddingToList(newList.id);
            }
        } catch (e) {
            console.error(e);
            toast.error("שגיאה ביצירת רשימה");
        }
    };

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

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const total = items.length;
        const completed = items.filter(item => {
            const p = todayProgress.find(prog => prog.checklist_item_id === item.id);
            return p && p.completed === 1;
        }).length;
        return (completed / total) * 100;
    };

    const handleSetTargetDate = async (itemId, date) => {
        handleUpdateItem(itemId, { target_date: date || null });
    };

    const handleDragEnd = async (event, checklistId) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setChecklists(prev => {
            const updated = [...prev];
            const cIdx = updated.findIndex(c => c.id === checklistId);
            if (cIdx === -1) return prev;

            const checklist = updated[cIdx];
            const hItems = buildHierarchy(checklist.items);
            const oldIdx = hItems.findIndex(i => i.id === active.id);
            const newIdx = hItems.findIndex(i => i.id === over.id);

            if (oldIdx !== -1 && newIdx !== -1) {
                const newHItems = arrayMove(hItems, oldIdx, newIdx);
                const newFlat = [];
                const traverse = (items) => {
                    items.forEach(item => {
                        newFlat.push(item);
                        if (item.children) traverse(item.children);
                    });
                };
                traverse(newHItems);
                updated[cIdx] = { ...checklist, items: newFlat };

                const itemIds = newFlat.map(i => i.id);
                fetch(`${API_URL}/checklists/${checklistId}/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds })
                });
            }
            return updated;
        });
    };

    const totalInboxItems = checklists.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0);

    useEffect(() => {
        if (!loading) {
            window.dispatchEvent(new CustomEvent('updatePageTitle', {
                detail: `תיבת המשימות (${totalInboxItems}) 📥`
            }));
        }
    }, [totalInboxItems, loading]);

    if (loading) return null;

    return (
        <TaskPageLayout
            title="תיבת המשימות"
            titleContent={
                <div style={{
                    transition: 'all 0.35s ease',
                    opacity: Math.max(0, 1 - scrollTop / 60),
                    transform: `translateY(${scrollTop * 0.15}px)`
                }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.5px',
                            display: 'inline-block'
                        }}
                    >
                        תיבת המשימות
                    </h1>
                </div>
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            externalScrollTop={scrollTop}
            onScroll={setScrollTop}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', paddingBottom: '5rem' }}>
                {checklists.length === 0 ? (
                    <div className="checklist-minimal" style={{ padding: '0.1rem 0', display: 'flex', flexDirection: 'column', border: 'none' }}>
                        {/* Add Task Button for empty inbox */}
                        <AddTaskButton onClick={async () => {
                            try {
                                const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title: 'תיבת המשימות',
                                        project_id: null,
                                        active_days: '0,1,2,3,4,5,6'
                                    })
                                });
                                if (res.ok) {
                                    const newList = await res.json();
                                    setChecklists([newList]);
                                    setExpandedChecklists({ [newList.id]: true });
                                    setAddingToList(newList.id);
                                }
                            } catch (e) { console.error(e); }
                        }} />

                        <button
                            type="button"
                            className="add-section-divider"
                            onMouseDown={(e) => { e.stopPropagation(); setIsCreatingList(true); }}
                        >
                            הוסף רשימה (Section)
                        </button>

                        {isCreatingList === true && (
                            <form className="add-section-form" onSubmit={handleCreateCustomList}>
                                <input
                                    type="text"
                                    className="add-section-input"
                                    placeholder="שם הרשימה... (לדוגמה: פרוייקט חדש)"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    autoFocus
                                />
                                <div className="add-section-actions">
                                    <button type="submit" className="btn-add-section" disabled={!newListTitle.trim()}>הוסף רשימה</button>
                                    <button type="button" className="btn-cancel-section" onClick={() => { setIsCreatingList(false); setNewListTitle(''); }}>ביטול</button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <SortableContext
                        items={checklists.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {activeChecklists.map((list) => (
                            <React.Fragment key={list.id}>
                                <SortableChecklistCard
                                    key={list.id}
                                    checklist={list}
                                    expanded={expandedChecklists[list.id]}
                                    onToggleExpand={() => toggleChecklistExpanded(list.id)}
                                    onAddItem={(e, listId, parentId = null, content = null) => handleAddItem(e, listId, parentId, content)}
                                    onDeleteItem={handleDeleteItem}
                                    onUpdateItem={handleUpdateItem}
                                    onToggleItem={toggleItem}
                                    addingToItem={addingToItem}
                                    setAddingToItem={setAddingToItem}
                                    newItemContent={newItemContent}
                                    setNewItemContent={setNewItemContent}
                                    showDeleteHeader={true}
                                    onDeleteChecklist={(e) => handleDeleteChecklist(e, list.id)}
                                    API_URL={API_URL}
                                    todayProgress={todayProgress}
                                    isInbox={true}
                                    useSharedDndContext={true}
                                    buildHierarchy={buildHierarchy}
                                    calculateProgress={calculateProgress}
                                    setIsCreatingList={setIsCreatingList}
                                    projectTitle="תיבת המשימות"
                                />
                                {isCreatingList === list.id && (
                                    <form className="add-section-form" onSubmit={handleCreateCustomList}>
                                        <input
                                            type="text"
                                            className="add-section-input"
                                            placeholder="שם הרשימה... (לדוגמה: פרוייקט חדש)"
                                            value={newListTitle}
                                            onChange={(e) => setNewListTitle(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="add-section-actions">
                                            <button type="submit" className="btn-add-section" disabled={!newListTitle.trim()}>הוסף רשימה</button>
                                            <button type="button" className="btn-cancel-section" onClick={() => { setIsCreatingList(null); setNewListTitle(''); }}>ביטול</button>
                                        </div>
                                    </form>
                                )}
                            </React.Fragment>
                        ))}
                    </SortableContext>
                )}




            </div>
        </TaskPageLayout >
    );
};

export default Inbox;
