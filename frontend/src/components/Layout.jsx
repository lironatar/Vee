import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';


const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 992);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobile(mobile);
            // Auto open/close when crossing breakpoint
            if (mobile && isSidebarOpen) setIsSidebarOpen(false);
            if (!mobile && !isSidebarOpen) setIsSidebarOpen(true);
        };
        const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);
        const handleScroll = () => setScrolled(window.scrollY > 10);

        window.addEventListener('resize', handleResize);
        window.addEventListener('toggleSidebar', handleToggleSidebar);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('toggleSidebar', handleToggleSidebar);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isSidebarOpen]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={`app-layout ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
            {/* Sidebar Overlay for Mobile/Tablet */}
            <div
                className={`sidebar-overlay ${isSidebarOpen && isMobile ? 'visible' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

            <div className="content-wrapper">
                {/* Sidebar Reopen Button - Visible when sidebar is closed */}
                {!isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="btn-icon-soft menu-toggle-btn fade-in"
                        title="פתח סרגל"
                        style={{
                            position: 'fixed',
                            top: '0.75rem',
                            right: '0.75rem',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1100,
                            background: 'var(--bg-secondary)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <img
                            src="/sidebar_is_closed.svg"
                            alt="sidebar toggle"
                            style={{
                                width: '28px',
                                height: 'auto',
                                filter: 'var(--invert-icon)',
                                transition: 'all 0.3s ease',
                                display: 'block'
                            }}
                        />
                    </button>
                )}

                <main className="main-content fade-in">
                    <Outlet context={{ isSidebarOpen, toggleSidebar }} />
                </main>
            </div>
        </div>
    );
};



export default Layout;
