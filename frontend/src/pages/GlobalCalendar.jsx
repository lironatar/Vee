import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = '/api';

const GlobalCalendar = () => {
    const { user } = useUser();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('calendarViewMode') || 'daily');
    const [monthlyData, setMonthlyData] = useState({});
    const [hoveredDay, setHoveredDay] = useState(null);
    const [visibleMonths, setVisibleMonths] = useState([0, 1]); // offsets from current selected month
    const scrollContainerRef = React.useRef(null);

    const { isSidebarOpen } = useOutletContext();

    // Headers removed from here

    useEffect(() => {
        localStorage.setItem('calendarViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (user && selectedDate) {
            if (viewMode === 'daily') {
                fetchGlobalSchedule();
            } else {
                fetchMonthlySummary();
            }
        }
    }, [user, selectedDate, viewMode]);

    const fetchMonthlySummary = async (monthStr) => {
        if (monthlyData[monthStr]) return; // Avoid redundant fetches
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/tasks/by-month?month=${monthStr}`);
            if (res.ok) {
                const data = await res.json();
                setMonthlyData(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error fetching monthly summary', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalSchedule = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/tasks/by-date?date=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Error fetching global schedule', error);
        }
        setLoading(false);
    };

    // Advanced Calendar Strip Logic
    const generateDateStrip = () => {
        const dates = [];
        const current = new Date(selectedDate);
        // show 3 days before and 3 days after
        for (let i = -3; i <= 3; i++) {
            const d = new Date(current);
            d.setDate(current.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const handleDateChange = (daysToAdd) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + daysToAdd);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const toggleItem = async (e, itemId, currentStatus) => {
        e.stopPropagation();

        const newStatus = !currentStatus;

        // Optimistic update using deep clone
        const updatedProjects = projects.map(p => ({
            ...p,
            checklists: p.checklists.map(c => ({
                ...c,
                items: c.items.map(i => {
                    const toggleRecursive = (node) => {
                        if (node.id === itemId) return { ...node, completed: newStatus };
                        if (node.children) return { ...node, children: node.children.map(toggleRecursive) };
                        return node;
                    };
                    return toggleRecursive(i);
                })
            }))
        }));
        setProjects(updatedProjects);

        try {
            await fetch(`${API_URL}/users/${user.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checklist_item_id: itemId,
                    date: selectedDate,
                    completed: newStatus
                })
            });
        } catch (err) {
            console.error('Failed to update progress', err);
            fetchGlobalSchedule(); // Revert on failure
        }
    };

    const renderTask = (item, depth = 0) => (
        <div key={item.id} style={{ paddingRight: `${depth * 1.5}rem`, marginTop: '0.5rem' }}>
            <div
                className="task-item"
                onClick={(e) => toggleItem(e, item.id, item.completed)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    background: item.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                    border: `1px solid ${item.completed ? 'var(--success-color)' : 'var(--border-color)'}`,
                    cursor: 'pointer', transition: 'var(--transition)'
                }}
            >
                <div className="check-circle" style={{ color: item.completed ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                    {item.completed ? <CheckCircle size={22} className="check-icon-active" /> : <Circle size={22} />}
                </div>
                <span style={{
                    flexGrow: 1,
                    fontSize: depth === 0 ? '1.05rem' : '0.95rem',
                    textDecoration: item.completed ? 'line-through' : 'none',
                    color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {item.content}
                    {item.target_date && (
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', opacity: item.completed ? 0.6 : 1 }}>
                            {new Date(item.target_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </span>
            </div>
            {item.children && item.children.length > 0 && (
                <div style={{ borderRight: '2px solid var(--border-color)', paddingRight: '0.5rem', marginRight: '0.75rem' }}>
                    {item.children.map(child => renderTask(child, depth + 1))}
                </div>
            )}
        </div>
    );

    const renderMonthGrid = (year, month) => {
        const currentMonthDate = new Date(year, month - 1, 1);
        const daysInMonth = new Date(year, month, 0).getDate();
        const startDayOfWeek = currentMonthDate.getDay(); // 0 is Sunday
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        const isMobileView = window.innerWidth <= 768;

        const days = [];
        // empty slots
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${monthKey}-${i}`} style={{ padding: isMobileView ? '0.5rem' : '1rem', background: 'transparent' }} />);
        }

        // day slots
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${monthKey}-${String(i).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDate === dateStr;
            const data = monthlyData[dateStr];

            days.push(
                <div
                    key={dateStr}
                    onClick={() => { setSelectedDate(dateStr); if (!isMobileView) setViewMode('daily'); }}
                    onMouseEnter={() => !isMobileView && setHoveredDay(dateStr)}
                    onMouseLeave={() => !isMobileView && setHoveredDay(null)}
                    className={`calendar-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    style={{
                        padding: isMobileView ? '0.5rem 0.25rem' : '1rem 0.5rem',
                        background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : (isToday ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-color)'),
                        border: isSelected ? '2px solid var(--primary-color)' : (isToday ? '2px solid var(--accent-color)' : '1px solid var(--border-color)'),
                        borderRadius: 'var(--radius-md)',
                        minHeight: isMobileView ? '80px' : '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        zIndex: isSelected ? 2 : 1
                    }}
                >
                    <span style={{
                        fontWeight: (isToday || isSelected) ? 'bold' : 'normal',
                        color: isSelected ? 'var(--primary-color)' : (isToday ? 'var(--accent-color)' : 'var(--text-primary)'),
                        fontSize: isMobileView ? '0.9rem' : '1rem',
                        marginBottom: '0.25rem'
                    }}>{i}</span>

                    {data && data.total > 0 && (
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%' }}>
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: isMobileView ? '1px' : '2px',
                                padding: '2px'
                            }}>
                                {data.tasks.slice(0, isMobileView ? 2 : 3).map((t, idx) => (
                                    <div key={idx} style={{
                                        width: isMobileView ? '4px' : '6px',
                                        height: isMobileView ? '4px' : '6px',
                                        borderRadius: '50%',
                                        background: t.completed ? 'var(--success-color)' : 'var(--primary-color)'
                                    }} />
                                ))}
                                {data.total > (isMobileView ? 2 : 3) && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1 }}>+</div>}
                            </div>
                            {!isMobileView && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{data.total} משימות</span>}
                        </div>
                    )}

                    {!isMobileView && hoveredDay === dateStr && data && data.tasks && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 100,
                            padding: '0.75rem',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lg)',
                            minWidth: '200px',
                            marginBottom: '0.5rem',
                            pointerEvents: 'none',
                            textAlign: 'right'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {data.tasks.slice(0, 5).map((task, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        {task.completed ? <CheckCircle size={14} style={{ color: 'var(--success-color)' }} /> : <Circle size={14} style={{ color: 'var(--primary-color)' }} />}
                                        <span style={{ color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {task.content}
                                        </span>
                                    </div>
                                ))}
                                {data.total > 5 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.2rem', marginTop: '0.2rem' }}>
                                        ועוד {data.total - 5} משימות...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const dayNamesShort = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
        const dayNamesLong = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        return (
            <div key={monthKey} style={{ marginBottom: isMobileView ? '1.5rem' : '3rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                }}>
                    <h2 style={{ margin: 0, fontSize: isMobileView ? '1.1rem' : '1.3rem', color: 'var(--primary-color)', fontWeight: 800 }}>
                        {currentMonthDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobileView ? '2px' : '0.5rem', textAlign: 'center' }}>
                    {(isMobileView ? dayNamesShort : dayNamesLong).map(day => (
                        <div key={day} style={{ fontWeight: 800, color: 'var(--text-secondary)', paddingBottom: '0.5rem', fontSize: isMobileView ? '0.75rem' : '0.85rem' }}>{day}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    const renderMonthlyGrid = () => {
        const isMobileView = window.innerWidth <= 768;
        const selectedDateData = monthlyData[selectedDate];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
                <div
                    ref={scrollContainerRef}
                    style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}
                    className="hide-scrollbar"
                    onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.target;

                        // Appending: Near bottom
                        if (scrollHeight - scrollTop - clientHeight < 400) {
                            const lastOffset = visibleMonths[visibleMonths.length - 1];
                            if (visibleMonths.length < 24) {
                                const nextOffset = lastOffset + 1;
                                setVisibleMonths(prev => [...prev, nextOffset].sort((a, b) => a - b));
                                const d = new Date(selectedDate);
                                d.setDate(1);
                                d.setMonth(d.getMonth() + nextOffset);
                                fetchMonthlySummary(d.toISOString().substring(0, 7));
                            }
                        }

                        // Prepending: Near top
                        if (scrollTop < 100) {
                            const firstOffset = visibleMonths[0];
                            if (visibleMonths.length < 24) {
                                const prevOffset = firstOffset - 1;

                                // Save scroll info to adjust after update
                                const scrollNode = e.target;
                                const oldScrollHeight = scrollNode.scrollHeight;
                                const oldScrollTop = scrollNode.scrollTop;

                                setVisibleMonths(prev => {
                                    if (prev.includes(prevOffset)) return prev;
                                    return [prevOffset, ...prev].sort((a, b) => a - b);
                                });

                                const d = new Date(selectedDate);
                                d.setDate(1);
                                d.setMonth(d.getMonth() + prevOffset);
                                fetchMonthlySummary(d.toISOString().substring(0, 7));

                                // Practical adjustment: Wait for React to render and then fix scroll
                                requestAnimationFrame(() => {
                                    if (scrollNode) {
                                        const newScrollHeight = scrollNode.scrollHeight;
                                        scrollNode.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                                    }
                                });
                            }
                        }
                    }}
                >
                    <div style={{ height: '20px' }} />

                    {visibleMonths.sort((a, b) => a - b).map(offset => {
                        const d = new Date(selectedDate);
                        d.setDate(1);
                        d.setMonth(d.getMonth() + offset);
                        return renderMonthGrid(d.getFullYear(), d.getMonth() + 1);
                    })}
                </div>

                {/* Mobile Task Detail Section */}
                {isMobileView && selectedDate && (
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderTop: '2px solid var(--border-color)',
                        maxHeight: '40%',
                        overflowY: 'auto',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                        zIndex: 30
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                {new Date(selectedDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
                            </h3>
                            <button
                                onClick={() => setViewMode('daily')}
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                            >
                                למסך המלא
                            </button>
                        </div>

                        {selectedDateData && selectedDateData.tasks && selectedDateData.tasks.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {selectedDateData.tasks.map(task => renderTask(task))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                אין משימות מתוכננות ליום זה
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderWeeklyView = () => {
        const start = new Date(selectedDate);
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek); // Start from Sunday

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDate === dateStr;
            const data = monthlyData[dateStr];

            days.push(
                <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className="card"
                    style={{
                        padding: '1rem',
                        flex: 1,
                        minWidth: '200px',
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: isToday ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                            {d.toLocaleDateString('he-IL', { weekday: 'long' })}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {d.getDate()}/{d.getMonth() + 1}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data && data.tasks && data.tasks.length > 0 ? (
                            <>
                                {data.tasks.slice(0, 5).map((task, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                        {task.completed ? <CheckCircle size={14} style={{ color: 'var(--success-color)' }} /> : <Circle size={14} style={{ color: 'var(--primary-color)' }} />}
                                        <span style={{ color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {task.content}
                                        </span>
                                    </div>
                                ))}
                                {data.total > 5 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        +{data.total - 5} נוספים
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', paddingTop: '1rem' }}>אין משימות</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="weekly-container hide-scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem 0', paddingBottom: '2rem' }}>
                {days}
            </div>
        );
    };

    const [scrollTop, setScrollTop] = useState(0);

    return (
        <div className="page-grid" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Calendar Header - Glassmorphism */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '0.75rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: scrollTop > 20 ? 'rgba(var(--bg-secondary-rgb, 255, 255, 255), 0.5)' : 'transparent',
                backdropFilter: scrollTop > 20 ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: scrollTop > 20 ? 'blur(10px)' : 'none',
                borderBottom: scrollTop > 20 ? '1px solid var(--border-color)' : 'none',
                transition: 'all 0.4s ease',
                height: '60px',
                flexWrap: 'nowrap',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: Math.min(1, Math.max(0, (scrollTop - 20) / 30)),
                    transform: `translateY(${Math.max(0, 10 - (scrollTop - 20) / 3)}px)`,
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                        <CalendarIcon size={18} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>מבט גלובלי</h1>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: Math.min(1, Math.max(0, (scrollTop - 20) / 30)),
                    transform: `translateY(${Math.max(0, 10 - (scrollTop - 20) / 3)}px)`,
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => setViewMode('daily')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'daily' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'daily' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>יומי</button>
                        <button onClick={() => setViewMode('weekly')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'weekly' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'weekly' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>שבועי</button>
                        <button onClick={() => setViewMode('monthly')} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: viewMode === 'monthly' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'monthly' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>חודשי</button>
                    </div>
                </div>
            </div>

            <div
                className="page-content"
                style={{ flex: 1, overflowY: 'auto', padding: '4rem 0 0 0' }}
                onScroll={(e) => setScrollTop(e.target.scrollTop)}
            >
                {viewMode === 'monthly' ? (
                    loading && Object.keys(monthlyData).length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>טוען לוח שנה...</div> : renderMonthlyGrid()
                ) : viewMode === 'weekly' ? (
                    loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>טוען שבוע...</div> : renderWeeklyView()
                ) : (
                    <>
                        {/* Date Selector Strip */}
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => handleDateChange(-1)} className="btn-icon-soft" title="יום קודם" style={{ padding: '0.5rem' }}>
                                <ChevronRight size={24} />
                            </button>

                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem', flexGrow: 1, justifyContent: 'center' }} className="hide-scrollbar">
                                {generateDateStrip().map((date, idx) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = selectedDate === dateStr;
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(dateStr)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                                minWidth: '70px', padding: '0.75rem 0.5rem',
                                                borderRadius: '16px', border: 'none', cursor: 'pointer',
                                                background: isSelected ? 'var(--primary-color)' : (isToday ? 'rgba(56, 189, 248, 0.1)' : 'transparent'),
                                                color: isSelected ? 'white' : 'var(--text-primary)',
                                                transition: 'all 0.3s ease',
                                                boxShadow: isSelected ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                {date.toLocaleDateString('he-IL', { weekday: 'short' })}
                                            </span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {date.getDate()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                {date.toLocaleDateString('he-IL', { month: 'short' })}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => handleDateChange(1)} className="btn-icon-soft" title="יום הבא" style={{ padding: '0.5rem' }}>
                                <ChevronLeft size={24} />
                            </button>
                        </div>

                        {/* Schedule View */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>טוען נתונים...</div>
                        ) : projects.length === 0 ? (
                            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <CalendarIcon size={64} style={{ color: 'var(--text-secondary)', margin: '0 auto 1.5rem', opacity: 0.5 }} />
                                <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>אין משימות מתוכננות ליום זה</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>הפרויקטים והשגרות שלך נקיים להיום. יום חופשי!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '2rem' }}>
                                {projects.map(project => (
                                    <div key={project.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {project.project_id === 0 ? <CalendarIcon size={20} /> : <div style={{ width: '8px', height: '24px', background: 'var(--primary-color)', borderRadius: '4px' }} />}
                                                {project.title}
                                            </h2>
                                            {project.project_id !== 0 && (
                                                <Link to={`/project/${project.project_id}`} className="btn-icon-soft" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>
                                                    לפרויקט המלא <ArrowRight size={14} />
                                                </Link>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {project.checklists.map(checklist => (
                                                <div key={checklist.id} className="card" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{checklist.title}</h3>
                                                    {checklist.items.length === 0 ? (
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>אין משימות ברשימה זו ליום זה.</p>
                                                    ) : (
                                                        <div>
                                                            {checklist.items.map(item => renderTask(item))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GlobalCalendar;
