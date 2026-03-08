import React from 'react';
import { Users, Settings, Moon, Sun, LogOut } from 'lucide-react';

const UserMenuDropdown = ({
    theme,
    toggleTheme,
    logout,
    setIsFriendsOpen,
    setIsUserMenuOpen,
    setInitialSettingsTab,
    setIsSettingsOpen,
    onToggle
}) => {
    const isMobile = window.innerWidth <= 992;

    const handleAction = (callback) => {
        callback();
        setIsUserMenuOpen(false);
        if (isMobile && onToggle) onToggle();
    };

    return (
        <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.6rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            width: '300px',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '0.4rem 0'
        }}>
            <button
                onClick={() => handleAction(() => setIsFriendsOpen(true))}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'right', width: '100%', color: 'var(--text-primary)',
                    fontSize: '1.05rem', fontWeight: 500, fontFamily: 'inherit',
                    transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <Users size={20} opacity={0.8} />
                <span>חברים</span>
            </button>

            <button
                onClick={() => handleAction(() => { setInitialSettingsTab('account'); setIsSettingsOpen(true); })}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'right', width: '100%', color: 'var(--text-primary)',
                    fontSize: '1.05rem', fontWeight: 500, fontFamily: 'inherit',
                    transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <Settings size={20} opacity={0.8} />
                <span>הגדרות חשבון</span>
            </button>

            <button
                onClick={() => handleAction(toggleTheme)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'right',
                    width: '100%', color: 'var(--text-primary)',
                    fontSize: '1.05rem', fontWeight: 500, fontFamily: 'inherit',
                    transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {theme === 'light' ? <Moon size={20} opacity={0.8} /> : <Sun size={20} opacity={0.8} />}
                <span>{theme === 'light' ? 'מצב לילה' : 'מצב יום'}</span>
            </button>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />

            <button
                onClick={() => handleAction(logout)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'right',
                    width: '100%', color: 'var(--danger-color)',
                    fontSize: '1.05rem', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <LogOut size={20} opacity={0.8} />
                <span>התנתקות</span>
            </button>
        </div>
    );
};

export default UserMenuDropdown;
