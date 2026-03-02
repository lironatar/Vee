import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Check, ChevronDown, Repeat, Target } from 'lucide-react';

const PROJECT_COLORS = [
    { label: 'לבן', value: '#ffffff' },
    { label: 'סגול', value: '#6366f1' },
    { label: 'כחול', value: '#3b82f6' },
    { label: 'ציאן', value: '#06b6d4' },
    { label: 'ירוק', value: '#22c55e' },
    { label: 'ליים', value: '#84cc16' },
    { label: 'צהוב', value: '#eab308' },
    { label: 'כתום', value: '#f97316' },
    { label: 'אדום', value: '#ef4444' },
    { label: 'ורוד', value: '#ec4899' },
    { label: 'אפור', value: '#6b7280' },
];

export default function CreateProjectModal({ isOpen, onClose, onCreated, existingProjects = [], userId, apiUrl }) {
    const [title, setTitle] = useState('');
    const [color, setColor] = useState('#ffffff');
    const [parentId, setParentId] = useState('');
    const [loading, setLoading] = useState(false);

    // Dropdown states
    const [isColorOpen, setIsColorOpen] = useState(false);
    const [isParentOpen, setIsParentOpen] = useState(false);

    const colorRef = useRef(null);
    const parentRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (colorRef.current && !colorRef.current.contains(e.target)) setIsColorOpen(false);
            if (parentRef.current && !parentRef.current.contains(e.target)) setIsParentOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/users/${userId}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    color,
                    parent_id: parentId ? Number(parentId) : null,
                    is_routine: true,
                }),
            });
            if (res.ok) {
                const newProject = await res.json();
                onCreated(newProject);
                setTitle('');
                setColor('#ffffff');
                setParentId('');
                onClose();
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        }
        setLoading(false);
    };

    const rootProjects = existingProjects.filter(p => !p.parent_id);
    const selectedColorObj = PROJECT_COLORS.find(c => c.value === color) || PROJECT_COLORS[0];
    const selectedParent = existingProjects.find(p => p.id === Number(parentId));

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="card animate-pop"
                style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '440px',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
                    overflow: 'visible',
                    border: '1px solid var(--border-color)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: color === '#ffffff' ? 'var(--hover-bg)' : color + '20',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'var(--transition)',
                        }}>
                            <Folder size={24} color={color === '#ffffff' ? 'var(--text-primary)' : color} strokeWidth={2} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>פרויקט חדש</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>הוסף מרחב עבודה חדש</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon-soft" style={{ padding: '0.5rem' }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Name */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                            שם הפרויקט
                        </label>
                        <input
                            type="text"
                            autoFocus
                            className="form-control"
                            placeholder="מה התוכניות שלך?"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{
                                height: '52px',
                                padding: '0 1.25rem',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-color)',
                                fontSize: '1.05rem',
                                fontWeight: 500
                            }}
                        />
                    </div>

                    {/* Color Dropdown */}
                    <div className="form-group" style={{ position: 'relative' }} ref={colorRef}>
                        <label className="form-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                            צבע
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsColorOpen(!isColorOpen)}
                            style={{
                                width: '100%',
                                height: '52px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                border: `2px solid ${isColorOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                background: 'var(--bg-color)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 22, height: 22, borderRadius: '6px', background: selectedColorObj.value, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedColorObj.label}</span>
                            </div>
                            <ChevronDown size={18} style={{ transform: isColorOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-secondary)' }} />
                        </button>

                        {isColorOpen && (
                            <div className="dropdown-menu fade-in slide-down" style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
                                background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, maxHeight: '250px', overflowY: 'auto'
                            }}>
                                {PROJECT_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => { setColor(c.value); setIsColorOpen(false); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem',
                                            border: 'none', background: color === c.value ? 'var(--hover-bg)' : 'transparent',
                                            cursor: 'pointer', textAlign: 'right', transition: '0.2s'
                                        }}
                                        className="dropdown-item"
                                    >
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.value, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                        <span style={{ flex: 1, fontWeight: color === c.value ? 700 : 500, color: 'var(--text-primary)' }}>{c.label}</span>
                                        {color === c.value && <Check size={16} color="var(--primary-color)" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Parent Selector */}
                    <div className="form-group" style={{ position: 'relative' }} ref={parentRef}>
                        <label className="form-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                            תת-פרויקט של (אופציונלי)
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsParentOpen(!isParentOpen)}
                            style={{
                                width: '100%',
                                height: '52px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                border: `2px solid ${isParentOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                background: 'var(--bg-color)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Folder size={18} style={{ color: selectedParent ? (selectedParent.color || 'var(--text-secondary)') : 'var(--text-secondary)' }} />
                                <span style={{ fontWeight: 600, color: selectedParent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {selectedParent ? selectedParent.title : 'ללא — פרויקט ראשי'}
                                </span>
                            </div>
                            <ChevronDown size={18} style={{ transform: isParentOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-secondary)' }} />
                        </button>

                        {isParentOpen && (
                            <div className="dropdown-menu fade-in slide-down" style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
                                background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, maxHeight: '200px', overflowY: 'auto'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => { setParentId(''); setIsParentOpen(false); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem',
                                        border: 'none', background: !parentId ? 'var(--hover-bg)' : 'transparent',
                                        cursor: 'pointer', textAlign: 'right'
                                    }}
                                >
                                    <span style={{ flex: 1, fontWeight: !parentId ? 700 : 500, color: 'var(--text-primary)' }}>ללא — פרויקט ראשי</span>
                                    {!parentId && <Check size={16} color="var(--primary-color)" />}
                                </button>
                                {rootProjects.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setParentId(p.id.toString()); setIsParentOpen(false); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem',
                                            border: 'none', background: Number(parentId) === p.id ? 'var(--hover-bg)' : 'transparent',
                                            cursor: 'pointer', textAlign: 'right'
                                        }}
                                    >
                                        <Folder size={16} color={p.color || 'var(--text-secondary)'} />
                                        <span style={{ flex: 1, fontWeight: Number(parentId) === p.id ? 700 : 500, color: 'var(--text-primary)' }}>{p.title}</span>
                                        {Number(parentId) === p.id && <Check size={16} color="var(--primary-color)" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="btn btn-primary"
                            style={{
                                flex: 1,
                                height: '52px',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                background: color === '#ffffff' ? 'var(--primary-color)' : color,
                                border: 'none',
                                opacity: !title.trim() || loading ? 0.6 : 1,
                                boxShadow: color === '#ffffff' ? 'none' : `0 8px 16px ${color}40`,
                            }}
                        >
                            {loading ? 'יוצר...' : 'שמירה'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            style={{
                                flex: 1,
                                height: '52px',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                background: 'var(--bg-color)',
                                border: 'none',
                                color: 'var(--text-primary)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

