import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, Store, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useUser();
    const location = useLocation();

    if (!user) return null;

    const navLinks = [
        { path: '/', label: 'היומי שלי', icon: LayoutDashboard },
        { path: '/store', label: 'תבניות', icon: Store },
        { path: '/admin', label: 'ניהול', icon: Settings },
    ];

    return (
        <nav className="glass-panel" style={{
            padding: '0.4rem 0.75rem',
            marginBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box',
        }}>
            {/* LEFT icons — pushed to far left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={toggleTheme} className="btn-icon-soft" title="החלף עיצוב">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button onClick={logout} className="btn-icon-soft" title="התנתק" style={{ color: 'var(--danger-color)' }}>
                    <LogOut size={20} />
                </button>
            </div>

            {/* CENTER nav links */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)',
                                background: isActive ? 'var(--primary-color)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-primary)',
                                fontWeight: isActive ? 600 : 400,
                                fontSize: '0.88rem',
                            }}
                        >
                            <Icon size={16} />
                            <span className="desktop-only">{link.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* RIGHT — username pushed to far right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                    background: 'var(--bg-secondary)', padding: '0.2rem 0.75rem',
                    borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
                    fontSize: '0.82rem', color: 'var(--text-secondary)'
                }}>
                    שלום, <b style={{ color: 'var(--text-primary)' }}>{user.username}</b>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
