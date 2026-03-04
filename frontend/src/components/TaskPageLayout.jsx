import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTaskItem } from './TaskComponents/index.jsx';

const TaskPageLayout = ({
    title,
    titleContent, // New slot for the large heading
    breadcrumb, // Optional breadcrumb text (e.g., "הפרויקטים שלי")
    headerActions,
    children,
    onDragStart,
    onDragOver,
    onDragEnd,
    activeDragItem,
    maxWidth = '100%',
    padding = '0',
    externalScrollTop = null,
    onScroll = null,
    alternateHeaderPadding = "1.5rem"
}) => {
    const [internalScrollTop, setInternalScrollTop] = useState(0);
    const scrollTop = externalScrollTop !== null ? externalScrollTop : internalScrollTop;
    const { isSidebarOpen } = useOutletContext() || { isSidebarOpen: false };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleScroll = (e) => {
        if (onScroll) onScroll(e.target.scrollTop);
        else setInternalScrollTop(e.target.scrollTop);
    };

    const isMobile = window.innerWidth <= 768;
    const sidePadding = isMobile ? '3.65rem' : '2.5rem';
    const hPadding = (isMobile && alternateHeaderPadding) ? alternateHeaderPadding : sidePadding;
    const topPadding = isMobile ? '60px' : '40px';
    const firstRowHeight = isMobile ? '70px' : '55px';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="page-grid" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Glassmorphism Sticky Header */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: `0.75rem ${hPadding}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: scrollTop > 30 ? 'var(--bg-color)' : 'transparent',
                    backdropFilter: scrollTop > 30 ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: scrollTop > 30 ? 'blur(10px)' : 'none',
                    borderBottom: scrollTop > 30 ? '1px solid var(--border-color)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '60px'
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
                                    fontWeight: 400,
                                    fontSize: '0.95rem',
                                    paddingRight: isMobile && !isSidebarOpen ? '30px' : '0' // Clears sidebar toggle icon on mobile
                                }}>
                                    {breadcrumb} <span style={{ opacity: 0.5 }}>/</span>
                                </div>
                            )}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                opacity: Math.min(1, Math.max(0, (scrollTop - 40) / 40)),
                                transform: `translateY(${Math.max(0, 10 - (scrollTop - 40) / 4)}px)`,
                                pointerEvents: scrollTop > 60 ? 'auto' : 'none',
                                transition: 'all 0.3s ease',
                                paddingRight: (!breadcrumb && isMobile && !isSidebarOpen) ? '30px' : '0' // Clears sidebar toggle if no breadcrumb
                            }}>
                                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{title}</h1>
                            </div>
                        </div>
                        <div>{headerActions}</div>
                    </div>
                </div>

                {/* Main Content Area (Title + Tasks/Lists) */}
                <div
                    className="page-content"
                    style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onScroll={handleScroll}
                >
                    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Row 1: Empty Row */}
                        <div style={{ height: firstRowHeight, minHeight: firstRowHeight, maxHeight: firstRowHeight, padding: `0 ${sidePadding}` }}></div>

                        {/* Row 2: Title Row */}
                        <div style={{ padding: `0 ${sidePadding} 20px` }}>
                            {titleContent}
                        </div>

                        {/* Row 3: Content Row */}
                        <div style={{ padding: `0 ${sidePadding} 100px` }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    activeDragItem.data?.type === 'Task' ? (
                        <SortableTaskItem
                            item={activeDragItem.data.item}
                            checklistId={activeDragItem.data.checklistId}
                            isCompletedFallback={false}
                            useProgressArray={false}
                            isOverlay={true}
                        />
                    ) : null
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default TaskPageLayout;
