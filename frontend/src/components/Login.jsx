import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { BookOpen, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';

const API_URL = '/api';

export default function Login() {
    const { login } = useUser();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [identifier, setIdentifier] = useState(''); // email / phone / username
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Detect type of identifier
    const identifierType = () => {
        if (/^[^@]+@[^@]+\.[^@]+$/.test(identifier)) return 'email';
        if (/^[0-9+\-() ]{7,}$/.test(identifier.trim())) return 'phone';
        if (identifier.trim().length > 0) return 'username';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!identifier.trim()) { setError('נא להזין אימייל, טלפון או שם משתמש'); return; }
        if (!password) { setError('נא להזין סיסמה'); return; }
        setLoading(true);

        if (mode === 'register') {
            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password, display_name: displayName }),
                });
                const data = await res.json();
                if (res.ok) {
                    // Auto-login after register using UserContext
                    await login(data.user.username, data.user.email, data.user);
                } else {
                    setError(data.error || 'שגיאה בהרשמה');
                }
            } catch {
                setError('שגיאת רשת, נסה שוב');
            }
        } else {
            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password }),
                });
                const data = await res.json();
                if (res.ok) {
                    await login(data.user.username, data.user.email, data.user);
                } else {
                    setError(data.error || 'שגיאה בהתחברות');
                }
            } catch {
                setError('שגיאת רשת, נסה שוב');
            }
        }
        setLoading(false);
    };

    const idType = identifierType();
    const idPlaceholder = idType === 'email' ? '📧 אימייל' : idType === 'phone' ? '📱 טלפון' : 'אימייל, טלפון, או שם משתמש';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-color)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorations */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--primary-color) 18%, transparent), transparent)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-5%',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent)',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: '420px',
                padding: '1rem',
            }}>
                {/* Logo / Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: 'var(--primary-color)', marginBottom: '1rem',
                        boxShadow: '0 8px 32px color-mix(in srgb, var(--primary-color) 40%, transparent)',
                    }}>
                        <BookOpen size={32} color="white" />
                    </div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Vee
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {mode === 'login' ? 'ברוך הבא בחזרה 👋' : 'הצטרף למסע היומי שלך ✨'}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        borderBottom: '1px solid var(--border-color)',
                    }}>
                        {[['login', 'התחברות'], ['register', 'הרשמה']].map(([m, label]) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(''); }}
                                style={{
                                    padding: '1rem',
                                    background: mode === m ? 'var(--bg-color)' : 'transparent',
                                    border: 'none',
                                    borderBottom: mode === m ? `2px solid var(--primary-color)` : '2px solid transparent',
                                    color: mode === m ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: mode === m ? 700 : 500,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Identifier field */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.3px' }}>
                                {mode === 'register' ? 'אימייל או מספר טלפון' : 'אימייל / טלפון / שם משתמש'}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={idPlaceholder}
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                autoFocus
                                autoComplete="username"
                                dir="ltr"
                                style={{ width: '100%', fontSize: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'right' }}
                            />
                            {identifier && idType && (
                                <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--success-color)' }}>
                                    {idType === 'email' && '✓ כתובת אימייל'}
                                    {idType === 'phone' && '✓ מספר טלפון'}
                                    {idType === 'username' && '✓ שם משתמש'}
                                </div>
                            )}
                        </div>

                        {/* Display name (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                    שם תצוגה (אופציונלי)
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="השם שיופיע לאחרים"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.75rem 1rem', borderRadius: '10px' }}
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                סיסמה
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder={mode === 'register' ? 'בחר סיסמה חזקה' : 'הסיסמה שלך'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                    dir="ltr"
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.75rem 2.8rem 0.75rem 1rem', borderRadius: '10px', textAlign: 'right' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-secondary)', padding: '0.2rem', display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                background: 'color-mix(in srgb, var(--danger-color) 12%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--danger-color) 30%, transparent)',
                                borderRadius: '8px', padding: '0.6rem 0.9rem',
                                color: 'var(--danger-color)', fontSize: '0.88rem', fontWeight: 500,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                width: '100%', padding: '0.85rem',
                                fontSize: '1rem', fontWeight: 700,
                                borderRadius: '10px', marginTop: '0.25rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: loading ? 0.7 : 1,
                                transition: 'opacity 0.2s, transform 0.1s',
                            }}
                        >
                            {loading ? (
                                <span>טוען...</span>
                            ) : mode === 'login' ? (
                                <><ArrowLeft size={18} /> התחבר</>
                            ) : (
                                <><Sparkles size={18} /> צור חשבון</>
                            )}
                        </button>

                        {/* Switch mode */}
                        <p style={{ textAlign: 'center', margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            {mode === 'login' ? (
                                <>אין לך חשבון? <button type="button" onClick={() => { setMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}>הירשם עכשיו</button></>
                            ) : (
                                <>יש לך חשבון? <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}>התחבר</button></>
                            )}
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
