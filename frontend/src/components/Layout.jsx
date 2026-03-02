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
                        className="btn-icon-soft menu-toggle-btn"
                        title="פתח תבניות"
                        style={{
                            position: 'fixed',
                            top: '1rem',
                            right: '1rem',
                            zIndex: 1100,
                            background: 'var(--bg-secondary)',
                            boxShadow: 'var(--card-shadow)',
                            border: '1px solid var(--border-color)',
                            padding: '0.45rem',
                            transition: 'var(--transition)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="15" x2="15" y1="3" y2="21" />
                        </svg>
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
