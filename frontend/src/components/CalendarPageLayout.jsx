import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import {
    DndContext,
    pointerWithin,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTaskItem } from './TaskComponents/index.jsx';

import Header from './Header';

const CalendarPageLayout = ({
    title,
    titleContent, // New slot for the large heading
    breadcrumb, // Optional breadcrumb text (e.g., "הפרויקטים שלי")
    headerActions,
    children,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    activeDragItem,
    maxWidth = '100%', // Changed default to 100% for Calendar
    padding = null, // Renamed/repurposed to allow custom side padding
    externalScrollTop = null,
    onScroll = null,
    alternateHeaderPadding = "1.5rem",
    contentPadding = null,
    onCompletedToggle = null,
    isCompletedActive = false,
    showCompletedToggle = false
}) => {
    const [internalScrollTop, setInternalScrollTop] = useState(0);
    const scrollTop = externalScrollTop !== null ? externalScrollTop : internalScrollTop;
    const { isSidebarOpen } = useOutletContext() || { isSidebarOpen: false };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleScroll = (e) => {
        if (onScroll) onScroll(e.target.scrollTop);
        else setInternalScrollTop(e.target.scrollTop);
    };

    const isMobile = window.innerWidth <= 768;
    const sidePadding = padding !== null ? padding : (isMobile ? '3.65rem' : '2.5rem');
    const hPadding = (isMobile && alternateHeaderPadding) ? alternateHeaderPadding : sidePadding;
    const firstRowHeight = isMobile ? '70px' : '55px';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
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
                    onCompletedToggle={onCompletedToggle}
                    isCompletedActive={isCompletedActive}
                    showCompletedToggle={showCompletedToggle}
                />


                {/* Main Content Area (Title + Tasks/Lists) */}
                <div
                    className="page-content"
                    style={{ flexGrow: 1, overflowY: activeDragItem ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onScroll={handleScroll}
                >
                    <div style={{ width: '100%', maxWidth: maxWidth, margin: '0 auto' }}>
                        {/* Row 1: Empty Row */}
                        <div style={{ height: firstRowHeight, minHeight: firstRowHeight, maxHeight: firstRowHeight, padding: `0 ${sidePadding}` }}></div>

                        {/* Row 2: Title Row */}
                        <div style={{ padding: `0 ${sidePadding} 20px` }}>
                            {titleContent}
                        </div>

                        {/* Row 3: Content Row */}
                        <div style={{ padding: contentPadding || `0 ${sidePadding} 100px` }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={dropAnimation} zIndex={9999}>
                {activeDragItem && activeDragItem.data?.current?.type === 'Task' ? (
                    <div style={{ opacity: 1, cursor: 'grabbing', width: activeDragItem.rect?.current?.initial?.width || 'auto' }}>
                        <SortableTaskItem
                            item={activeDragItem.data.current.item}
                            checklistId={activeDragItem.data.current.checklistId}
                            isCompletedFallback={false}
                            useProgressArray={false}
                            isOverlay={true}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default CalendarPageLayout;
