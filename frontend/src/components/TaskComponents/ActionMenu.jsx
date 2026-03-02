import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';

const ActionMenu = ({ onDelete, onSetDate, itemDate, label = "אפשרויות" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        onDelete(e);
    };

    return (
        <div className="action-menu-container" ref={menuRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="btn-icon-soft"
                title={label}
                style={{ padding: '0.4rem', color: 'var(--text-secondary)', letterSpacing: '1px', fontWeight: 'bold' }}
            >
                ...
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--card-shadow)',
                    minWidth: '120px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '0.2rem' }}>
                        {onSetDate && (
                            <div style={{ position: 'relative', width: '100%' }}>
                                <button
                                    className="action-menu-item"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        width: '100%', textAlign: 'right',
                                        padding: '0.5rem 1rem', background: 'transparent',
                                        border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    <CalendarIcon size={14} /> הגדר תאריך יעד
                                </button>
                                <input
                                    type="date"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    value={itemDate || ''}
                                    onChange={(e) => { onSetDate(e.target.value); setIsOpen(false); }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <button
                            onClick={handleDelete}
                            className="action-menu-item action-menu-item-danger"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                width: '100%', textAlign: 'right',
                                padding: '0.5rem 1rem', background: 'transparent',
                                border: 'none', cursor: 'pointer', color: 'var(--danger-color)',
                                borderRadius: 'var(--radius-sm)', marginTop: onSetDate ? '0.25rem' : '0'
                            }}
                        >
                            <Trash2 size={14} /> מחיקה
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionMenu;
