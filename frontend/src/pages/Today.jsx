import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { CheckCircle2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableChecklistCard } from '../components/TaskComponents/index.jsx';
import TaskPageLayout from '../components/TaskPageLayout';

const API_URL = '/api';

const Today = () => {
    const { user } = useUser();
    const [projectGroups, setProjectGroups] = useState([]);
    const [todayProgress, setTodayProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedChecklists, setExpandedChecklists] = useState({ 'today-unified': true });
    const [addingToList, setAddingToList] = useState(null);
    const [addingToItem, setAddingToItem] = useState(null);
    const [newItemContent, setNewItemContent] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const todayDateStr = new Date().toISOString().split('T')[0];

    const getFormattedDate = () => {
        const d = new Date();
        const dayOfMonth = d.getDate();
        const monthShort = d.toLocaleDateString('he-IL', { month: 'short' }).replace('.', '');
        const dayOfWeek = d.toLocaleDateString('he-IL', { weekday: 'long' });
        return `${dayOfMonth} ${monthShort} ‧ היום ‧ ${dayOfWeek}`;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchTodayTasks = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/tasks/by-date?date=${todayDateStr}`);
            if (res.ok) {
                const data = await res.json();
                setProjectGroups(data);
            }
        } catch (err) {
            console.error('Error fetching today tasks:', err);
        }
    }, [user.id, todayDateStr]);

    const fetchTodayProgress = useCallback(async () => {
        try {
            // We can fetch progress for all projects for this date
            // However, the tasks/by-date endpoint already includes 'completed' status in the structured result
            // But we need a flat todayProgress array for SortableChecklistCard to work with toggleItem logic
            // Let's fetch it from a generic progress endpoint if available, or extract it from projectGroups
            const res = await fetch(`${API_URL}/users/${user.id}/progress?date=${todayDateStr}`);
            if (res.ok) {
                setTodayProgress(await res.json());
            }
        } catch (err) {
            console.error('Error fetching today progress:', err);
        }
    }, [user.id, todayDateStr]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([fetchTodayTasks(), fetchTodayProgress()]).finally(() => setLoading(false));
        }
    }, [user, fetchTodayTasks, fetchTodayProgress]);

    useEffect(() => {
        const socket = io();
        socket.on('connect', () => {
            // Join a global user room or multiple project rooms
            // For now, simpler to just listen for task updates if they are broadcasted
            socket.on('task_completed', (data) => {
                // If it's today's task, update local progress state
                // Note: The date check might be needed if broadcasting global updates
                setTodayProgress(prev => {
                    const existing = prev.find(p => p.checklist_item_id === data.checklist_item_id);
                    if (existing) {
                        return prev.map(p => p.checklist_item_id === data.checklist_item_id ? { ...p, completed: data.completed ? 1 : 0 } : p);
                    } else {
                        // We assume it's for today if received here or we should check data.date if available
                        return [...prev, { checklist_item_id: data.checklist_item_id, completed: data.completed ? 1 : 0, date: todayDateStr }];
                    }
                });
            });
        });
        return () => socket.disconnect();
    }, [todayDateStr]);

    const toggleItem = async (itemId, currentCompleted) => {
        const newCompleted = !currentCompleted;

        try {
            const res = await fetch(`${API_URL}/users/${user.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checklist_item_id: itemId,
                    date: todayDateStr,
                    completed: newCompleted
                })
            });

            if (res.ok) {
                // If completing, wait a bit for the "disappearing" effect
                const delay = newCompleted ? 400 : 0;

                setTimeout(() => {
                    setTodayProgress(prev => {
                        const filtered = prev.filter(p => p.checklist_item_id !== itemId);
                        return [...filtered, { checklist_item_id: itemId, completed: newCompleted ? 1 : 0, date: todayDateStr }];
                    });
                }, delay);
            }
        } catch (err) {
            toast.error("שגיאה בעדכון המשימה");
        }
    };

    const getTargetChecklistObj = () => {
        // Find an inbox checklist (project_id is null)
        const inboxProj = projectGroups.find(p => p.id === 0 || p.title === 'כללי' || !p.id);
        if (inboxProj && inboxProj.checklists && inboxProj.checklists.length > 0) {
            return inboxProj.checklists[0];
        }
        // Fallback to the first checklist found in any project
        for (const p of projectGroups) {
            if (p.checklists && p.checklists.length > 0) return p.checklists[0];
        }
        return { id: null, title: 'תיבת המשימות' };
    };

    const getTargetChecklistId = () => {
        return getTargetChecklistObj().id;
    };

    const handleAddItem = async (e, _checklistId, parentItemId = null, explicitContent = null) => {
        if (e) e.preventDefault();
        const contentToSave = explicitContent !== null ? explicitContent : newItemContent;
        if (!contentToSave || !contentToSave.trim()) return;

        // Use the passed _checklistId if available and NOT 'today-unified', otherwise calculate it
        let targetId = _checklistId && _checklistId !== 'today-unified' ? _checklistId : getTargetChecklistId();

        if (!targetId) {
            toast.error("לא נמצאה רשימה להוספת המשימה");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/checklists/${targetId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSave,
                    parent_item_id: parentItemId,
                    target_date: todayDateStr // Default to today since we're in Today view
                })
            });

            if (res.ok) {
                const newItem = await res.json();
                // Update local state by finding the checklist and adding the item
                setProjectGroups(prev => prev.map(proj => ({
                    ...proj,
                    checklists: proj.checklists.map(list => {
                        if (list.id === targetId) {
                            return { ...list, items: [...list.items, newItem] };
                        }
                        return list;
                    })
                })));
                setNewItemContent('');
                toast.success("משימה נוספה");
            }
        } catch (err) {
            toast.error("שגיאה בהוספת משימה");
        }
    };

    const handleDeleteItem = async (e, itemId) => {
        if (e) e.stopPropagation();
        if (!window.confirm("האם למחוק את המשימה?")) return;

        try {
            const res = await fetch(`${API_URL}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                setProjectGroups(prev => prev.map(proj => ({
                    ...proj,
                    checklists: proj.checklists.map(list => ({
                        ...list,
                        items: list.items.filter(i => i.id !== itemId && i.parent_item_id !== itemId)
                    }))
                })));
                toast.success("המשימה נמחקה");
            }
        } catch (err) {
            toast.error("שגיאה במחיקת המשימה");
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        // Optimistic
        setProjectGroups(prev => prev.map(proj => ({
            ...proj,
            checklists: proj.checklists.map(list => ({
                ...list,
                items: list.items.map(i => i.id == itemId ? { ...i, ...updates } : i)
            }))
        })));

        try {
            const res = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedItem = await res.json();
                setProjectGroups(prev => prev.map(proj => ({
                    ...proj,
                    checklists: proj.checklists.map(list => ({
                        ...list,
                        items: list.items.map(i => i.id == itemId ? { ...i, ...updatedItem } : i)
                    }))
                })));
            }
        } catch (err) {
            toast.error("שגיאה בעדכון המשימה");
        }
    };

    const handleSetTargetDate = async (itemId, date) => {
        handleUpdateItem(itemId, { target_date: date ? date.toISOString() : null });
    };

    const toggleChecklistExpanded = (id) => {
        setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
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

    const normalizeDate = (value) => {
        if (!value) return null;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    };

    const handleDragStart = (event) => {
        setActiveDragItem(event.active);
    };

    const handleDragOver = (event) => {
        // Today view has a single dynamic list; no cross-list dragging.
    };

    const handleDragEnd = (event) => {
        setActiveDragItem(null);
        // Do not persist order visually for 'Today' dynamically generated list
    };

    const allTasks = projectGroups
        .flatMap(proj =>
            proj.checklists.flatMap(list =>
                list.items
                    .filter(item => normalizeDate(item.target_date) === todayDateStr)
                    .map(item => ({
                        ...item,
                        projectTitle: proj.title,
                        checklistTitle: list.title
                    }))
            )
        )
        .filter(item => {
            const p = todayProgress.find(prog => prog.checklist_item_id === item.id);
            return !(p && p.completed === 1);
        });

    const totalTasks = allTasks.length;
    const completedTasksCount = todayProgress.filter(p => p.completed === 1).length;
    const remainingTasks = totalTasks - completedTasksCount;

    useEffect(() => {
        if (!loading) {
            window.dispatchEvent(new CustomEvent('updatePageTitle', {
                detail: `היום (${allTasks.length}) ☀️`
            }));
        }
    }, [allTasks.length, loading]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>טוען משימות להיום...</div>;

    const unifiedChecklist = {
        id: 'today-unified',
        title: getFormattedDate(),
        items: allTasks
    };

    return (
        <TaskPageLayout
            title="היום"
            titleContent={
                <div style={{
                    transition: 'all 0.35s ease',
                    opacity: Math.max(0, 1 - scrollTop / 60),
                    transform: `translateY(${scrollTop * 0.15}px)`
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.5px'
                    }}>
                        {getFormattedDate()}
                    </h1>

                    <div style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        opacity: 0.8
                    }}>
                        <CheckCircle2 size={16} strokeWidth={2} />
                        <span>{allTasks.length > 0 ? allTasks.length : 0} משימות</span>
                    </div>
                </div>
            }
            onScroll={setScrollTop}
            externalScrollTop={scrollTop}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            activeDragItem={activeDragItem}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                <SortableChecklistCard
                    checklist={unifiedChecklist}
                    idx={0}
                    expandedChecklists={expandedChecklists}
                    toggleChecklistExpanded={() => setExpandedChecklists(prev => ({ ...prev, 'today-unified': !prev['today-unified'] }))}
                    handleDeleteChecklist={() => { }}
                    todayProgress={todayProgress}
                    sensors={sensors}
                    handleDragEnd={() => { }}
                    activeTab="tasks"
                    addingToList={addingToList}
                    addingToItem={addingToItem}
                    toggleItem={toggleItem}
                    setAddingToItem={setAddingToItem}
                    setAddingToList={setAddingToList}
                    handleAddItem={handleAddItem}
                    handleDeleteItem={handleDeleteItem}
                    newItemContent={newItemContent}
                    setNewItemContent={setNewItemContent}
                    handleSetTargetDate={handleSetTargetDate}
                    handleUpdateItem={handleUpdateItem}
                    buildHierarchy={buildHierarchy}
                    calculateProgress={calculateProgress}
                    setIsCreatingList={() => { }}
                    defaultItemDate={null}
                    hideTaskCount={true}
                    useSharedDndContext={true}
                    overrideChecklistForAdd={getTargetChecklistObj()}
                />

                {allTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 2rem', opacity: 0.6 }}>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>הכל מוכן להיום!</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>לחץ על הוסף משימה כדי להתחיל.</p>
                    </div>
                )}
            </div>
        </TaskPageLayout >
    );
};

export default Today;
