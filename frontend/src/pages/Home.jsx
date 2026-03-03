import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Plus, Trash2, Repeat, Target, ListChecks, ArrowRight, ChevronDown, X, Search, ChevronLeft, Hash } from 'lucide-react';
import TaskPageLayout from '../components/TaskPageLayout';

const API_URL = '/api';

const Home = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Add Project states
    const [creationStep, setCreationStep] = useState(null); // 'blank' | 'template'
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);

    // Search (removed)

    // Template tracking
    const [templates, setTemplates] = useState([]);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const [newTitle, setNewTitle] = useState('');
    const [projectType, setProjectType] = useState('routine'); // 'routine' | 'once'

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
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

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            // Step 1: Create the Project
            const projectRes = await fetch(`${API_URL}/users/${user.id}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    is_routine: projectType === 'routine'
                })
            });

            if (projectRes.ok) {
                const newProject = await projectRes.json();

                // Step 2: If a template was selected, apply it immediately
                if (creationStep === 'template' && selectedTemplate) {
                    await fetch(`${API_URL}/users/${user.id}/checklists/from-template`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            templateId: selectedTemplate.id,
                            project_id: newProject.id,
                            active_days: '0,1,2,3,4,5,6'
                        })
                    });

                    // Navigate immediately to the newly created and populated project
                    navigate(`/project/${newProject.id}`);
                    return;
                }

                // If no template, update UI locally and navigate
                setProjects([newProject, ...projects]);
                setNewTitle('');
                setProjectType('routine');
                setCreationStep(null);
                setSelectedTemplate(null);
                navigate(`/project/${newProject.id}`);
            }
        } catch (err) {
            console.error('Error creating project:', err);
        }
    };

    const openTemplateModal = async () => {
        setCreationStep('template');
        setIsAddMenuOpen(false);
        if (templates.length === 0) {
            setFetchingTemplates(true);
            try {
                const res = await fetch(`${API_URL}/templates`);
                setTemplates(await res.json());
            } catch (e) {
                console.error("Failed to fetch templates", e);
            }
            setFetchingTemplates(false);
        }
    };

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

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>טוען נתונים...</div>;


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
                                    onClick={() => { setCreationStep('blank'); setProjectType('routine'); setNewTitle(''); setIsAddMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                    <Folder size={16} style={{ color: 'var(--primary-color)' }} />
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>פרויקט חדש</div>
                                </button>
                                <button
                                    className="action-menu-item"
                                    onClick={openTemplateModal}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'right', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                    <ListChecks size={16} style={{ color: 'var(--success-color)' }} />
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>בחר מתבנית</div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {creationStep === 'blank' && (
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px dashed var(--primary-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Folder size={24} style={{ color: 'var(--primary-color)' }} />
                                יצירת פרויקט חדש מהיסוד
                            </h3>
                            <button onClick={() => setCreationStep(null)} className="btn-icon-soft" title="ביטול">
                                <X size={20} />
                            </button>
                        </div>

                        <h4 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>1. איזה סוג פרויקט זה?</h4>
                        <div className="grid-2" style={{ marginBottom: '2rem' }}>
                            <div
                                className={`selection-card ${projectType === 'routine' ? 'selected' : ''}`}
                                onClick={() => setProjectType('routine')}
                            >
                                <Repeat size={32} style={{ color: 'var(--primary-color)', margin: '0 auto' }} />
                                <h4>שגרה</h4>
                                <p>פעולות שחוזרות על עצמן בימים קבועים.</p>
                            </div>
                            <div
                                className={`selection-card ${projectType === 'once' ? 'selected' : ''}`}
                                onClick={() => setProjectType('once')}
                            >
                                <Target size={32} style={{ color: 'var(--primary-color)', margin: '0 auto' }} />
                                <h4>חד-פעמי</h4>
                                <p>יעד ספציפי או משימה גדולה שמסתיימת.</p>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>2. תן שם לפרויקט</h4>
                        <form onSubmit={handleCreateProject} className="flex-responsive" style={{ justifyContent: 'center' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="לדוגמה: אימוני בוקר, לימודים..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                autoFocus
                                style={{ maxWidth: '400px' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={!newTitle.trim()}>
                                צור פרויקט {projectType === 'routine' ? 'שגרה' : 'חד-פעמי'}
                            </button>
                        </form>
                    </div>
                )}

                {creationStep === 'template' && (
                    <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCreationStep(null)}>
                        <div className="card slide-up shadow-xl mobile-modal-fullscreen" style={{ width: '95%', maxWidth: '1100px', height: '85vh', overflow: 'hidden', padding: 0, background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'var(--success-color)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                                        <ListChecks size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>חנות תבניות</h2>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>מצא את תבנית השגרה המושלמת עבורך</span>
                                    </div>
                                </div>
                                <button onClick={() => setCreationStep(null)} className="btn-icon-soft" title="סגור"><X size={28} /></button>
                            </div>

                            {/* Modal Body: Left menu + Right Grid */}
                            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                                {/* Left Side: Mock Categories (For aesthetic perfection) */}
                                <div style={{ width: '250px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '1.5rem', overflowY: 'auto', display: 'none' /* hidden for now unless user wants strict categories */ }}>
                                    <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>קטגוריות</h4>
                                    {/* Placeholder for categories */}
                                </div>

                                {/* Right Side: Template Grid Area */}
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
                                                    <p style={{ color: 'var(--text-secondary)' }}>טוען תבניות מדהימות מהחנות...</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                                    {templates.map((tmp, idx) => (
                                                        <div
                                                            key={tmp.id}
                                                            className="card hover-scale"
                                                            onClick={() => { setSelectedTemplate(tmp); setNewTitle(tmp.title); setProjectType('routine'); }}
                                                            style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}
                                                        >
                                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <ListChecks size={24} />
                                                                </div>
                                                                <div>
                                                                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{tmp.title}</h4>
                                                                    <span style={{ fontSize: '0.75rem', background: 'var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>רשימת משימות</span>
                                                                </div>
                                                            </div>
                                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                                                {tmp.description || "רשימת משימות מאורגנת שמחכה לך שתתחיל לעבוד איתה."}
                                                            </p>

                                                            {/* Template Items Preview */}
                                                            <div style={{ marginTop: 'auto', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                    {tmp.items && tmp.items.slice(0, 3).map((item, i) => (
                                                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }}></div>
                                                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</span>
                                                                        </li>
                                                                    ))}
                                                                    {tmp.items && tmp.items.length > 3 && (
                                                                        <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.2rem', paddingRight: '0.8rem' }}>
                                                                            + ועוד {tmp.items.length - 3} משימות בתוך התבנית...
                                                                        </li>
                                                                    )}
                                                                    {(!tmp.items || tmp.items.length === 0) && (
                                                                        <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>אין משימות בתבנית זו.</li>
                                                                    )}
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
                                        <div className="slide-up max-w-2xl" style={{ margin: '0 auto', padding: '2rem 0' }}>
                                            <button onClick={() => setSelectedTemplate(null)} className="btn-icon-soft" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
                                                <ArrowRight size={18} /> חזרה לחנות
                                            </button>

                                            <div className="card shadow-lg" style={{ padding: '2.5rem', borderTop: '4px solid var(--success-color)' }}>
                                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                                        <ListChecks size={32} />
                                                    </div>
                                                    <h2 style={{ margin: '0 0 0.5rem' }}>{selectedTemplate.title}</h2>
                                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>הגדר את פרטי הפרויקט החדש עבור תבנית זו.</p>
                                                </div>

                                                <form onSubmit={handleCreateProject}>
                                                    <div style={{ marginBottom: '2rem' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>שם הפרויקט</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="הכנס שם שיתאים לך..."
                                                            value={newTitle}
                                                            onChange={(e) => setNewTitle(e.target.value)}
                                                            autoFocus
                                                            style={{ padding: '1rem', fontSize: '1.1rem' }}
                                                        />
                                                    </div>

                                                    <div style={{ marginBottom: '2.5rem' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>סוג הפרויקט שיותאם לתבנית</label>
                                                        <div className="grid-2">
                                                            <div className={`selection-card ${projectType === 'routine' ? 'selected' : ''}`} onClick={() => setProjectType('routine')} style={{ padding: '1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <Repeat size={20} /> <span style={{ fontWeight: 600 }}>מוגדר כשגרה קבועה</span>
                                                                </div>
                                                            </div>
                                                            <div className={`selection-card ${projectType === 'once' ? 'selected' : ''}`} onClick={() => setProjectType('once')} style={{ padding: '1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <Target size={20} /> <span style={{ fontWeight: 600 }}>מוגדר כיעד חד-פעמי</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={!newTitle.trim()}>
                                                        <Plus size={22} /> התחל עם תבנית זו עכשיו
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

                {projects.length === 0 && !creationStep ? (
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
