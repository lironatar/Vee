import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Plus, Trash2, Repeat, Target, ListChecks, ArrowRight, ChevronDown, X, Search, ChevronLeft, Hash } from 'lucide-react';
import TaskPageLayout from '../components/TaskPageLayout';
import CreateProjectModal from '../components/CreateProjectModal';
import TemplateStoreModal from '../components/TemplateStoreModal';
import cache from '../utils/cache';

const API_URL = '/api';

const Home = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [projects, setProjects] = useState(() => cache.get('home_projects') || []);
    const [loading, setLoading] = useState(!cache.get('home_projects'));

    // New Add Project states
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                cache.set('home_projects', data);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
        setLoading(false);
    }, [user.id]);

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user, fetchProjects]);

    // Click outside listener for the dropdown menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isAddMenuOpen && !e.target.closest('.add-dropdown-container')) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAddMenuOpen]);

    const handleDeleteProject = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('האם אתה בטוח שברצונך למחוק פרויקט זה ואת כל התבניות שבתוכו?')) return;
        try {
            await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
        }
    };

    const PageLoader = () => (
        <div style={{ padding: '1rem 0' }}>
            <div className="skeleton-box skeleton-title"></div>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-row" style={{ padding: '15px 0' }}>
                    <div className="skeleton-box skeleton-circle" style={{ width: '24px', height: '24px' }}></div>
                    <div className="skeleton-box skeleton-text" style={{ width: `${Math.random() * 30 + 40}%`, height: '18px' }}></div>
                </div>
            ))}
        </div>
    );

    if (loading && projects.length === 0) {
        return (
            <TaskPageLayout title="טוען...">
                <PageLoader />
            </TaskPageLayout>
        );
    }


    return (
        <TaskPageLayout
            title="הפרויקטים שלי"
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
                        הפרויקטים שלי
                    </h1>
                </div>
            }
            externalScrollTop={scrollTop}
            onScroll={setScrollTop}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '5rem' }}>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
                    <div className="add-dropdown-container" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.6rem',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Plus size={16} style={{ opacity: 0.6 }} />
                            הוסף
                            <ChevronDown size={14} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: isAddMenuOpen ? 'rotate(180deg)' : 'none' }} />
                        </button>

                        {isAddMenuOpen && (
                            <div
                                className="action-menu-dropdown fade-in slide-down"
                                style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                                    width: '200px', zIndex: 100, background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
                                }}
                            >
                                <button
                                    className="action-menu-item"
                                    onClick={() => { setShowCreateModal(true); setIsAddMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                    <Folder size={16} style={{ color: 'var(--primary-color)' }} />
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>פרויקט חדש</div>
                                </button>
                                <button
                                    className="action-menu-item"
                                    onClick={() => { setShowTemplateModal(true); setIsAddMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                    <ListChecks size={16} style={{ color: 'var(--success-color)' }} />
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>בחר מתבנית</div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <CreateProjectModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(newProject) => {
                        setProjects([newProject, ...projects]);
                        navigate(`/project/${newProject.id}`);
                    }}
                    existingProjects={projects}
                    userId={user.id}
                    apiUrl={API_URL}
                />

                <TemplateStoreModal
                    isOpen={showTemplateModal}
                    onClose={() => setShowTemplateModal(false)}
                    onCreated={(newProject) => {
                        setProjects([newProject, ...projects]);
                        const isMagic = newProject._fromTemplateMagic;
                        navigate(`/project/${newProject.id}`, isMagic ? { state: { magicReveal: true } } : undefined);
                    }}
                    userId={user.id}
                    apiUrl={API_URL}
                />

                {projects.length === 0 ? (
                    <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <Folder size={64} style={{ color: 'var(--text-secondary)', margin: '0 auto 1.5rem', opacity: 0.5 }} />
                        <h3 style={{ marginBottom: '1rem' }}>אין לך פרויקטים עדיין</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>התחל על ידי יצירת פרויקט חדש לדוגמה &quot;Vee&quot;.</p>
                        <button onClick={() => setIsAddMenuOpen(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                            הוסף פרויקט חדש <ChevronDown size={16} />
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(150,150,150,0.2)', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{projects.length} פרויקטים</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/project/${project.id}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.6rem 0.5rem',
                                        textDecoration: 'none',
                                        color: 'var(--text-primary)',
                                        transition: 'background 0.2s',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Hash size={18} style={{ color: '#b3b3b3' }} />
                                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{project.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </TaskPageLayout>
    );
};

export default Home;
