import React from 'react';

const Header = ({
    scrollTop,
    hPadding,
    breadcrumb,
    title,
    isMobile,
    isSidebarOpen,
    headerActions
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: `0.75rem ${hPadding} 0.4rem`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: scrollTop > 30 ? 'var(--bg-color)' : 'transparent',
            backdropFilter: scrollTop > 30 ? 'blur(10px)' : 'none',
            WebkitBackdropFilter: scrollTop > 30 ? 'blur(10px)' : 'none',
            borderBottom: '1px solid',
            borderBottomColor: scrollTop > 30 ? 'var(--border-color)' : 'transparent', // Constant height, only color changes
            transition: 'background-color 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
            height: '54px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-between'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {breadcrumb && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: '#666',
                            fontWeight: 500,
                            fontSize: '14px',
                            paddingRight: isMobile && !isSidebarOpen ? '29.5px' : '0'
                        }}>
                            {breadcrumb} <span style={{ opacity: 0.5 }}>/</span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        opacity: Math.min(1, Math.max(0, (scrollTop - 36) / 30)), // Appearance threshold
                        transform: `translateY(${Math.max(0, 12 - (scrollTop - 36) / 2)}px)`, // Linear mapping to scroll
                        pointerEvents: scrollTop > 20 ? 'auto' : 'none',
                        transition: 'opacity 0.1s ease', // Only animate opacity, let transform follow scroll 1:1
                        paddingRight: (!breadcrumb && isMobile && !isSidebarOpen) ? '30px' : '0'
                    }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#000000', // Pure black
                            lineHeight: 1,
                            WebkitTextFillColor: '#000000' // Force black on mobile safari/chrome
                        }}>{title}</h1>
                    </div>
                </div>
                <div style={{ marginLeft: '-10px' }}>{headerActions}</div>
            </div>
        </div>
    );
};

export default Header;
