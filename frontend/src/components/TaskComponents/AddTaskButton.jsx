import React from 'react';
import { Plus } from 'lucide-react';

const AddTaskButton = ({ onClick, noMarginTop = false }) => {
    return (
        <button
            className="add-task-btn"
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.35rem 0',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                width: '100%',
                marginTop: noMarginTop ? '0' : '0.5rem',
                transition: 'color 0.2s, background 0.2s',
                borderRadius: 'var(--radius-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} style={{ color: 'var(--primary-color)' }} />
            </div>
            <span style={{ fontWeight: 500, fontSize: '15px' }}>הוסף משימה</span>
        </button>
    );
};

export default AddTaskButton;
