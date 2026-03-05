import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { AddTaskCard } from './TaskComponents/index.jsx';

const API_URL = '/api';

const GlobalAddTaskModal = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemDate, setNewItemDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [checklists, setChecklists] = useState([]);
    const [defaultChecklist, setDefaultChecklist] = useState(null);

    useEffect(() => {
        if (!isOpen || !user) return;

        // Reset state
        setNewItemContent('');
        setNewItemDate(new Date().toLocaleDateString('en-CA'));

        const fetchData = async () => {
            try {
                const checkRes = await fetch(`${API_URL}/users/${user.id}/checklists`);
                if (checkRes.ok) {
                    const cData = await checkRes.json();
                    setChecklists(cData);

                    // Set default to Inbox (first checklist with no project_id)
                    let inboxList = cData.find(c => !c.project_id);
                    if (!inboxList) {
                        inboxList = { id: 'NEW_INBOX', title: '', project_id: null };
                    }
                    setDefaultChecklist(inboxList);
                }
            } catch (error) {
                console.error('Failed to fetch lists:', error);
            }
        };
        fetchData();
    }, [isOpen, user]);

    const handleAddItem = async (e, checklistId, parentItemId, explicitContent = null) => {
        if (e) e.preventDefault();

        const content = explicitContent || window.globalNewItemContent;
        const description = window.globalNewItemDesc;
        const targetDate = window.globalNewItemDate;
        const time = window.globalNewItemTime;
        const repeatRule = window.globalNewItemRepeatRule;
        const duration = window.globalNewItemDuration;

        if (!content) return;

        let finalChecklistId = checklistId;

        // Auto-create inbox if needed
        if (finalChecklistId === 'NEW_INBOX' || !finalChecklistId) {
            try {
                const listRes = await fetch(`${API_URL}/users/${user.id}/checklists`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: '',
                        active_days: '0,1,2,3,4,5,6',
                        project_id: null
                    })
                });
                if (listRes.ok) {
                    const newList = await listRes.json();
                    finalChecklistId = newList.id;
                } else {
                    toast.error('שגיאה ביצירת תיבת המשימות');
                    return;
                }
            } catch (err) {
                console.error(err);
                toast.error('שגיאה ביצירת תיבת המשימות');
                return;
            }
        }

        try {
            const res = await fetch(`${API_URL}/checklists/${finalChecklistId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    description: description || null,
                    target_date: targetDate || null,
                    time: time || null,
                    duration: duration || 15,
                    repeat_rule: repeatRule || null,
                    parent_item_id: parentItemId || null
                })
            });

            if (res.ok) {
                toast.success('המשימה נוספה בהצלחה');
                window.dispatchEvent(new CustomEvent('refreshCalendarTasks'));
                window.dispatchEvent(new CustomEvent('refreshSidebarCounts'));
            } else {
                toast.error('שגיאה בהוספת משימה');
            }
        } catch (err) {
            console.error(err);
            toast.error('שגיאה בחיבור לשרת');
        }
    };

    if (!isOpen || !defaultChecklist) return null;

    const isMobile = window.innerWidth < 768;

    const modalStyle = {
        position: 'fixed',
        top: isMobile ? '80px' : '15vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '580px',
        zIndex: 10000,
        direction: 'rtl',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-color)',
    };
    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        backdropFilter: 'none',
        zIndex: 9999,
    };

    return createPortal(
        <>
            <div style={overlayStyle} onClick={onClose} aria-hidden="true" />
            <div className="fade-in slide-down" style={modalStyle}>
                <AddTaskCard
                    newItemContent={newItemContent}
                    setNewItemContent={setNewItemContent}
                    newItemDate={newItemDate}
                    setNewItemDate={setNewItemDate}
                    checklist={defaultChecklist}
                    setAddingToList={onClose}
                    handleAddItem={handleAddItem}
                />
            </div>
        </>,
        document.body
    );
};

export default GlobalAddTaskModal;
