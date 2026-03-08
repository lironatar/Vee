import React from 'react';
import { Plus } from 'lucide-react';

const AddTaskButton = ({ onClick, noMarginTop = false }) => {
    return (
        <button
            className="add-task-btn"
            onClick={onClick}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginTop: noMarginTop ? '0' : '0.5rem',
                transition: 'var(--transition)',
                borderRadius: 'var(--radius-full)'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--primary-color)';
                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.15)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} style={{ color: 'var(--primary-color)' }} />
            </div>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>הוסף משימה</span>
        </button>
    );
};

export default AddTaskButton;
