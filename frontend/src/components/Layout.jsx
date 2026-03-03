import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutDashboard } from 'lucide-react';

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
                <button
                    onClick={toggleSidebar}
                    className="btn-icon-soft menu-toggle-btn"
                    title={isSidebarOpen ? "סגור סרגל" : "פתח סרגל"}
                    style={{
                        position: 'fixed',
                        top: '1.25rem',
                        right: isSidebarOpen ? '255px' : '1rem',
                        zIndex: 1100,
                        background: 'transparent',
                        boxShadow: 'none',
                        border: 'none',
                        padding: '0.45rem',
                        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease, color 0.2s ease',
                        color: isSidebarOpen ? 'var(--text-secondary)' : 'var(--text-primary)',
                    }}
                >
                    <LayoutDashboard size={20} strokeWidth={2.2} />
                </button>

                <main className="main-content fade-in">
                    <Outlet context={{ isSidebarOpen, toggleSidebar }} />
                </main>
            </div>
        </div>
    );
};



export default Layout;
