import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CalendarWrapper from '../components/CalendarWrapper';
import { Plus, X } from 'lucide-react';
import AddTaskCard from '../components/TaskComponents/AddTaskCard';
import TaskPageLayout from '../components/TaskPageLayout';

const API_URL = '/api';

const GlobalCalendar = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('calendarViewMode') || 'monthly');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [currentRange, setCurrentRange] = useState({ start: null, end: null });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalDate, setSelectedModalDate] = useState('');
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [dummyInbox, setDummyInbox] = useState({ id: 'inbox', title: 'תיבת המשימות' });

    const { isSidebarOpen } = useOutletContext();
    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        localStorage.setItem('calendarViewMode', viewMode);
    }, [viewMode]);

    // Format events for FullCalendar
    const fetchCalendarEvents = async (targetMonth = null) => {
        if (!user) return;

        // Use targetMonth or fallback to current view or today
        let monthSearch = targetMonth;
        if (!monthSearch) {
            const date = new Date();
            monthSearch = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        setIsRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/tasks/by-month?month=${monthSearch}`);
            if (res.ok) {
                const summary = await res.json();

                // Parse summary into fullcalendar events array
                const eventList = [];
                for (const [dateStr, data] of Object.entries(summary)) {
                    if (data.tasks) {
                        data.tasks.forEach(task => {
                            const startVal = task.time ? `${dateStr}T${task.time}` : dateStr;
                            eventList.push({
                                id: task.id,
                                title: task.content,
                                start: startVal,
                                allDay: !task.time,
                                extendedProps: {
                                    completed: task.completed
                                }
                            });
                        });
                    }
                }
                setEvents(eventList);
            }
        } catch (error) {
            console.error('Error fetching calendar events', error);
            toast.error('שגיאה בטעינת נתוני לוח שנה');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDatesSet = (dateInfo) => {
        // FullCalendar's datesSet gives us the visible range.
        // We'll extract the "central" month of the view to fetch.
        const midDate = new Date((dateInfo.start.getTime() + dateInfo.end.getTime()) / 2);
        const y = midDate.getFullYear();
        const m = String(midDate.getMonth() + 1).padStart(2, '0');
        const monthStr = `${y}-${m}`;

        // Avoid redundant fetches if we are already in this month range
        if (monthStr !== currentRange.month) {
            setCurrentRange({ month: monthStr });
            fetchCalendarEvents(monthStr);
        }
    };

    useEffect(() => {
        // Initial load is handled by handleDatesSet in FullCalendar
    }, [user]);

    const handleDateClick = (arg) => {
        setSelectedModalDate(arg.dateStr);
        setNewTaskContent('');
        setIsModalOpen(true);
    };

    const handleAddItem = async (e, _checklistId, parentId = null, explicitContent = null) => {
        if (e) e.preventDefault();
        const contentToSave = explicitContent !== null ? explicitContent : newTaskContent;
        if (!contentToSave || !contentToSave.trim()) return;

        setIsCreating(true);
        try {
            let targetChecklistId = _checklistId;
            // If it's undefined or the dummy 'inbox' id, fetch the actual inbox ID.
            if (!targetChecklistId || targetChecklistId === 'inbox') {
                const clRes = await fetch(`${API_URL}/users/${user.id}/checklists`);
                if (!clRes.ok) throw new Error('Failed to fetch lists');
                const lists = await clRes.json();
                let inbox = lists.find(c => c.project_id === null);

                if (!inbox) {
                    // Create an inbox checklist if it doesn't exist
                    const createRes = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: '',
                            project_id: null,
                            active_days: '0,1,2,3,4,5,6'
                        })
                    });
                    if (!createRes.ok) throw new Error('Failed to auto-create inbox');
                    inbox = await createRes.json();
                }
                targetChecklistId = inbox.id;
            }

            const res = await fetch(`${API_URL}/checklists/${targetChecklistId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSave.trim(),
                    target_date: window.globalNewItemDate || selectedModalDate,
                    time: window.globalNewItemTime || null,
                    description: window.globalNewItemDesc || null,
                    repeat_rule: window.globalNewItemRepeatRule || null,
                    parent_item_id: parentId
                })
            });

            if (res.ok) {
                toast.success('משימה נוצרה בהצלחה');
                setIsModalOpen(false);
                setNewTaskContent('');
                fetchCalendarEvents(currentRange.month); // Refresh current visible month
            } else {
                toast.error('שגיאה ביצירת המשימה');
            }
        } catch (error) {
            console.error('Error creating task from calendar', error);
            toast.error('שגיאה ביצירת המשימה: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEventClick = (arg) => {
        const { event } = arg;
        const isCompleted = event.extendedProps.completed;
        // In the future: open task details modal or navigate to project
        toast(`משימה: ${event.title}\nמצב: ${isCompleted ? 'הושלמה' : 'פתוחה'}`);
    };

    const handleEventDrop = async (arg) => {
        const { event, revert } = arg;
        const newDate = event.startStr.split('T')[0]; // simple YYYY-MM-DD
        let newTime = null;
        if (!event.allDay && event.start.getHours()) {
            newTime = event.startStr.split('T')[1].substring(0, 5); // HH:mm
        }

        try {
            const res = await fetch(`${API_URL}/items/${event.id}/datetime`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_date: newDate,
                    time: newTime
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update event date/time');
            }
            toast.success('תאריך המשימה עודכן בהצלחה');
        } catch (e) {
            console.error(e);
            toast.error('שגיאה בעדכון התאריך');
            revert();
        }
    };

    const handleEventResize = async (arg) => {
        // Similar to drop, but usually just extending time
        // Just calling drop logic for simplicity, though resize changes end date, which we don't track on backend yet.
        toast.info('שינוי אורך אירוע לא נתמך כרגע');
        arg.revert();
    };

    return (
        <TaskPageLayout
            title="לוח שנה"
            titleContent={
                <div style={{
                    transition: 'all 0.35s ease',
                    opacity: Math.max(0, 1 - scrollTop / 60),
                    transform: `translateY(${scrollTop * 0.15}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                            <CalendarIcon size={18} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            לוח שנה
                        </h1>
                    </div>
                </div>
            }
            headerActions={
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.2rem', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                    <button onClick={() => setViewMode('daily')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'daily' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'daily' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontWeight: viewMode === 'daily' ? '600' : '400' }}>יומי</button>
                    <button onClick={() => setViewMode('weekly')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'weekly' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'weekly' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontWeight: viewMode === 'weekly' ? '600' : '400' }}>שבועי</button>
                    <button onClick={() => setViewMode('monthly')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'monthly' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'monthly' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontWeight: viewMode === 'monthly' ? '600' : '400' }}>חודשי</button>
                </div>
            }
            onScroll={setScrollTop}
            externalScrollTop={scrollTop}
        >
            {loading && events.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary-color)' }}>
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : (
                <div className="card" style={{ flex: 1, padding: isMobile ? '0.5rem' : '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                    {isRefreshing && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, color: 'var(--primary-color)' }}>
                            <Loader2 className="animate-spin" size={20} />
                        </div>
                    )}
                    <CalendarWrapper
                        events={events}
                        viewMode={viewMode}
                        onDateClick={handleDateClick}
                        onEventClick={handleEventClick}
                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventResize}
                        onDatesSet={handleDatesSet}
                        height="auto"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: ''
                        }}
                    />
                </div>
            )}

            {/* Quick Add Task Modal */}
            {isModalOpen && (
                <div
                    className="modal-overlay fade-in"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
                    onMouseDown={(e) => {
                        // Close if clicked exactly on the overlay
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}
                >
                    <div
                        className="slide-up"
                        style={{ width: '90%', maxWidth: '600px', pointerEvents: 'auto' }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <AddTaskCard
                            newItemContent={newTaskContent}
                            setNewItemContent={setNewTaskContent}
                            newItemDate={selectedModalDate}
                            setNewItemDate={setSelectedModalDate}
                            checklist={dummyInbox}
                            setAddingToList={() => setIsModalOpen(false)}
                            handleAddItem={handleAddItem}
                            suppressDateSpan={false}
                        />
                    </div>
                </div>
            )}
        </TaskPageLayout>
    );
};

export default GlobalCalendar;
