import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, Store, Settings, LogOut, BookOpen, Plus, Folder, X, User as UserIcon, ChevronDown, ChevronUp, ListChecks, ArrowRight, Repeat, Target, CalendarDays, Calendar, Users, Hash, Bell, HelpCircle, PlusCircle, Search, Activity, CheckCircle, Inbox } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableProjectItem from './SortableProjectItem';
import SettingsModal from './SettingsModal';
import FriendsModal from './FriendsModal';
import CreateProjectModal from './CreateProjectModal';
import GlobalAddTaskModal from './GlobalAddTaskModal';
import DynamicTodayIcon from './DynamicTodayIcon';

const API_URL = '/api';

const Sidebar = ({ isOpen, onToggle }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const [projects, setProjects] = useState([]);
    const [counts, setCounts] = useState({ todayCount: 0, inboxCount: 0 });
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    const [initialSettingsTab, setInitialSettingsTab] = useState('account');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGlobalAddModal, setShowGlobalAddModal] = useState(false);

    // Template modal states
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [creationStep, setCreationStep] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [projectType, setProjectType] = useState('routine');
    const [newProjectTitle, setNewProjectTitle] = useState('');

    const userMenuRef = useRef(null);
    const addMenuRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/projects`);
            if (res.ok) setProjects(await res.json());
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, [user.id]);

    const fetchCounts = useCallback(async () => {
        try {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const res = await fetch(`${API_URL}/users/${user.id}/sidebar-counts?date=${todayStr}`);
            if (res.ok) setCounts(await res.json());
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    }, [user.id]);

    useEffect(() => {
        if (user) {
            fetchProjects();
            fetchCounts();
        }
    }, [user, location.pathname, fetchProjects, fetchCounts]);

    // Handle "on-hot" updates via shared events
    useEffect(() => {
        const handleRefresh = () => {
            fetchCounts();
            fetchProjects();
        };
        window.addEventListener('refreshSidebarCounts', handleRefresh);
        return () => window.removeEventListener('refreshSidebarCounts', handleRefresh);
    }, [fetchCounts, fetchProjects]);

    // Update whenever the sidebar is opened (user clicks/swipes it open)
    useEffect(() => {
        if (isOpen && user) {
            fetchCounts();
        }
    }, [isOpen, user, fetchCounts]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) setIsAddMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const openTemplateModal = async () => {
        setCreationStep('template');
        if (window.innerWidth <= 992) onToggle(); // Close sidebar on mobile
        setIsAddMenuOpen(false);
        if (templates.length === 0) {
            setFetchingTemplates(true);
            try {
                const res = await fetch(`${API_URL}/templates`);
                setTemplates(await res.json());
            } catch (e) {
                console.error('Failed to fetch templates', e);
            }
            setFetchingTemplates(false);
        }
    };

    const handleCreateProjectFromTemplate = async (e) => {
        e.preventDefault();
        if (!newProjectTitle.trim() || !selectedTemplate) return;
        try {
            const projectRes = await fetch(`${API_URL}/users/${user.id}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newProjectTitle, is_routine: projectType === 'routine' }),
            });
            if (projectRes.ok) {
                const newProject = await projectRes.json();
                await fetch(`${API_URL}/users/${user.id}/checklists/from-template`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ templateId: selectedTemplate.id, project_id: newProject.id, active_days: '0,1,2,3,4,5,6' }),
                });
                setProjects(prev => [newProject, ...prev]);
                setNewProjectTitle('');
                setProjectType('routine');
                setCreationStep(null);
                setSelectedTemplate(null);
                navigate(`/project/${newProject.id}`);
            }
        } catch (err) {
            console.error('Error creating project from template:', err);
        }
    };

    if (!user) return null;

    const navLinks = [
        { action: () => setShowGlobalAddModal(true), label: 'הוסף משימה', icon: PlusCircle, isAddTask: true },
        { path: '/inbox', label: 'תיבת המשימות', icon: Inbox, badge: counts.inboxCount > 0 ? counts.inboxCount.toString() : null },
        { path: '/today', label: 'היום', icon: DynamicTodayIcon, badge: counts.todayCount > 0 ? counts.todayCount.toString() : null },
        { path: '/calendar', label: 'לו"ז', icon: Calendar },
        { path: '/history', label: 'הושלמו', icon: CheckCircle },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const isProjectPage = location.pathname.startsWith('/project/');

    return (
        <>
            <aside className={`sidebar ${!isOpen ? 'closed' : 'open'}`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                        {/* User Selector */}
                        <div ref={userMenuRef} style={{ position: 'relative', flexGrow: 1, minWidth: 0 }}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    padding: '0.25rem', borderRadius: 'var(--radius-sm)',
                                    transition: 'var(--transition)', width: '100%',
                                    color: 'var(--text-primary)'
                                }}
                                className="sidebar-menu-item"
                            >
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    background: user.profile_image ? `url(${API_URL}${user.profile_image}) center/cover` : 'var(--primary-color)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                                }}>
                                    {!user.profile_image && <UserIcon size={14} />}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
                                <ChevronDown size={14} style={{ opacity: 0.6, transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', marginTop: '1px' }} />
                            </button>

                            {isUserMenuOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '0.4rem',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    width: '200px', zIndex: 1000, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                }}>
                                    <button onClick={() => { setIsFriendsOpen(true); setIsUserMenuOpen(false); if (window.innerWidth <= 992) onToggle(); }} className="sidebar-menu-item user-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right', width: '100%', color: 'var(--text-primary)' }}>
                                        <Users size={16} opacity={0.7} /> חברים
                                    </button>
                                    <button onClick={() => { setInitialSettingsTab('account'); setIsSettingsOpen(true); setIsUserMenuOpen(false); if (window.innerWidth <= 992) onToggle(); }} className="sidebar-menu-item user-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right', width: '100%', color: 'var(--text-primary)' }}>
                                        <Settings size={16} opacity={0.7} /> הגדרות חשבון
                                    </button>
                                    <button onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }} className="sidebar-menu-item user-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right', width: '100%', color: 'var(--text-primary)' }}>
                                        {theme === 'light' ? <Moon size={16} opacity={0.7} /> : <Sun size={16} opacity={0.7} />}
                                        {theme === 'light' ? 'מצב לילה' : 'מצב יום'}
                                    </button>
                                    <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="sidebar-menu-item user-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right', width: '100%', color: 'var(--danger-color)' }}>
                                        <LogOut size={16} opacity={0.7} /> התנתקות
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Top Utility Icons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', flexShrink: 0 }}>
                            <button className="btn-icon-soft" style={{ padding: '0.35rem', color: 'var(--text-secondary)', position: 'relative' }}>
                                <Bell size={18} strokeWidth={1.8} />
                                <span style={{ position: 'absolute', top: 5, left: 6, width: 7, height: 7, background: '#f97316', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }}></span>
                            </button>
                            <div style={{ width: '32px' }}></div> {/* Spacer for the Layout toggle button */}
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            if (link.isSearch) {
                                return (
                                    <Link key={link.label} to="/search" onClick={() => { if (window.innerWidth <= 992) onToggle(); }} className="nav-link sidebar-menu-item" style={{ color: 'var(--text-secondary)' }}>
                                        <Icon size={18} strokeWidth={1.8} className="nav-icon" />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            }
                            if (link.action) {
                                return (
                                    <button
                                        key={link.label}
                                        onClick={() => { link.action(); if (window.innerWidth <= 992) onToggle(); }}
                                        className="nav-link sidebar-menu-item"
                                        style={{
                                            width: '100%',
                                            textAlign: 'right',
                                            background: 'transparent',
                                            border: 'none',
                                            fontFamily: 'inherit',
                                            cursor: 'pointer',
                                            color: link.isAddTask ? 'var(--primary-color)' : 'inherit',
                                            fontWeight: link.isAddTask ? 700 : 500
                                        }}
                                    >
                                        <Icon
                                            size={link.isAddTask ? 20 : 18}
                                            strokeWidth={link.isAddTask ? 2 : 1.8}
                                            fill={link.isAddTask ? "var(--primary-color)" : "transparent"}
                                            color={link.isAddTask ? "white" : "currentColor"}
                                            className="nav-icon"
                                        />
                                        <span>{link.label}</span>
                                        {link.badge && <span className="sidebar-badge">{link.badge}</span>}
                                    </button>
                                );
                            }
                            const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
                            return (
                                <Link key={link.path} to={link.path} onClick={() => { if (window.innerWidth <= 992) onToggle(); }} className={`nav-link sidebar-menu-item ${isActive ? 'active' : ''}`}>
                                    <Icon size={18} strokeWidth={1.8} className="nav-icon" /><span>{link.label}</span>
                                    {link.badge && <span className="sidebar-badge">{link.badge}</span>}
                                </Link>
                            );
                        })}
                    </div>


                    {/* Projects section */}
                    <div className="nav-section" style={{ marginTop: '0.2rem' }}>
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0', marginBottom: '0', color: 'var(--text-primary)', position: 'relative' }} ref={addMenuRef}>
                            <Link to="/projects" className="nav-link" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', flexGrow: 1, borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}>
                                <Folder size={20} strokeWidth={1.8} style={{ color: 'var(--primary-color)' }} />
                                <span style={{ fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>הפרויקטים שלי</span>
                            </Link>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button className="btn-icon-soft" style={{ padding: '0.15rem' }} onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} title="פרויקט חדש">
                                    <Plus size={14} />
                                </button>
                                <button className="btn-icon-soft" style={{ padding: '0.15rem' }}>
                                    <ChevronDown size={14} />
                                </button>
                            </div>

                            {isAddMenuOpen && (
                                <div className="action-menu-dropdown fade-in slide-down" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', width: '200px', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
                                    <button className="action-menu-item" onClick={() => { setShowCreateModal(true); setIsAddMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                        <Folder size={16} style={{ color: 'var(--primary-color)' }} /><span>פרויקט חדש</span>
                                    </button>
                                    <button className="action-menu-item" onClick={openTemplateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                        <ListChecks size={16} style={{ color: 'var(--success-color)' }} /><span>חנות תבניות</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="projects-list">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={async (event) => {
                                    const { active, over } = event;
                                    if (active.id !== over?.id) {
                                        const oldIndex = projects.findIndex(p => p.id === active.id);
                                        const newIndex = projects.findIndex(p => p.id === over.id);
                                        const newProjects = arrayMove(projects, oldIndex, newIndex);
                                        setProjects(newProjects);

                                        try {
                                            await fetch(`${API_URL}/users/${user.id}/projects/reorder`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ projectIds: newProjects.map(p => p.id) })
                                            });
                                        } catch (err) {
                                            console.error('Failed to save project order', err);
                                        }
                                    }
                                }}
                            >
                                <SortableContext
                                    items={projects.filter(p => !p.parent_id).map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {(() => {
                                        const rootProjects = projects.filter(p => !p.parent_id);
                                        const getChildren = (parentId) => projects.filter(p => Number(p.parent_id) === Number(parentId));
                                        return rootProjects.map(proj => {
                                            const isProjActive = location.pathname === `/project/${proj.id}`;
                                            return (
                                                <SortableProjectItem
                                                    key={proj.id}
                                                    proj={proj}
                                                    isProjActive={isProjActive}
                                                    onToggle={onToggle}
                                                    getChildren={getChildren}
                                                    location={location}
                                                />
                                            );
                                        });
                                    })()}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-link sidebar-menu-item" style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', padding: '0.5rem' }}>
                        <HelpCircle size={18} style={{ opacity: 0.6 }} strokeWidth={2} className="nav-icon" />
                        <span style={{ fontSize: '0.9rem' }}>עזרה ומשאבים</span>
                    </button>
                </div>
            </aside>

            {/* Template Store Modal */}
            {creationStep === 'template' && (
                <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCreationStep(null)}>
                    <div className="card slide-up shadow-xl mobile-modal-fullscreen" style={{ width: '95%', maxWidth: '1100px', height: '85vh', overflow: 'hidden', padding: 0, background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--success-color)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}><ListChecks size={24} /></div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>חנות תבניות</h2>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>מצא את תבנית השגרה המושלמת עבורך</span>
                                </div>
                            </div>
                            <button onClick={() => setCreationStep(null)} className="btn-icon-soft" title="סגור"><X size={28} /></button>
                        </div>
                        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                            <div className="mobile-modal-scroll" style={{ flexGrow: 1, padding: '2rem', overflowY: 'auto', background: 'var(--bg-color)' }}>
                                {!selectedTemplate ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                                            <h3 style={{ margin: 0 }}>תבניות נבחרות</h3>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{templates.length} תבניות נמצאו</span>
                                        </div>
                                        {fetchingTemplates ? (
                                            <div style={{ textAlign: 'center', padding: '4rem' }}>
                                                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                                                <p style={{ color: 'var(--text-secondary)' }}>טוען תבניות...</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                                {templates.map((tmp, idx) => (
                                                    <div key={tmp.id} className={`card hover-scale stagger-${(idx % 4) + 1}`} onClick={() => { setSelectedTemplate(tmp); setNewProjectTitle(tmp.title); setProjectType('routine'); }} style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ListChecks size={24} /></div>
                                                            <div>
                                                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{tmp.title}</h4>
                                                                <span style={{ fontSize: '0.75rem', background: 'var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>רשימת משימות</span>
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.5 }}>{tmp.description || 'רשימת משימות מאורגנת.'}</p>
                                                        <div style={{ marginTop: 'auto', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                                                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                {tmp.items && tmp.items.slice(0, 3).map((item, i) => (
                                                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }}></div>
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.content}</span>
                                                                    </li>
                                                                ))}
                                                                {tmp.items && tmp.items.length > 3 && <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+ ועוד {tmp.items.length - 3} משימות...</li>}
                                                            </ul>
                                                        </div>
                                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                            השתמש בתבנית זו &rarr;
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ margin: '0 auto', padding: '2rem 0', maxWidth: '600px' }}>
                                        <button onClick={() => setSelectedTemplate(null)} className="btn-icon-soft" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
                                            <ArrowRight size={18} /> חזרה לחנות
                                        </button>
                                        <div className="card shadow-lg" style={{ padding: '2.5rem', borderTop: '4px solid var(--success-color)' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><ListChecks size={32} /></div>
                                                <h2 style={{ margin: '0 0 0.5rem' }}>{selectedTemplate.title}</h2>
                                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>הגדר את פרטי הפרויקט.</p>
                                            </div>
                                            <form onSubmit={handleCreateProjectFromTemplate}>
                                                <div style={{ marginBottom: '2rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>שם הפרויקט</label>
                                                    <input type="text" className="form-control" placeholder="הכנס שם..." value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)} autoFocus style={{ padding: '1rem', fontSize: '1.1rem' }} />
                                                </div>
                                                <div style={{ marginBottom: '2.5rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>סוג הפרויקט</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <div className={`selection-card ${projectType === 'routine' ? 'selected' : ''}`} onClick={() => setProjectType('routine')} style={{ padding: '1rem', cursor: 'pointer' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Repeat size={20} /><span style={{ fontWeight: 600 }}>שגרה קבועה</span></div>
                                                        </div>
                                                        <div className={`selection-card ${projectType === 'once' ? 'selected' : ''}`} onClick={() => setProjectType('once')} style={{ padding: '1rem', cursor: 'pointer' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Target size={20} /><span style={{ fontWeight: 600 }}>יעד חד-פעמי</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={!newProjectTitle.trim()}>
                                                    <Plus size={22} /> התחל עם תבנית זו
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={(newProject) => {
                    setProjects(prev => [newProject, ...prev]);
                    setShowCreateModal(false);
                    if (window.innerWidth <= 992) onToggle();
                    navigate(`/project/${newProject.id}`);
                }}
                existingProjects={projects}
                userId={user.id}
                apiUrl={API_URL}
            />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} initialTab={initialSettingsTab} />
            <FriendsModal isOpen={isFriendsOpen} onClose={() => setIsFriendsOpen(false)} />

            <GlobalAddTaskModal isOpen={showGlobalAddModal} onClose={() => setShowGlobalAddModal(false)} />
        </>
    );
};

export default Sidebar;
