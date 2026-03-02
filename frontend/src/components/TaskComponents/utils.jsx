import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export const API_URL = '/api';

export const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const hebrewMonthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export const repeatOptions = [
    { label: 'ללא חזרה', value: 'none' },
    { label: 'כל יום', value: 'daily' },
    { label: 'כל שבוע', value: 'weekly' },
    { label: 'כל יום חול (א׳-ה׳)', value: 'weekdays' },
    { label: 'כל חודש', value: 'monthly' },
    { label: 'כל שנה', value: 'yearly' },
];

export const repeatLabels = {
    daily: 'כל יום',
    weekly: 'שבועי',
    weekdays: 'ימי חול',
    monthly: 'חודשי',
    yearly: 'שנתי',
    custom: 'מותאם'
};

export const TIME_OPTIONS = ['ללא שעה'];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
        TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} `);
    }
}

export const getDateDisplayInfo = (targetDate) => {
    if (!targetDate) return { text: 'תאריך', color: 'var(--text-secondary)' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let text = '';
    let color = 'var(--text-secondary)';
    let isImportant = false;

    if (diffDays === 0) {
        text = 'היום';
        color = '#058527'; // Green
        isImportant = true;
    } else if (diffDays === 1) {
        text = 'מחר';
        color = '#a855f7'; // Purple
        isImportant = true;
    } else if (diffDays > 1 && diffDays < 7) {
        text = `יום ${hebrewDayNames[date.getDay()]}`;
        if (date.getDay() === 5 || date.getDay() === 6) {
            color = '#f59e0b'; // כתום/Yellow for weekend
            isImportant = true;
        }
    } else if (diffDays < 0) {
        // Overdue
        text = `${date.getDate()} ב${hebrewMonthNames[date.getMonth()]}`;
        color = '#d1453b'; // Todoist Red for overdue
        isImportant = true;
    } else {
        text = `${date.getDate()} ב${hebrewMonthNames[date.getMonth()]}`;
    }

    return { text, color, isImportant, diffDays };
};

export const renderFormattedDate = (targetDate) => {
    if (!targetDate) return null;
    const { text, color } = getDateDisplayInfo(targetDate);

    return (
        <span style={{
            color,
            fontWeight: 400,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            <CalendarIcon size={12} />
            {text}
        </span>
    );
};
