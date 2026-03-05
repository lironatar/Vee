import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const DEFAULT_HE_LOCALE = {
    code: 'he',
    week: {
        dow: 0, // Sunday is first day
        doy: 6  // The week that contains Jan 1st is the first week of the year
    },
    buttonText: {
        prev: 'הקודם',
        next: 'הבא',
        today: 'היום',
        month: 'חודש',
        week: 'שבוע',
        day: 'יום',
        list: 'סדר יום'
    },
    weekText: 'שבוע',
    allDayText: 'כל היום',
    moreLinkText: 'נוספים',
    noEventsText: 'אין אירועים להצגה'
};

const CalendarWrapper = ({
    events,
    onDateClick,
    onEventClick,
    onEventDrop,
    onEventResize,
    onDatesSet,
    initialView = 'dayGridMonth',
    headerToolbar = {
        right: 'timeGridDay,timeGridWeek,dayGridMonth',
        center: 'title',
        left: 'prev,next today'
    },
    height = '100%',
    viewMode
}) => {
    const calendarRef = useRef(null);

    // Sync external viewMode with internal FullCalendar view if viewMode prop is provided
    useEffect(() => {
        if (viewMode && calendarRef.current) {
            const api = calendarRef.current.getApi();
            if (viewMode === 'monthly' && api.view.type !== 'dayGridMonth') {
                api.changeView('dayGridMonth');
            } else if (viewMode === 'weekly' && api.view.type !== 'timeGridWeek') {
                api.changeView('timeGridWeek');
            } else if (viewMode === 'daily' && api.view.type !== 'timeGridDay') {
                api.changeView('timeGridDay');
            }
        }
    }, [viewMode]);

    return (
        <div className="calendar-wrapper-container" style={{ height }}>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={initialView}
                locales={[DEFAULT_HE_LOCALE]}
                locale="he"
                direction="rtl"
                headerToolbar={headerToolbar}
                events={events}
                editable={true} // Enables drag-and-drop globally
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                height={height}
                navLinks={true}

                // Event Callbacks
                dateClick={onDateClick}
                eventClick={onEventClick}
                eventDrop={onEventDrop}
                eventResize={onEventResize}
                datesSet={onDatesSet}

                // Aesthetic overrides
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                scrollTime="08:00:00"
                nowIndicator={true}

                dayHeaderFormat={{ weekday: 'short', day: 'numeric', omitCommas: true }}

                // Custom event rendering for modern UI
                eventContent={(arg) => {
                    const { event, timeText, view } = arg;
                    const isCompleted = event.extendedProps.completed;

                    // All Day or Month Grid view
                    if (event.allDay || view.type === 'dayGridMonth') {
                        return (
                            <div className={`fc-custom-event-all-day ${isCompleted ? 'is-completed' : ''}`}>
                                <div style={{
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    border: `2px solid ${isCompleted ? 'var(--success-color)' : 'var(--text-secondary)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.6
                                }}>
                                    {isCompleted && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>}
                                </div>
                                <span>{event.title}</span>
                            </div>
                        );
                    }

                    // Timed view (Weekly/Daily slots)
                    return (
                        <div className={`fc-custom-event-timed ${isCompleted ? 'is-completed' : ''}`}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                <div style={{
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    border: `2px solid ${isCompleted ? 'var(--success-color)' : 'var(--primary-color)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '3px'
                                }}>
                                    {isCompleted && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                    <span className="event-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</span>
                                    {timeText && <span className="event-time">{timeText}</span>}
                                </div>
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
};

export default CalendarWrapper;
