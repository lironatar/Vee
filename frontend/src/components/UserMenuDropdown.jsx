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
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '2px 6px 20px rgba(0,0,0,0.12), 0 -2px 10px rgba(0,0,0,0.03)',
            width: '300px',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '0.4rem 0'
        }}>
            <button
                onClick={() => handleAction(() => setIsFriendsOpen(true))}
                className="sidebar-menu-item user-menu-item"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', borderBottom: '1px solid #f0f0f0',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'right', width: '100%', color: '#1a1a1a',
                    fontSize: '1.05rem', fontWeight: 500
                }}
            >
                <Users size={20} opacity={0.8} />
                <span>חברים</span>
            </button>

            <button
                onClick={() => handleAction(() => { setInitialSettingsTab('account'); setIsSettingsOpen(true); })}
                className="sidebar-menu-item user-menu-item"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', borderBottom: '1px solid #f0f0f0',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'right', width: '100%', color: '#1a1a1a',
                    fontSize: '1.05rem', fontWeight: 500
                }}
            >
                <Settings size={20} opacity={0.8} />
                <span>הגדרות חשבון</span>
            </button>

            <button
                onClick={() => handleAction(toggleTheme)}
                className="sidebar-menu-item user-menu-item"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'right',
                    width: '100%', color: '#1a1a1a',
                    fontSize: '1.05rem', fontWeight: 500
                }}
            >
                {theme === 'light' ? <Moon size={20} opacity={0.8} /> : <Sun size={20} opacity={0.8} />}
                <span>{theme === 'light' ? 'מצב לילה' : 'מצב יום'}</span>
            </button>

            <div style={{ height: '1px', background: '#f0f0f0', margin: '0.2rem 0' }} />

            <button
                onClick={() => handleAction(logout)}
                className="sidebar-menu-item user-menu-item"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 1.25rem', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'right',
                    width: '100%', color: 'var(--danger-color)',
                    fontSize: '1.05rem', fontWeight: 600
                }}
            >
                <LogOut size={20} opacity={0.8} />
                <span>התנתקות</span>
            </button>
        </div>
    );
};

export default UserMenuDropdown;
