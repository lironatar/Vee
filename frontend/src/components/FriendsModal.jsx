import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '../context/UserContext';
import { X, Users, UserPlus, Check, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = '/api';

const FriendsModal = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setIsVisible(true));
            fetchFriends();
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/friends`);
            if (res.ok) setFriends(await res.json());
        } catch (e) {
            console.error('Error fetching friends', e);
        }
    };

    const handleSearchUsers = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&excludeUserId=${user.id}`);
            if (res.ok) {
                setSearchResults(await res.json());
            }
        } catch (error) {
            console.error('Search error', error);
        }
        setIsSearching(false);
    };

    const sendFriendRequest = async (receiver_id) => {
        try {
            const res = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: user.id, receiver_id })
            });
            if (res.ok) {
                toast.success('בקשת חברות נשלחה בהצלחה!');
                fetchFriends();
                setSearchQuery('');
                setSearchResults([]);
            } else {
                toast.error('הבקשה כבר קיימת');
            }
        } catch (error) {
            toast.error('שגיאה בשליחת בקשה');
        }
    };

    const acceptFriendRequest = async (requestId) => {
        try {
            const res = await fetch(`${API_URL}/friends/accept/${requestId}`, { method: 'PUT' });
            if (res.ok) {
                toast.success('בקשת חברות אושרה!');
                fetchFriends();
            }
        } catch (error) {
            toast.error('שגיאה באישור חברות');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="sidebar-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div className={`card ${isVisible ? 'slide-up' : ''}`} style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>חברים</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon-soft" title="סגור">
                        <X size={28} />
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>
                                חפש משתמשים במערכת והוסף אותם לרשימת החברים שלך כדי לשתף איתם פרויקטים.
                            </p>
                        </div>

                        {/* Search Users */}
                        <div className="form-group" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0 1rem', transition: 'var(--transition)', position: 'relative', zIndex: 10 }}>
                                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="חפש משתמש לפי שם או דוא״ל..."
                                    value={searchQuery}
                                    onChange={handleSearchUsers}
                                    style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                                />
                                {isSearching && <span className="spinner" style={{ width: '16px', height: '16px' }}></span>}
                            </div>

                            {searchQuery && (
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                                    {searchResults.length === 0 && !isSearching && (
                                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed var(--success-color)' }}>
                                            <Mail size={32} style={{ color: 'var(--success-color)', margin: '0 auto 1rem', opacity: 0.8 }} />
                                            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>לא נמצאו משתמשים התואמים לחיפוש זה</h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                                נראה ש-<strong>{searchQuery}</strong> עדיין לא רשום למערכת. שלח לו הזמנה אישית!
                                            </p>
                                            <a
                                                href={`mailto:${searchQuery.includes('@') ? searchQuery : ''}?subject=הצטרף אלי ב-Vee&body=מוזמן להצטרף לצוות שלי במערכת!`}
                                                className="btn btn-primary"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success-color)', border: 'none' }}
                                            >
                                                <Mail size={16} /> הזמן עכשיו באמצעות אימייל
                                            </a>
                                        </div>
                                    )}

                                    {searchResults.map((sr) => (
                                        <div key={sr.id} className="fade-in slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: sr.profile_image ? `url(/api${sr.profile_image}) center/cover` : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                                    {!sr.profile_image && sr.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{sr.username}</span>
                                            </div>
                                            <button onClick={() => sendFriendRequest(sr.id)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-full)' }}>
                                                <UserPlus size={16} /> בקשת חברות
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Invites */}
                        {friends.filter(f => f.status === 'pending' && f.receiver_id === user.id).length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    בקשות חברות ממתינות
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {friends.filter(f => f.status === 'pending' && f.receiver_id === user.id).map(f => (
                                        <div key={f.request_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: f.profile_image ? `url(/api${f.profile_image}) center/cover` : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                    {!f.profile_image && f.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{f.username}</span>
                                            </div>
                                            <button onClick={() => acceptFriendRequest(f.request_id)} className="btn hover-scale" style={{ padding: '0.5rem 1rem', background: 'var(--success-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Check size={16} /> אשר חברות
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friend List */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                החברים שלי ({friends.filter(f => f.status === 'accepted').length})
                            </h3>
                            {friends.filter(f => f.status === 'accepted').length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>עדיין לא הוספת חברים. התחל לחפש למעלה!</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {friends.filter(f => f.status === 'accepted').map(f => (
                                        <div key={f.request_id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'none', border: '1px solid var(--border-color)' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: f.profile_image ? `url(/api${f.profile_image}) center/cover` : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                                {!f.profile_image && f.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{f.username}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FriendsModal;
