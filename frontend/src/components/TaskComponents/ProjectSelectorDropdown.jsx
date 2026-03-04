import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { List, Check, Search, Inbox, Folder } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const API_URL = '/api';

const ProjectSelectorDropdown = ({ isOpen, onClose, anchorRef, onSelect, selectedChecklistId }) => {
    const { user } = useUser();
    const [projects, setProjects] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        if (!isOpen || !user) return;
        const fetchData = async () => {
            try {
                const [projRes, checkRes] = await Promise.all([
                    fetch(`${API_URL}/users/${user.id}/projects`),
                    fetch(`${API_URL}/users/${user.id}/checklists`)
                ]);
                if (projRes.ok) setProjects(await projRes.json());
                if (checkRes.ok) setChecklists(await checkRes.json());
            } catch (error) {
                console.error('Failed to fetch projects/checklists for selector:', error);
            }
        };
        fetchData();
    }, [isOpen, user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                anchorRef.current && !anchorRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    if (!isOpen) return null;

    const filteredProjects = projects.filter(p => !p.parent_id && p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredInboxChecklists = checklists.filter(c => !c.project_id && (c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 'תיבת המשימות'.includes(searchQuery) || 'הפרויקט הראשון שלי'.includes(searchQuery)));

    // Group lists by project
    const getProjectChecklists = (project) => {
        // If the project itself matches, show all its lists.
        const projectMatches = project.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (projectMatches) {
            return checklists.filter(c => c.project_id === project.id);
        }
        // Otherwise, show only the lists that match the search
        return checklists.filter(c => c.project_id === project.id && c.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    };

    const handleSelect = (checklist, project) => {
        onSelect(checklist, project);
        onClose();
    };

    const renderItem = (checklist, project, isInbox = false) => {
        const isSelected = selectedChecklistId === checklist.id;
        // Use CSS variable for standard list icons to adapt to light/dark mode
        const iconColor = 'var(--text-secondary)';
        return (
            <div
                key={checklist.id}
                onClick={() => handleSelect(checklist, project)}
                style={{
                    padding: '0.4rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0 0.25rem',
                    transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'var(--bg-secondary)' : 'transparent'}
            >
                <List size={14} color={iconColor} style={{ opacity: isInbox ? 0.9 : 0.6 }} />
                <span style={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isSelected ? 600 : 400 }}>
                    {checklist.title || (isInbox ? 'תיבת המשימות' : (project ? project.title : 'כללי'))}
                </span>
                {isSelected && <Check size={14} color="var(--primary-color)" />}
            </div>
        );
    };

    const renderProjectSection = (project) => {
        const projectMatches = project.title.toLowerCase().includes(searchQuery.toLowerCase());
        const projectLists = getProjectChecklists(project);

        if (projectLists.length === 0 && !projectMatches) return null;

        return (
            <div key={project.id} style={{ marginBottom: '0.5rem' }}>
                <div style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Folder size={14} color={project.color && project.color !== '#ffffff' ? project.color : 'var(--text-secondary)'} style={{ opacity: 1 }} />
                    {project.title}
                </div>
                {projectLists.length > 0 ? (
                    <div style={{ paddingRight: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {projectLists.map(c => renderItem(c, project))}
                    </div>
                ) : (
                    // Just the project itself if it has no lists but matched search
                    <div style={{ padding: '0.4rem 0.8rem', paddingRight: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        אין רשימות בפרויקט זה
                    </div>
                )}
            </div>
        );
    };

    return createPortal(
        <div ref={dropdownRef} className="dropdown-menu slide-down fade-in" style={{
            position: 'absolute',
            top: anchorRef.current ? anchorRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
            left: anchorRef.current ? (
                (() => {
                    const rect = anchorRef.current.getBoundingClientRect();
                    const dropdownWidth = 275;
                    // Aligned more to the right side (where labels are in RTL) and shifted a bit left
                    let left = rect.right + window.scrollX - dropdownWidth - 20;
                    // Prevent going off screen left
                    if (left < 10) left = 10;
                    // Prevent going off screen right
                    if (left + dropdownWidth > window.innerWidth - 10) {
                        left = window.innerWidth - dropdownWidth - 10;
                    }
                    return left;
                })()
            ) : 0,
            width: '275px',
            maxHeight: '400px',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="הקלד פרויקט..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem 0.4rem 2.2rem',
                            border: '1px solid transparent',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                            boxSizing: 'border-box'
                        }}
                        onFocus={e => { e.target.style.background = 'var(--bg-color)'; e.target.style.borderColor = '#246fe0'; e.target.style.boxShadow = '0 0 0 1px #246fe0'; }}
                        onBlur={e => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0.25rem 0' }}>
                {/* Inbox Checklists */}
                {filteredInboxChecklists.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Inbox size={14} color="var(--text-secondary)" style={{ opacity: 0.8 }} />
                            תיבת המשימות
                        </div>
                        <div style={{ paddingRight: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            {filteredInboxChecklists.map(c => renderItem(c, null, true))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {projects.filter(p => !p.parent_id).map(renderProjectSection)}

                {projects.filter(p => !p.parent_id).every(p => {
                    const projectMatches = p.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const projectLists = getProjectChecklists(p);
                    return projectLists.length === 0 && !projectMatches;
                }) && filteredInboxChecklists.length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            לא נמצאו פרויקטים תואמים
                        </div>
                    )}
            </div>
        </div>,
        document.body
    );
};

export default ProjectSelectorDropdown;
