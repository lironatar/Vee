import React from 'react';
import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableProjectItem = ({ proj, isProjActive, onToggle, getChildren, location }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: proj.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 2000 : 1,
    };

    const children = getChildren(proj.id);
    const projColor = proj.color && proj.color !== '#ffffff' ? proj.color : 'var(--text-secondary)';

    return (
        <div ref={setNodeRef} style={style}>
            <div {...attributes} {...listeners} style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'default' }}>
                <Link
                    to={`/project/${proj.id}`}
                    onClick={() => { if (window.innerWidth <= 992) onToggle(); }}
                    className={`nav-link project-link sidebar-menu-item ${isProjActive ? 'active' : ''}`}
                    style={{ flexGrow: 1 }}
                >
                    <Hash size={18} color={projColor} strokeWidth={2} style={{ opacity: 0.7 }} />
                    <span style={{ fontSize: '1rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.title}</span>
                </Link>
            </div>
            {children.length > 0 && !isDragging && (
                <div style={{
                    position: 'relative',
                    marginRight: '0.75rem',
                    paddingRight: '0.75rem',
                    borderRight: '1px solid var(--border-color)',
                }}>
                    {children.map(child => {
                        const isChildActive = location.pathname === `/project/${child.id}`;
                        const childColor = child.color && child.color !== '#ffffff' ? child.color : 'var(--text-secondary)';
                        return (
                            <Link key={child.id} to={`/project/${child.id}`} onClick={() => { if (window.innerWidth <= 992) onToggle(); }} className={`nav-link project-link sidebar-menu-item ${isChildActive ? 'active' : ''}`} style={{ padding: '0.45rem 0.6rem', fontSize: '0.95rem' }}>
                                <Hash size={16} color={childColor} strokeWidth={2} style={{ opacity: 0.7 }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.title}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SortableProjectItem;
