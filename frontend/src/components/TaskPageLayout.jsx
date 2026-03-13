import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from './Header';
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
    const rawScrollTop = externalScrollTop !== null ? externalScrollTop : internalScrollTop;
    const scrollTop = Math.max(0, rawScrollTop);
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
                <Header 
                    scrollTop={scrollTop}
                    hPadding={hPadding}
                    breadcrumb={breadcrumb}
                    title={title}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    headerActions={headerActions}
                />

                {/* Main Content Area (Title + Tasks/Lists) */}
                <div
                    className="page-content"
                    style={{ 
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        overscrollBehavior: 'contain',
                        marginTop: '54px', // Keeps scrollbar below the absolute header
                        height: 'calc(100vh - 54px)' // Ensures proper height for scrolling
                    }}
                    onScroll={handleScroll}
                >
                    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Removed empty first row - handled by marginTop */}

                        {/* Row 2: Title Row */}
                        <div style={{ padding: `${isMobile ? '20px' : '40px'} ${sidePadding} 20px` }}>
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
