import { useState } from 'react'
import './App.css'
import GestioneAttributiProxy from './GestioneAttributiProxy'

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8100'

function App() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [user, setUser] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin(event) {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.detail || 'Accesso non riuscito')
                return
            }

            setUser(data.user)
            setPassword('')
        } catch {
            setError('Backend non raggiungibile')
        } finally {
            setLoading(false)
        }
    }

    function handleGuestAccess() {
        setError('')

        setUser({
            id: null,
            username: 'Ospite',
            role: 'guest',
        })
    }

    function handleLogout() {
        setUser(null)
        setUsername('')
        setPassword('')
        setError('')
    }

    if (user) {
        return (
            <GestioneAttributiProxy
                user={user}
                onLogout={handleLogout}
            />
        )
    }

    return (
        <main className="app">
            <section className="auth-card">
                <h1>Gestione Proxy</h1>

                <p className="subtitle">
                    Accedi con il tuo nome utente
                </p>

                <form onSubmit={handleLogin}>
                    <label htmlFor="username">
                        Nome utente
                    </label>

                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Accesso in corso...' : 'Accedi'}
                    </button>
                </form>

                <div className="separator">
                    oppure
                </div>

                <button
                    className="secondary-button"
                    type="button"
                    onClick={handleGuestAccess}
                >
                    Continua come ospite
                </button>
            </section>
        </main>
    )
}

export default App