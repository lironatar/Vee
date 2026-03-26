import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'מחיקת משימה', 
    message = 'האם אתה בטוח שברצונך למחוק את המשימה? פעולה זו אינה ניתנת לביטול.',
    confirmText = 'מחק',
    cancelText = 'ביטול',
    isDanger = true
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    return createPortal(
        <div 
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease-out',
                direction: 'rtl'
            }}
        >
            <div 
                ref={modalRef}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '400px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header with Icon */}
                <div style={{
                    padding: '1.5rem 1.5rem 0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(var(--primary-rgb), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDanger ? '#EF4444' : 'var(--primary-color)'
                    }}>
                        {isDanger ? <TriangleAlert size={24} /> : <TriangleAlert size={24} />}
                    </div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}>
                        {title}
                    </h3>
                </div>

                {/* Message */}
                <div style={{
                    padding: '0.5rem 1.5rem 1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                }}>
                    {message}
                </div>

                {/* Actions */}
                <div style={{
                    padding: '1rem 1.5rem 1.5rem',
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: isDanger ? '#EF4444' : 'var(--primary-color)',
                            color: isDanger ? '#FFFFFF' : 'var(--btn-text-primary, #FFFFFF)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>,
        document.body
    );
};

export default ConfirmModal;
