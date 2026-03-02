import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * DynamicTitle component manages the document.title based on the current route
 * and tab visibility. It provides an interactive and creative experience in Hebrew.
 */
const DynamicTitle = () => {
    const location = useLocation();
    const [isTabActive, setIsTabActive] = useState(true);
    const [customTitle, setCustomTitle] = useState(null);

    // Handle visibility change for interactive titles when user leaves the tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabActive(!document.hidden);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen for custom title updates from specific pages (like Project page)
    useEffect(() => {
        const handleCustomTitle = (event) => {
            if (event.detail) {
                setCustomTitle(event.detail);
            }
        };
        window.addEventListener('updatePageTitle', handleCustomTitle);
        return () => window.removeEventListener('updatePageTitle', handleCustomTitle);
    }, []);

    // Reset custom title on route change
    useEffect(() => {
        setCustomTitle(null);
    }, [location.pathname]);

    useEffect(() => {
        const path = location.pathname;
        let baseTitle = 'Vee';

        if (!isTabActive) {
            // Interactive/Creative titles when tab is blurred
            const inactiveTitles = [
                'Vee - מחכים לך! ✨',
                'Vee - חזור אלינו! 🌸',
                'Vee - המשימות מחכות... 📝',
                'Vee - געגועים! ❤️',
                'Vee - אל תשכח אותנו! 🌿',
                'Vee - זמן להיות פרודוקטיבי? 🚀'
            ];
            const randomIndex = Math.floor(Math.random() * inactiveTitles.length);
            document.title = inactiveTitles[randomIndex];
            return;
        }

        // Mapping for active titles based on route or custom title
        let pageTitle = '';

        if (customTitle) {
            pageTitle = customTitle;
        } else if (path.includes('/today')) {
            pageTitle = 'המשימות להיום ☀️';
        } else if (path.includes('/inbox')) {
            pageTitle = 'תיבת דואר 📥';
        } else if (path.includes('/projects')) {
            pageTitle = 'הפרויקטים שלי 📁';
        } else if (path.includes('/project/')) {
            pageTitle = 'פרויקט';
        } else if (path.includes('/calendar')) {
            pageTitle = 'לוח שנה 📅';
        } else if (path.includes('/history')) {
            pageTitle = 'היסטוריה ⏳';
        } else if (path.includes('/admin/users')) {
            pageTitle = 'ניהול משתמשים 👥';
        } else if (path.includes('/admin/login')) {
            pageTitle = 'כניסת מנהל 🔐';
        } else if (path.includes('/admin')) {
            pageTitle = 'לוח בקרה 🛠️';
        } else if (path.includes('/login')) {
            pageTitle = 'התחברות 👋';
        }

        document.title = pageTitle ? `${baseTitle} - ${pageTitle}` : baseTitle;
    }, [location, isTabActive, customTitle]);

    return null;
};

export default DynamicTitle;
