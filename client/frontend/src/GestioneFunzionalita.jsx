import { useEffect, useState } from 'react'
import './GestioneFunzionalita.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8100'

function getErrorMessage(data) {
    if (typeof data?.detail === 'string') {
        return data.detail
    }

    if (Array.isArray(data?.detail)) {
        return data.detail.map((error) => error.msg).join(', ')
    }

    return 'Si è verificato un errore'
}

function GestioneFunzionalita({
    proxy,
    user,
    onBack,
    onLogout,
    onInfo,
}) {
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // 1. Stato per Servizio Squid Standard
    const [squidState, setSquidState] = useState('checking')
    const [squidMessage, setSquidMessage] = useState('Verifica dello stato di Squid...')
    const [squidAction, setSquidAction] = useState(null)

    // 2. Stato per Modalità Squid Moodle
    const [moodleState, setMoodleState] = useState('checking')
    const [moodleMessage, setMoodleMessage] = useState('Verifica dello stato di Moodle...')
    const [moodleAction, setMoodleAction] = useState(null)

    // 3. Stato per Modalità Cisco
    const [ciscoState, setCiscoState] = useState('checking')
    const [ciscoMessage, setCiscoMessage] = useState('Verifica dello stato di Cisco...')
    const [ciscoAction, setCiscoAction] = useState(null)

    const canManage = ['admin', 'docente'].includes(user.role)

    // Flag di caricamento/azione in corso
    const isBusy = squidAction !== null || moodleAction !== null || ciscoAction !== null

    useEffect(() => {
        if (!proxy?.id) {
            return
        }

        let cancelled = false

        // Caricamento Stato Squid
        async function loadInitialSquidStatus() {
            try {
                const response = await fetch(
                    `${API_URL}/api/funzionalita/proxy/${proxy.id}/squid/stato`,
                    { method: 'POST' },
                )
                const data = await response.json()
                if (cancelled) return

                if (!response.ok) {
                    setSquidState('error')
                    setSquidMessage(getErrorMessage(data))
                    return
                }

                setSquidState(data.active ? 'active' : 'inactive')
                setSquidMessage(data.message || (data.active ? 'Squid attivo' : 'Squid non attivo'))
            } catch {
                if (!cancelled) {
                    setSquidState('error')
                    setSquidMessage('Backend non raggiungibile')
                }
            }
        }

        // Caricamento Stato Moodle
        async function loadInitialMoodleStatus() {
            try {
                const response = await fetch(
                    `${API_URL}/api/funzionalita/proxy/${proxy.id}/squid-moodle/stato`,
                    { method: 'POST' },
                )
                const data = await response.json()
                if (cancelled) return

                if (!response.ok) {
                    setMoodleState('error')
                    setMoodleMessage(getErrorMessage(data))
                    return
                }

                setMoodleState(data.active ? 'active' : 'inactive')
                setMoodleMessage(
                    data.message || (data.active ? 'Modalità Moodle attiva' : 'Modalità Moodle non attiva'),
                )
            } catch {
                if (!cancelled) {
                    setMoodleState('error')
                    setMoodleMessage('Backend non raggiungibile')
                }
            }
        }

        // Caricamento Stato Cisco
        async function loadInitialCiscoStatus() {
            try {
                const response = await fetch(
                    `${API_URL}/api/funzionalita/proxy/${proxy.id}/cisco/stato`,
                    { method: 'POST' },
                )
                const data = await response.json()
                if (cancelled) return

                if (!response.ok) {
                    setCiscoState('error')
                    setCiscoMessage(getErrorMessage(data))
                    return
                }

                setCiscoState(data.active ? 'active' : 'inactive')
                setCiscoMessage(
                    data.message || (data.active ? 'Modalità Cisco attiva' : 'Modalità Cisco non attiva'),
                )
            } catch {
                if (!cancelled) {
                    setCiscoState('error')
                    setCiscoMessage('Backend non raggiungibile')
                }
            }
        }

        loadInitialSquidStatus()
        loadInitialMoodleStatus()
        loadInitialCiscoStatus()

        return () => {
            cancelled = true
        }
    }, [proxy?.id])

    useEffect(() => {
        if (!success) {
            return
        }

        const timer = window.setTimeout(() => {
            setSuccess('')
        }, 3000)

        return () => window.clearTimeout(timer)
    }, [success])

    // Gestore Azioni Squid Standard
    async function handleSquidAction(action) {
        if (isBusy || (action !== 'stato' && !canManage)) return

        setSquidAction(action)
        setSquidMessage(
            action === 'stato'
                ? 'Verifica dello stato di Squid...'
                : action === 'avvia'
                    ? 'Avvio di Squid in corso...'
                    : 'Arresto di Squid in corso...',
        )

        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/proxy/${proxy.id}/squid/${action}`,
                { method: 'POST' },
            )
            const data = await response.json()

            if (!response.ok) {
                setSquidState('error')
                setSquidMessage(getErrorMessage(data))
                return
            }

            setSquidState(data.active ? 'active' : 'inactive')
            setSquidMessage(data.message || (data.active ? 'Squid attivo' : 'Squid non attivo'))
        } catch {
            setSquidState('error')
            setSquidMessage('Backend non raggiungibile')
        } finally {
            setSquidAction(null)
        }
    }

    // Gestore Azioni Moodle
    async function handleMoodleAction(action) {
        if (isBusy || (action !== 'stato' && !canManage)) return

        setMoodleAction(action)
        setMoodleMessage(
            action === 'stato'
                ? 'Verifica dello stato di Moodle...'
                : action === 'avvia'
                    ? 'Avvio di Moodle in corso...'
                    : 'Arresto di Moodle in corso...',
        )

        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/proxy/${proxy.id}/squid-moodle/${action}`,
                { method: 'POST' },
            )
            const data = await response.json()

            if (!response.ok) {
                setMoodleState('error')
                setMoodleMessage(getErrorMessage(data))
                return
            }

            setMoodleState(data.active ? 'active' : 'inactive')
            setMoodleMessage(
                data.message || (data.active ? 'Modalità Moodle attiva' : 'Modalità Moodle non attiva'),
            )
        } catch {
            setMoodleState('error')
            setMoodleMessage('Backend non raggiungibile')
        } finally {
            setMoodleAction(null)
        }
    }

    // Gestore Azioni Cisco
    async function handleCiscoAction(action) {
        if (isBusy || (action !== 'stato' && !canManage)) return

        setCiscoAction(action)
        setCiscoMessage(
            action === 'stato'
                ? 'Verifica dello stato di Cisco...'
                : action === 'avvia'
                    ? 'Avvio di Cisco in corso...'
                    : 'Arresto di Cisco in corso...',
        )

        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/proxy/${proxy.id}/cisco/${action}`,
                { method: 'POST' },
            )
            const data = await response.json()

            if (!response.ok) {
                setCiscoState('error')
                setCiscoMessage(getErrorMessage(data))
                return
            }

            setCiscoState(data.active ? 'active' : 'inactive')
            setCiscoMessage(
                data.message || (data.active ? 'Modalità Cisco attiva' : 'Modalità Cisco non attiva'),
            )
        } catch {
            setCiscoState('error')
            setCiscoMessage('Backend non raggiungibile')
        } finally {
            setCiscoAction(null)
        }
    }

    if (!proxy) {
        return (
            <main className="features-page">
                <section className="features-empty">
                    <h1>Nessun proxy selezionato</h1>
                    <p>Seleziona un proxy dalla pagina precedente.</p>
                    <button className="features-button secondary" type="button" onClick={onBack}>
                        Torna ai proxy
                    </button>
                </section>
            </main>
        )
    }

    return (
        <main className="features-page">
            <header className="features-header">
                <div>
                    <p className="features-eyebrow">Gestione Proxy</p>
                    <h1>Gestione funzionalità</h1>
                </div>

                <div className="features-header-actions">
                    <p className="features-user">
                        Utente: <strong>{user.username}</strong>
                        <span>•</span>
                        Ruolo: <strong>{user.role}</strong>
                    </p>
                    <button className="features-button secondary compact" type="button" onClick={onInfo}>
                        Info
                    </button>
                    <button className="features-button secondary compact" type="button" onClick={onLogout}>
                        Esci
                    </button>
                </div>
            </header>

            <section className="features-proxy-section">
                <div className="features-section-header">
                    <div>
                        <p className="features-section-label">Proxy selezionato</p>
                        <h2>{proxy.codiceProxy}</h2>
                    </div>
                    <button className="features-button secondary compact" type="button" onClick={onBack}>
                        ← Torna ai proxy
                    </button>
                </div>

                <article className="features-proxy-card">
                    <div><span>Codice proxy</span><strong>{proxy.codiceProxy}</strong></div>
                    <div><span>Descrizione</span><strong>{proxy.descrizione}</strong></div>
                    <div><span>Indirizzo IP</span><strong>{proxy.indirizzoIP}</strong></div>
                    <div><span>Subnet mask</span><strong>{proxy.subnetMask}</strong></div>
                </article>
            </section>

            <section className="features-functions-section">
                <div className="features-functions-header">
                    <div>
                        <h2>Funzionalità disponibili</h2>
                        <p>Funzionalità applicabili al proxy selezionato.</p>
                    </div>
                </div>

                {error && <p className="features-message error">{error}</p>}
                {success && <p className="features-message success">{success}</p>}

                {/* 1. SQUID PROXY SERVER */}
                <article className={`features-squid-row ${squidState}`}>
                    <div className="features-squid-main">
                        <div>
                            <span className="features-squid-label">Servizio Squid</span>
                            <strong>Squid Proxy Server</strong>
                        </div>
                        <p className="features-squid-status">{squidMessage}</p>
                    </div>
                    <div className="features-squid-actions">
                        <button
                            className="features-button squid-status-button"
                            type="button"
                            onClick={() => handleSquidAction('stato')}
                            disabled={isBusy}
                        >
                            {squidAction === 'stato' ? 'Controllo...' : 'Stato'}
                        </button>
                        <button
                            className="features-button squid-stop-button"
                            type="button"
                            onClick={() => handleSquidAction('stop')}
                            disabled={!canManage || isBusy}
                        >
                            {squidAction === 'stop' ? 'Stop...' : 'Stop'}
                        </button>
                        <button
                            className="features-button squid-start-button"
                            type="button"
                            onClick={() => handleSquidAction('avvia')}
                            disabled={!canManage || isBusy}
                        >
                            {squidAction === 'avvia' ? 'Avvio...' : 'Avvia'}
                        </button>
                    </div>
                </article>

                {/* 2. MODALITÀ SQUID MOODLE */}
                <article className={`features-squid-row ${moodleState}`}>
                    <div className="features-squid-main">
                        <div>
                            <span className="features-squid-label">Servizio Squid</span>
                            <strong>Modalità Squid Moodle</strong>
                        </div>
                        <p className="features-squid-status">{moodleMessage}</p>
                    </div>
                    <div className="features-squid-actions">
                        <button
                            className="features-button squid-status-button"
                            type="button"
                            onClick={() => handleMoodleAction('stato')}
                            disabled={isBusy}
                        >
                            {moodleAction === 'stato' ? 'Controllo...' : 'Stato'}
                        </button>
                        <button
                            className="features-button squid-stop-button"
                            type="button"
                            onClick={() => handleMoodleAction('stop')}
                            disabled={!canManage || isBusy}
                        >
                            {moodleAction === 'stop' ? 'Stop...' : 'Stop'}
                        </button>
                        <button
                            className="features-button squid-start-button"
                            type="button"
                            onClick={() => handleMoodleAction('avvia')}
                            disabled={!canManage || isBusy}
                        >
                            {moodleAction === 'avvia' ? 'Avvio...' : 'Avvia'}
                        </button>
                    </div>
                </article>

                {/* 3. MODALITÀ CISCO */}
                <article className={`features-squid-row ${ciscoState}`}>
                    <div className="features-squid-main">
                        <div>
                            <span className="features-squid-label">Servizio Cisco</span>
                            <strong>Modalità Cisco</strong>
                        </div>
                        <p className="features-squid-status">{ciscoMessage}</p>
                    </div>
                    <div className="features-squid-actions">
                        <button
                            className="features-button squid-status-button"
                            type="button"
                            onClick={() => handleCiscoAction('stato')}
                            disabled={isBusy}
                        >
                            {ciscoAction === 'stato' ? 'Controllo...' : 'Stato'}
                        </button>
                        <button
                            className="features-button squid-stop-button"
                            type="button"
                            onClick={() => handleCiscoAction('stop')}
                            disabled={!canManage || isBusy}
                        >
                            {ciscoAction === 'stop' ? 'Stop...' : 'Stop'}
                        </button>
                        <button
                            className="features-button squid-start-button"
                            type="button"
                            onClick={() => handleCiscoAction('avvia')}
                            disabled={!canManage || isBusy}
                        >
                            {ciscoAction === 'avvia' ? 'Avvio...' : 'Avvia'}
                        </button>
                    </div>
                </article>

                {!canManage && (
                    <p className="features-read-only">
                        Modalità sola lettura: il ruolo ospite può controllare lo stato dei servizi, ma non può avviare o fermare le funzionalità.
                    </p>
                )}
            </section>
        </main>
    )
}

export default GestioneFunzionalita