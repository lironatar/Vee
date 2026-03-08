import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { CheckCircle, Circle, Trash2, HelpCircle, ArrowRight, Store, Plus, ChevronRight, ChevronDown, Settings, X, Calendar as CalendarIcon, List as ListIcon, GripVertical, MoreVertical, MoreHorizontal, Users, UserPlus, Search, Copy, Edit3, Save, Home, Filter, MessageSquare, Send, Clock } from 'lucide-react';
import ProjectCalendar from '../components/ProjectCalendar';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
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
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = '/api';

import { ActionMenu, SortableChecklistCard, AddTaskButton } from '../components/TaskComponents/index.jsx';
import TaskPageLayout from '../components/TaskPageLayout';
import { useTaskDnD } from '../hooks/useTaskDnD';
import ProjectComments from '../components/ProjectComments';
import cache from '../utils/cache';

const Project = () => {
    const { projectId } = useParams();
    const location = useLocation();
    const { user } = useUser();
    const navigate = useNavigate();

    const [project, setProject] = useState(() => cache.get(`project_data_${projectId}`)?.project || null);
    const [checklists, setChecklists] = useState(() => cache.get(`project_data_${projectId}`)?.checklists || []);
    const [todayProgress, setTodayProgress] = useState([]);
    const [loading, setLoading] = useState(!cache.get(`project_data_${projectId}`));

    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [addingToItem, setAddingToItem] = useState(null); // ID of parent item to add subtask to
    const [addingToList, setAddingToList] = useState(null); // ID of checklist to add main task to

    const [expandedChecklists, setExpandedChecklists] = useState({});

    // Magic Reveal States
    const [magicRevealing, setMagicRevealing] = useState(location.state?.magicReveal || false);
    const [isWaterfalling, setIsWaterfalling] = useState(false);
    const [visibleChecklistIds, setVisibleChecklistIds] = useState(new Set());
    const [visibleTaskIds, setVisibleTaskIds] = useState(new Set());

    // New Feature States
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'history'
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTitle, setSettingsTitle] = useState('');
    const [settingsDays, setSettingsDays] = useState([]);

    // Team & Socket state
    const [projectMembers, setProjectMembers] = useState([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [friends, setFriends] = useState([]);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const projectMenuRef = React.useRef(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const scrollContainerRef = useRef(null);
    const { isSidebarOpen } = useOutletContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);

    // Comments State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA');
    const weekDaysHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    const [selectedDate, setSelectedDate] = useState(dateStr);
    const selectedDayOfWeek = new Date(selectedDate).getDay().toString();

    // Headers removed from here

    useEffect(() => {
        if (user && projectId) {
            const cached = cache.get(`project_data_${projectId}`);
            if (!cached) {
                setLoading(true);
            } else {
                setProject(cached.project);
                setChecklists(cached.checklists);
            }
            fetchProjectData();
            fetchProjectMembers();
        }
    }, [user, projectId]);

    useEffect(() => {
        if (!projectId) return;

        const newSocket = io();

        newSocket.on('connect', () => {
            newSocket.emit('join_project', projectId);
        });

        newSocket.on('task_completed', (data) => {
            // real-time sync wrapper
            setTodayProgress(prev => {
                const currentFiltered = prev.filter(p => p.checklist_item_id !== data.checklist_item_id);
                if (data.completed) {
                    return [...currentFiltered, {
                        ...data,
                        user_id: data.userId
                    }];
                } else {
                    return currentFiltered;
                }
            });
            // Show toast if we didn't do it ourselves
            if (data.userId !== user?.id) {
                if (data.completed) toast.success(`המשימה סומנה כהושלמה ע"י ${data.username}`, { position: 'top-center' });
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [projectId, user]);

    useEffect(() => {
        if (user && projectId && selectedDate) {
            fetchProgressForDate(selectedDate);
        }
    }, [user, projectId, selectedDate]);

    // Fetch comments when overlay opens
    useEffect(() => {
        if (showComments && projectId) {
            fetchComments();
        }
    }, [showComments, projectId]);

    // Handle Magic Reveal Sequence
    useEffect(() => {
        // Cleaning up history state if it was a magic reveal
        if (location.state?.magicReveal) {
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const startWaterfall = async (listsToRevealRaw = null) => {
        setMagicRevealing(false);
        setIsWaterfalling(true);
        const data = listsToRevealRaw || checklists;
        const listsToReveal = data.filter(c => c.active_days.split(',').includes(selectedDayOfWeek));
        await new Promise(r => setTimeout(r, 100)); // Wait for DOM render after scope change
        const scrollContainer = document.querySelector('.page-content');

        const smoothScroll = () => {
            if (scrollContainer) {
                requestAnimationFrame(() => {
                    scrollContainer.scrollTo({
                        top: scrollContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                });
            }
        };

        for (const list of listsToReveal) {
            setVisibleChecklistIds(prev => new Set([...prev, list.id]));
            setTimeout(smoothScroll, 50);
            await new Promise(r => setTimeout(r, 120));

            if (list.items && list.items.length > 0) {
                for (const item of list.items) {
                    setVisibleTaskIds(prev => new Set([...prev, item.id]));
                    setTimeout(smoothScroll, 50);
                    await new Promise(r => setTimeout(r, 100));
                }
            }
        }

        setIsWaterfalling(false);
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`${API_URL}/projects/${projectId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
                setTimeout(() => {
                    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`${API_URL}/projects/${projectId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    content: newComment.trim()
                })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment]);
                setNewComment('');
                setTimeout(() => {
                    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                toast.error('שגיאה בשליחת התגובה');
            }
        } catch (err) {
            console.error('Failed to post comment', err);
            toast.error('שגיאה בשליחת התגובה');
        }
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) {
                setShowProjectMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProjectData = async () => {
        setLoading(true);
        try {
            const projectsRes = await fetch(`${API_URL}/users/${user.id}/projects`);
            const projectsData = await projectsRes.json();
            const currentProj = projectsData.find(p => p.id === parseInt(projectId));
            setProject(currentProj);

            if (currentProj) {
                setSettingsTitle(currentProj.title);
                setSettingsDays(currentProj.active_days ? currentProj.active_days.split(',') : ['0', '1', '2', '3', '4', '5', '6']);

                // Interactive Title: Update Browser title with project name
                window.dispatchEvent(new CustomEvent('updatePageTitle', { detail: currentProj.title }));
            }

            const checklistsRes = await fetch(`${API_URL}/projects/${projectId}/checklists`);
            const listsData = await checklistsRes.json();
            setChecklists(listsData);

            // Initialize expanded state for all lists
            const initExpanded = {};
            listsData.forEach(list => initExpanded[list.id] = true);
            setExpandedChecklists(initExpanded);

            if (magicRevealing) {
                setTimeout(() => startWaterfall(listsData), 100);
            }

            // Save to cache
            cache.set(`project_data_${projectId}`, { project: currentProj, checklists: listsData });

        } catch (err) {
            console.error('Error fetching project data:', err);
        }
        setLoading(false);
    };

    const fetchProgressForDate = async (dateStr) => {
        try {
            const progressRes = await fetch(`${API_URL}/projects/${projectId}/progress/${dateStr}`);
            const progressData = await progressRes.json();
            setTodayProgress(progressData);
        } catch (err) {
            console.error('Error fetching project progress:', err);
        }
    };

    const handleTitleClick = () => {
        setIsEditingTitle(true);
        setTempTitle(project.title);
    };

    const handleTitleSave = async () => {
        if (tempTitle.trim() === '' || tempTitle === project.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: tempTitle })
            });
            if (res.ok) {
                setProject({ ...project, title: tempTitle });
                window.dispatchEvent(new CustomEvent('updatePageTitle', { detail: tempTitle }));
            }
        } catch (err) {
            console.error('Failed to update title', err);
        } finally {
            setIsEditingTitle(false);
        }
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setTempTitle(project.title);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            const res = await fetch(`${API_URL}/projects/${projectId}/members`);
            if (res.ok) {
                setProjectMembers(await res.json());
            }
        } catch (error) { console.error(error); }
    };

    const fetchFriends = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/friends`);
            if (res.ok) setFriends((await res.json()).filter(f => f.status === 'accepted'));
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (showTeamModal) fetchFriends();
    }, [showTeamModal]);

    const handleAddMember = async (targetUserId) => {
        try {
            const res = await fetch(`${API_URL}/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: targetUserId, role: 'member' })
            });
            if (res.ok) {
                toast.success('חבר הוסף בהצלחה לצוות!');
                fetchProjectMembers();
            } else {
                toast.error('שגיאה בצירף או שהמשתמש כבר בצוות');
            }
        } catch (error) { toast.error('שגיאה בתקשורת'); }
    };

    const handleRemoveMember = async (targetUserId) => {
        try {
            const res = await fetch(`${API_URL}/projects/${projectId}/members/${targetUserId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('חבר הוסר מהצוות!');
                fetchProjectMembers();
            }
        } catch (error) { toast.error('שגיאה בתקשורת'); }
    };

    const handleDuplicateProject = () => {
        setShowProjectMenu(false);
        toast.info('שכפול פרויקט ייתמך בגרסה הבאה');
    };

    const handleDeleteProject = async () => {
        setShowProjectMenu(false);
        if (!window.confirm('האם אתה בטוח שברצונך למחוק פרויקט זה ואת כל התבניות והמשימות שבתוכו?')) return;
        try {
            await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
            navigate('/');
        } catch (err) {
            console.error('Error deleting project:', err);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const activeDaysStr = settingsDays.join(',');
            const res = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: settingsTitle, active_days: activeDaysStr })
            });
            if (res.ok) {
                setProject({ ...project, title: settingsTitle, active_days: activeDaysStr });
                setShowSettings(false);
            }
        } catch (err) {
            console.error('Failed to update project settings', err);
        }
    };

    const toggleSettingsDay = (dayIndex) => {
        const strIndex = dayIndex.toString();
        if (settingsDays.includes(strIndex)) {
            setSettingsDays(settingsDays.filter(d => d !== strIndex));
        } else {
            setSettingsDays([...settingsDays, strIndex].sort());
        }
    };

    const toggleChecklistExpanded = (id) => {
        setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGlobalAddTask = async () => {
        // Find existing empty-titled checklist
        const emptyList = checklists.find(c => c.title === '');
        if (emptyList) {
            setExpandedChecklists(prev => ({ ...prev, [emptyList.id]: true }));
            setAddingToList(emptyList.id);
            return;
        }

        // Create one if none exists
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '',
                    project_id: projectId,
                    active_days: '0,1,2,3,4,5,6'
                })
            });
            if (res.ok) {
                const newList = await res.json();
                setChecklists([newList, ...checklists]);
                setExpandedChecklists(prev => ({ ...prev, [newList.id]: true }));
                setAddingToList(newList.id);
                window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
            }
        } catch (e) {
            console.error(e);
            toast.error("שגיאה ביצירת רשימה");
        }
    };

    const handleCreateCustomList = async (e) => {
        e.preventDefault();
        if (newListTitle === undefined) return;

        try {
            const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newListTitle,
                    project_id: projectId,
                    active_days: '0,1,2,3,4,5,6'
                })
            });
            if (res.ok) {
                const newList = await res.json();

                let newChecklists;
                if (isCreatingList && isCreatingList !== true) {
                    const targetIdx = checklists.findIndex(c => c.id === isCreatingList);
                    newChecklists = [...checklists];
                    newChecklists.splice(targetIdx + 1, 0, newList);
                } else {
                    newChecklists = [newList, ...checklists];
                }

                setChecklists(newChecklists);
                setExpandedChecklists(prev => ({ ...prev, [newList.id]: true }));
                setNewListTitle('');
                setIsCreatingList(null);

                // Persist the new order
                await fetch(`${API_URL}/projects/${projectId}/checklists/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checklistIds: newChecklists.map(c => c.id) })
                });
                window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = async (e, _checklistId, parentItemId = null, explicitContent = null) => {
        if (e) e.preventDefault();
        const contentToSave = explicitContent !== null ? explicitContent : newItemContent;
        if (!contentToSave || !contentToSave.trim()) return;

        try {
            const targetDateInput = window.globalNewItemDate || null;
            const descriptionInput = window.globalNewItemDescription || null;
            const repeatRuleInput = window.globalNewItemRepeatRule || null;
            const timeInput = window.globalNewItemTime || null;
            const durationInput = window.globalNewItemDuration || 15;

            // Note: _checklistId may be from another project if selected in dropdown
            const res = await fetch(`${API_URL}/checklists/${_checklistId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSave,
                    parent_item_id: parentItemId,
                    target_date: targetDateInput,
                    description: descriptionInput,
                    repeat_rule: repeatRuleInput,
                    time: timeInput,
                    duration: durationInput
                })
            });

            if (res.ok) {
                const newItem = await res.json();

                // Only update local UI if the item belongs to a checklist in the CURRENT project
                setChecklists(prev => {
                    const exists = prev.some(c => c.id === _checklistId);
                    if (exists) {
                        return prev.map(c => {
                            if (c.id === _checklistId) {
                                return { ...c, items: [...(c.items || []), newItem] };
                            }
                            return c;
                        });
                    } else {
                        toast.success("משימה נוספה בהצלחה לפרויקט אחר");
                        return prev;
                    }
                });

                setNewItemContent('');
                window.globalNewItemDate = null;
                window.globalNewItemDescription = null;
                window.globalNewItemRepeatRule = null;
                window.globalNewItemTime = null;
                window.globalNewItemDuration = 15;
                window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteItem = async (e, itemId, checklistId) => {
        e.stopPropagation();
        if (!window.confirm('האם למחוק משימה זו ואת תתי המשימות שלה?')) return;
        try {
            await fetch(`${API_URL}/items/${itemId}`, { method: 'DELETE' });
            // Refresh data to correctly handle cascade deletes
            fetchProjectData();
            window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        // Optimistic update
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
                if (updates.checklist_id !== undefined) {
                    fetchProjectData();
                } else {
                    setChecklists(prev => prev.map(c => ({
                        ...c,
                        items: c.items.map(i => i.id == itemId ? { ...i, ...updatedItem } : i)
                    })));
                }
                if (updates.target_date !== undefined) {
                    toast.success(updates.target_date ? 'תאריך יעד עודכן' : 'תאריך יעד הוסר');
                }
                window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
            }
        } catch (err) {
            console.error('Failed to update item', err);
            toast.error('שגיאה בעדכון המשימה');
        }
    };

    const handleSetTargetDate = async (itemId, newDate) => {
        handleUpdateItem(itemId, { target_date: newDate || null });
    };

    const toggleItem = async (itemId, currentCompletedStatus) => {
        try {
            const newStatus = !currentCompletedStatus;

            // Optimistic update for unchecking (immediate)
            // For checking (completing), we'll do it after a delay in the UI
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
                body: JSON.stringify({
                    checklist_item_id: itemId,
                    date: selectedDate,
                    completed: newStatus
                })
            });

            if (res.ok) {
                const delay = newStatus ? 400 : 0;
                setTimeout(() => {
                    setTodayProgress(prev => {
                        const filtered = prev.filter(p => p.checklist_item_id !== itemId);
                        return [...filtered, { checklist_item_id: itemId, user_id: user.id, date: selectedDate, completed: newStatus ? 1 : 0 }];
                    });
                    window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
                }, delay);
            }
        } catch (err) {
            console.error(err);
            fetchProjectData(); // revert on error
        }
    };

    const handleDeleteChecklist = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) return;
        try {
            await fetch(`${API_URL}/checklists/${id}`, { method: 'DELETE' });
            setChecklists(checklists.filter(c => c.id !== id));
            window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
        } catch (err) {
            console.error(err);
        }
    };

    // Helper functions for hierarchy and progress
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
                    roots.push(itemMap.get(item.id)); // Orphaned subtasks become roots
                }
            } else {
                roots.push(itemMap.get(item.id));
            }
        });

        return roots;
    };

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const totalItems = items.length;
        const completedItems = items.filter(item => {
            const p = todayProgress.find(prog => prog.checklist_item_id === item.id);
            return p && p.completed === 1;
        }).length;
        return (completedItems / totalItems) * 100;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires a small move before dragging starts
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Require holding for 250ms before dragging on mobile
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { handleDragStart, handleDragOver, handleDragEnd } = useTaskDnD({
        checklists,
        setChecklists,
        API_URL,
        user,
        fetchData: fetchProjectData
    });

    const PageLoader = () => (
        <div style={{ padding: '1rem 0' }}>
            <div className="skeleton-box skeleton-title"></div>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-row">
                    <div className="skeleton-box skeleton-circle"></div>
                    <div className="skeleton-box skeleton-text" style={{ width: `${Math.random() * 40 + 30}%` }}></div>
                </div>
            ))}
        </div>
    );

    if (loading && !project) {
        return (
            <TaskPageLayout title="טוען...">
                <PageLoader />
            </TaskPageLayout>
        );
    }

    if (!project) {
        return (
            <TaskPageLayout title="לא נמצא">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>הפרויקט לא נמצא</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>נראה שהפרויקט הזה כבר לא קיים.</p>
                </div>
            </TaskPageLayout>
        );
    }

    const isProjectActive = project.active_days && project.active_days.split(',').includes(selectedDayOfWeek);
    const activeChecklists = checklists.filter(c => c.active_days.split(',').includes(selectedDayOfWeek))
        .filter(c => (!magicRevealing && !isWaterfalling) || visibleChecklistIds.has(c.id))
        .map(c => ({
            ...c,
            items: c.items.filter(item => {
                const p = todayProgress.find(prog => prog.checklist_item_id === item.id);
                return !(p && p.completed === 1);
            })
        }));

    return (
        <TaskPageLayout
            title={project?.title}
            titleContent={
                <div style={{
                    transition: 'all 0.35s ease',
                    opacity: Math.max(0, 1 - scrollTop / 60),
                    transform: `translateY(${scrollTop * 0.15}px)`
                }}>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                background: 'transparent',
                                border: '1px solid var(--primary-color)',
                                borderRadius: '4px',
                                padding: '0 4px',
                                width: '100%',
                                fontFamily: 'inherit',
                                outline: 'none',
                                letterSpacing: '-0.5px'
                            }}
                        />
                    ) : (
                        <h1
                            className="editable-title"
                            onClick={handleTitleClick}
                            style={{
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.5px',
                                display: 'inline-block',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }}
                        >
                            {project?.title}
                        </h1>
                    )}
                </div>
            }
            headerActions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginLeft: window.innerWidth <= 768 ? '-1rem' : '0' }}>
                    <button onClick={() => setShowTeamModal(true)} className="btn-icon-soft" title="צוות הפרויקט" style={{ padding: '0.4rem' }}>
                        <Users size={20} color="#666" />
                    </button>
                    <button onClick={() => setActiveTab(activeTab === 'tasks' ? 'history' : 'tasks')} className="btn-icon-soft" title={activeTab === 'tasks' ? 'יומן היסטוריה' : 'חזור למשימות'} style={{ padding: '0.4rem' }}>
                        {activeTab === 'tasks' ? <CalendarIcon size={20} color="#666" /> : <ListIcon size={20} color="#666" />}
                    </button>
                    <button onClick={() => setShowComments(true)} className="btn-icon-soft" title="תגובות הפרויקט" style={{ padding: '0.4rem' }}>
                        <MessageSquare size={20} color="#666" />
                    </button>
                    <div style={{ position: 'relative' }} ref={projectMenuRef}>
                        <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="btn-icon-soft" style={{ padding: '0.4rem' }}>
                            <MoreHorizontal size={20} color="#666" />
                        </button>
                        {showProjectMenu && (
                            <div className="card fade-in" style={{
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                width: '180px', padding: '0.5rem', zIndex: 1000,
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                            }}>
                                <button onClick={() => setShowSettings(true)} className="dropdown-item">
                                    <Settings size={16} /> הגדרות פרויקט
                                </button>
                                <button onClick={handleDuplicateProject} className="dropdown-item">
                                    <Copy size={16} /> שכפול פרויקט
                                </button>
                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem' }} />
                                <button onClick={handleDeleteProject} className="dropdown-item" style={{ color: 'var(--danger-color)' }}>
                                    <Trash2 size={16} /> מחיקת פרויקט
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            externalScrollTop={scrollTop}
            onScroll={setScrollTop}
            alternateHeaderPadding="1.75rem"
            breadcrumb="הפרויקטים שלי"
        >
            {activeTab === 'history' ? (
                <ProjectCalendar projectId={project.id} API_URL={API_URL} onDayClick={(date) => { setSelectedDate(date); setActiveTab('tasks'); }} />
            ) : (
                <>
                    {/* Tasks View */}
                    {selectedDate !== dateStr && (
                        <div className="slide-down" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CalendarIcon size={22} style={{ color: 'var(--primary-color)' }} />
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1rem' }}>צפייה בהיסטוריה</h3>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>אתה מסתכל על המשימות בתאריך: <strong style={{ color: 'var(--text-primary)' }}>{new Date(selectedDate).toLocaleDateString('he-IL')}</strong>. ניתן לערוך.</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDate(dateStr)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                חזור להיום
                            </button>
                        </div>
                    )}

                    {/* Main Content Area */}
                    {!isProjectActive && selectedDate === dateStr ? (
                        <div style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <CalendarIcon size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                            <h3>פרויקט זה אינו פעיל היום</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>תוכל לשנות זאת בהגדרות הפרויקט או לחזור ביום אחר.</p>
                        </div>
                    ) : (
                        <>
                            {isCreatingList === true && (
                                <div className="fade-in" style={{ padding: '0.75rem 1rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <form onSubmit={handleCreateCustomList} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="שם הרשימה החדשה..."
                                                value={newListTitle}
                                                onChange={(e) => setNewListTitle(e.target.value)}
                                                autoFocus
                                                style={{ flexGrow: 1, minWidth: '50px', border: 'none', background: 'transparent', fontSize: '1.05rem', padding: 0, outline: 'none', boxShadow: 'none' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                            <button type="button" onClick={() => { setIsCreatingList(false); setNewListTitle(''); }} className="desktop-only" style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>ביטול</button>
                                            <button type="submit" disabled={!newListTitle.trim()} className="desktop-only" style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: newListTitle.trim() ? '#d1453b' : 'rgba(209,69,59,0.5)', color: 'white', cursor: newListTitle.trim() ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>הוסף רשימה</button>

                                            {/* Mobile Icon Buttons */}
                                            <button type="button" onClick={() => { setIsCreatingList(false); setNewListTitle(''); }} className="mobile-only" style={{ padding: '0.5rem', border: 'none', background: 'var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                <X size={18} />
                                            </button>
                                            <button type="submit" disabled={!newListTitle.trim()} className="mobile-only" style={{ padding: '0.5rem', border: 'none', background: newListTitle.trim() ? '#d1453b' : 'rgba(209,69,59,0.5)', color: 'white', borderRadius: '8px', cursor: newListTitle.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeChecklists.length === 0 ? (
                                <div className="checklist-minimal" style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', border: 'none' }}>
                                    {/* Add Task Button for empty project */}
                                    <AddTaskButton onClick={async () => {
                                        // If no list exists, create a default one first
                                        try {
                                            const res = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    title: '',
                                                    project_id: projectId,
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                    <SortableContext
                                        items={activeChecklists.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {activeChecklists.map((checklist, idx) => (
                                            <React.Fragment key={checklist.id}>
                                                <SortableChecklistCard
                                                    checklist={checklist}
                                                    idx={idx}
                                                    expandedChecklists={expandedChecklists}
                                                    toggleChecklistExpanded={toggleChecklistExpanded}
                                                    handleDeleteChecklist={handleDeleteChecklist}
                                                    todayProgress={todayProgress}
                                                    sensors={sensors}
                                                    handleDragEnd={handleDragEnd}
                                                    activeTab={activeTab}
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
                                                    setIsCreatingList={setIsCreatingList}
                                                    projectTitle={project?.title || ''}
                                                    defaultProject={project}
                                                    onToggleExpand={() => toggleChecklistExpanded(checklist.id)}
                                                    onAddItem={(e, listId, parentId = null, content = null) => handleAddItem(e, listId, parentId, content)}
                                                    onDeleteItem={handleDeleteItem}
                                                    onUpdateItem={handleUpdateItem}
                                                    onToggleItem={toggleItem}
                                                    onDeleteChecklist={(e) => handleDeleteChecklist(e, checklist.id)}
                                                    API_URL={API_URL}
                                                    isInbox={false}
                                                    useSharedDndContext={true}
                                                    className={isWaterfalling && visibleChecklistIds.has(checklist.id) ? 'magic-reveal' : (location.state?.magicReveal ? `slide-down stagger-${(idx % 4) + 1}` : '')}
                                                    visibleTaskIds={visibleTaskIds}
                                                    isWaterfalling={isWaterfalling}
                                                />
                                                {isCreatingList === checklist.id && (
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
                            )}
                        </>
                    )
                    }
                </>
            )}

            {/* Team Management Modal */}
            {
                showTeamModal && (
                    <div className="sidebar-backdrop" onClick={() => setShowTeamModal(false)}>
                        <div className="card slide-up" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={24} /> צוות הפרויקט
                                </h2>
                                <button onClick={() => setShowTeamModal(false)} className="btn-icon-soft"><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Current Members */}
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem', color: 'var(--text-secondary)' }}>חברי הצוות ({projectMembers.length})</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {projectMembers.map(member => (
                                            <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%', background: member.profile_image ? `url(${API_URL}${member.profile_image}) center/cover`
                                                            : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                                                    }}>
                                                        {!member.profile_image && member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{member.username} {member.user_id === user.id && '(אני)'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.role === 'owner' ? 'מנהל צוות' : 'חבר צוות'}</div>
                                                    </div>
                                                </div>
                                                {member.user_id !== user.id && project?.user_id === user.id && (
                                                    <button onClick={() => handleRemoveMember(member.user_id)} className="btn-icon-soft" style={{ color: 'var(--danger-color)' }} title="הסר מהצוות">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Invite Friends section */}
                                {project?.user_id === user.id && ( // Only owner can add friends
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem', color: 'var(--text-secondary)' }}>הוסף מהחברים שלך</h3>
                                        {friends.length === 0 ? (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>טרם הוספת חברים. חפש משתמשים בעזרת אייקון החברים בתפריט הפרופיל שלך.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {friends
                                                    .filter(f => !projectMembers.some(pm => pm.user_id === (f.receiver_id === user.id ? f.requester_id : f.receiver_id)))
                                                    .map(f => {
                                                        const friendId = f.receiver_id === user.id ? f.requester_id : f.receiver_id;
                                                        const friendName = user.username === f.username ? "חבר" : f.username;
                                                        return (
                                                            <div key={friendId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <div style={{
                                                                        width: '32px', height: '32px', borderRadius: '50%', background: f.profile_image ? `url(${API_URL}${f.profile_image}) center/cover`
                                                                            : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                                                                    }}>
                                                                        {!f.profile_image && friendName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span style={{ fontWeight: 500 }}>{friendName}</span>
                                                                </div>
                                                                <button onClick={() => handleAddMember(friendId)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <UserPlus size={14} /> צרף לצוות
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettings && (
                    <div className="sidebar-backdrop" onClick={() => setShowSettings(false)}>
                        <div className="card slide-up" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: 0 }}>הגדרות פרויקט</h2>
                                <button onClick={() => setShowSettings(false)} className="btn-icon-soft"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSaveSettings}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>שם הפרויקט</label>
                                    <input
                                        type="text"
                                        value={settingsTitle}
                                        onChange={(e) => setSettingsTitle(e.target.value)}
                                        className="form-control"
                                    />
                                </div>

                                {project && project.is_routine ? (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ימי פעילות</label>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>בימים אלו הפרויקט יהיה זמין לביצוע. היסטוריית היומן תמדד בהתאמה.</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {weekDaysHebrew.map((day, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => toggleSettingsDay(index)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        border: `1px solid ${settingsDays.includes(index.toString()) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                                        background: settingsDays.includes(index.toString()) ? 'var(--primary-color)' : 'transparent',
                                                        color: settingsDays.includes(index.toString()) ? '#fff' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        transition: 'var(--transition)'
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success-color)' }}>
                                        <strong>פרויקט חד-פעמי 🎯</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            פרויקט זה זמין תמיד עד לסיומו.
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowSettings(false)} className="btn btn-secondary">ביטול</button>
                                    <button type="submit" className="btn btn-primary" disabled={!settingsTitle.trim() || (project?.is_routine && settingsDays.length === 0)}>שמור שינויים</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Comments Component */}
            <ProjectComments
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                project={project}
                user={user}
                comments={comments}
                loading={loadingComments}
                newComment={newComment}
                setNewComment={setNewComment}
                onPost={handlePostComment}
            />

        </TaskPageLayout>
    );
};

export default Project;
