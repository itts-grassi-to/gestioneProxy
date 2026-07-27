import { useEffect, useRef, useState } from 'react'
import './GestioneAttributiProxy.css'

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8100'

const initialForm = {
    codiceProxy: '',
    descrizione: '',
    indirizzoIP: '',
    subnetMask: '',
}

function getErrorMessage(data) {
    if (typeof data?.detail === 'string') {
        return data.detail
    }

    if (Array.isArray(data?.detail)) {
        return data.detail
            .map((error) => error.msg)
            .join(', ')
    }

    return 'Si è verificato un errore'
}

function cleanValidationMessage(message) {
    return (message || 'Valore non valido')
        .replace(/^Value error,\s*/i, '')
}

function parseFormErrors(data) {
    const fieldErrors = {}
    let generalError = ''

    if (Array.isArray(data?.detail)) {
        data.detail.forEach((error) => {
            const field = error.loc?.at(-1)
            const message = cleanValidationMessage(error.msg)

            if (
                field &&
                Object.prototype.hasOwnProperty.call(
                    initialForm,
                    field,
                )
            ) {
                fieldErrors[field] = message
            } else if (!generalError) {
                generalError = message
            }
        })
    } else if (typeof data?.detail === 'string') {
        const message = data.detail

        if (message.toLowerCase().includes('codice')) {
            fieldErrors.codiceProxy = message
        } else {
            generalError = message
        }
    } else {
        generalError = 'Controlla i dati inseriti'
    }

    return {
        fieldErrors,
        generalError,
    }
}


function GestioneAttributiProxy({user, onLogout, onGoToFunctions,}) {
    const [proxies, setProxies] = useState([])
    const [formData, setFormData] = useState(initialForm)
    const [editingId, setEditingId] = useState(null)

    const [formOpen, setFormOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const [openMenuId, setOpenMenuId] = useState(null)

    const formSectionRef = useRef(null)

    const canManage = ['admin', 'docente'].includes(user.role)

    function isDuplicateProxyCode() {
        const codiceInserito = formData.codiceProxy
            .trim()
            .toLowerCase()

        return proxies.some((proxy) => (
            proxy.id !== editingId &&
            proxy.codiceProxy.trim().toLowerCase() === codiceInserito
        ))
    }

    useEffect(() => {
        loadProxies()
    }, [])

    useEffect(() => {
        if (!success) {
            return
        }

        const timer = window.setTimeout(() => {
            setSuccess('')
        }, 3000)

        return () => window.clearTimeout(timer)
    }, [success])

    async function loadProxies() {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_URL}/api/proxy`)
            const data = await response.json()

            if (!response.ok) {
                setError(getErrorMessage(data))
                return
            }

            setProxies(data)
        } catch {
            setError('Backend non raggiungibile')
        } finally {
            setLoading(false)
        }
    }

    function toggleProxyMenu(proxyId) {
        setOpenMenuId((currentId) =>
            currentId === proxyId ? null : proxyId,
        )
    }

    function scrollToForm() {
        window.setTimeout(() => {
            formSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }, 0)
    }

    function handleInputChange(event) {
        const { name, value } = event.target

        setFormData((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))

        setFieldErrors((currentErrors) => {
            if (!currentErrors[name]) {
                return currentErrors
            }

            const updatedErrors = {
                ...currentErrors,
            }

            delete updatedErrors[name]

            return updatedErrors
        })

        setFormError('')
    }

    function clearFormErrors() {
        setFormError('')
        setFieldErrors({})
    }

    function openCreateForm() {
        setEditingId(null)
        setFormData(initialForm)
        setError('')
        setSuccess('')
        clearFormErrors()
        setFormOpen(true)
        scrollToForm()
    }

    function closeForm() {
        setEditingId(null)
        setFormData(initialForm)
        setError('')
        clearFormErrors()
        setFormOpen(false)
    }

    function toggleForm() {
        if (formOpen) {
            closeForm()
            return
        }

        openCreateForm()
    }

    function handleEdit(proxy) {
        setOpenMenuId(null)
        setEditingId(proxy.id)

        setFormData({
            codiceProxy: proxy.codiceProxy,
            descrizione: proxy.descrizione,
            indirizzoIP: proxy.indirizzoIP,
            subnetMask: proxy.subnetMask,
        })

        setError('')
        setSuccess('')
        clearFormErrors()
        setFormOpen(true)
        scrollToForm()
    }

    function handleGoToFunctions(proxy) {
        setOpenMenuId(null)
        onGoToFunctions(proxy)
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!canManage) {
            return
        }

        setSaving(true)
        setError('')
        setSuccess('')
        clearFormErrors()

        const localFieldErrors = {}

        if (isDuplicateProxyCode()) {
            localFieldErrors.codiceProxy =
                'Esiste già un proxy con questo codice'
        }

        setFieldErrors(localFieldErrors)

        const isEditing = editingId !== null

        const endpoint = isEditing
            ? `${API_URL}/api/proxy/${editingId}`
            : `${API_URL}/api/proxy`

        const method = isEditing ? 'PUT' : 'POST'

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                const validation = parseFormErrors(data)

                setFieldErrors({
                    ...localFieldErrors,
                    ...validation.fieldErrors,
                })

                setFormError(validation.generalError)
                return
            }

            setSuccess(
                isEditing
                    ? 'Proxy modificato correttamente'
                    : 'Proxy creato correttamente',
            )

            setEditingId(null)
            setFormData(initialForm)
            setFormOpen(false)

            await loadProxies()
        } catch {
            setFormError('Backend non raggiungibile')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(proxy) {
        if (!canManage) {
            return
        }

        setOpenMenuId(null)

        const confirmed = window.confirm(
            `Vuoi eliminare il proxy "${proxy.codiceProxy}"?`,
        )

        if (!confirmed) {
            return
        }

        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/proxy/${proxy.id}`,
                {
                    method: 'DELETE',
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setError(getErrorMessage(data))
                return
            }

            if (editingId === proxy.id) {
                closeForm()
            }

            setSuccess('Proxy eliminato correttamente')
            await loadProxies()
        } catch {
            setError('Backend non raggiungibile')
        }
    }

    return (
        <main className="proxy-page">
            <header className="proxy-header">
                <div>
                    <p className="proxy-eyebrow">
                        Gestione Proxy
                    </p>

                    <h1>Attributi dei proxy</h1>
                </div>

                <div className="proxy-header-actions">
                    <p className="proxy-user">
                        Utente: <strong>{user.username}</strong>
                        <span>•</span>
                        Ruolo: <strong>{user.role}</strong>
                    </p>

                    <button
                        className="proxy-button secondary compact"
                        type="button"
                        onClick={onLogout}
                    >
                        Esci
                    </button>
                </div>
            </header>

            <section className="proxy-list-section">
                <div className="proxy-section-title">
                    <div>
                        <h2>Proxy memorizzati</h2>

                        <p>
                            Elenco dei proxy presenti nel database.
                        </p>
                    </div>

                    <button
                        className="proxy-button secondary compact"
                        type="button"
                        onClick={loadProxies}
                        disabled={loading}
                    >
                        ↻ Aggiorna
                    </button>
                </div>

                {error && (
                    <p className="proxy-message error">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="proxy-message success">
                        {success}
                    </p>
                )}

                {loading && (
                    <div className="proxy-empty">
                        <p>Caricamento dei proxy...</p>
                    </div>
                )}

                {!loading && proxies.length === 0 && (
                    <div className="proxy-empty">
                        <h3>Nessun proxy memorizzato</h3>

                        <p>
                            Non è ancora stato inserito alcun proxy.
                        </p>

                        {canManage && (
                            <button
                                className="proxy-button primary"
                                type="button"
                                onClick={openCreateForm}
                            >
                                + Crea il primo proxy
                            </button>
                        )}
                    </div>
                )}

                {!loading && proxies.length > 0 && (
                    <div className="proxy-grid">
                        {proxies.map((proxy) => (
                            <article
                                className="proxy-card"
                                key={proxy.id}
                            >
                                <div className="proxy-card-top">
                                    <div>
            <span className="proxy-code">
                {proxy.codiceProxy}
            </span>

                                        <h3>{proxy.descrizione}</h3>
                                    </div>

                                    {canManage && (
                                        <div className="proxy-menu-wrapper">
                                            <button
                                                className="proxy-menu-button"
                                                type="button"
                                                aria-label={`Azioni per ${proxy.codiceProxy}`}
                                                aria-expanded={openMenuId === proxy.id}
                                                onClick={() => toggleProxyMenu(proxy.id)}
                                            >
                                                ⋮
                                            </button>

                                            {openMenuId === proxy.id && (
                                                <div className="proxy-menu">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGoToFunctions(proxy)}
                                                    >
                                                        Vai a
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(proxy)}
                                                    >
                                                        Modifica
                                                    </button>

                                                    <button
                                                        className="proxy-menu-delete"
                                                        type="button"
                                                        onClick={() => handleDelete(proxy)}
                                                    >
                                                        Elimina
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <dl className="proxy-details">
                                    <div>
                                        <dt>Indirizzo IP</dt>
                                        <dd>{proxy.indirizzoIP}</dd>
                                    </div>

                                    <div>
                                        <dt>Subnet mask</dt>
                                        <dd>{proxy.subnetMask}</dd>
                                    </div>
                                </dl>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {canManage && (
                <section
                    id="proxy-editor"
                    ref={formSectionRef}
                    className={`proxy-form-card ${formOpen ? 'open' : ''}`}
                >
                    <button
                        className="proxy-accordion-toggle"
                        type="button"
                        onClick={toggleForm}
                        aria-expanded={formOpen}
                    >
                        <span className="proxy-create-icon">
                            {formOpen ? '−' : '+'}
                        </span>

                        <span>
                            <strong>
                                {editingId
                                    ? 'Modifica proxy'
                                    : 'Crea un nuovo proxy'}
                            </strong>

                            <small>
                                {editingId
                                    ? 'Modifica gli attributi del proxy selezionato'
                                    : 'Compila i campi per inserire un nuovo proxy'}
                            </small>
                        </span>

                        <span aria-hidden="true">
                            {formOpen ? '⌃' : '⌄'}
                        </span>
                    </button>

                    {formOpen && (
                        <form
                            className="proxy-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="proxy-field">
                                <label htmlFor="codiceProxy">
                                    Codice proxy
                                </label>

                                <input
                                    id="codiceProxy"
                                    name="codiceProxy"
                                    type="text"
                                    value={formData.codiceProxy}
                                    onChange={handleInputChange}
                                    placeholder="Es. LAB3"
                                    maxLength={50}
                                    className={
                                        fieldErrors.codiceProxy
                                            ? 'proxy-input-error'
                                            : ''
                                    }
                                    aria-invalid={Boolean(fieldErrors.codiceProxy)}
                                    required
                                />

                                {fieldErrors.codiceProxy && (
                                    <small className="proxy-field-error">
                                        {fieldErrors.codiceProxy}
                                    </small>
                                )}
                            </div>

                            <div className="proxy-field">
                                <label htmlFor="descrizione">
                                    Descrizione
                                    <span className="character-counter">
                                        {formData.descrizione.length}/60
                                    </span>
                                </label>

                                <input
                                    id="descrizione"
                                    name="descrizione"
                                    type="text"
                                    value={formData.descrizione}
                                    onChange={handleInputChange}
                                    placeholder="Es. Proxy laboratorio informatico"
                                    maxLength={60}
                                    required
                                />
                            </div>

                            <div className="proxy-field">
                                <label htmlFor="indirizzoIP">
                                    Indirizzo IP
                                </label>

                                <input
                                    id="indirizzoIP"
                                    name="indirizzoIP"
                                    type="text"
                                    value={formData.indirizzoIP}
                                    onChange={handleInputChange}
                                    placeholder="Es. 192.168.1.20"
                                    maxLength={15}
                                    className={
                                        fieldErrors.indirizzoIP
                                            ? 'proxy-input-error'
                                            : ''
                                    }
                                    aria-invalid={Boolean(fieldErrors.indirizzoIP)}
                                    required
                                />

                                {fieldErrors.indirizzoIP && (
                                    <small className="proxy-field-error">
                                        {fieldErrors.indirizzoIP}
                                    </small>
                                )}
                            </div>

                            <div className="proxy-field">
                                <label htmlFor="subnetMask">
                                    Subnet mask
                                </label>

                                <input
                                    id="subnetMask"
                                    name="subnetMask"
                                    type="text"
                                    value={formData.subnetMask}
                                    onChange={handleInputChange}
                                    placeholder="Es. 255.255.255.0"
                                    maxLength={15}
                                    className={
                                        fieldErrors.subnetMask
                                            ? 'proxy-input-error'
                                            : ''
                                    }
                                    aria-invalid={Boolean(fieldErrors.subnetMask)}
                                    required
                                />

                                {fieldErrors.subnetMask && (
                                    <small className="proxy-field-error">
                                        {fieldErrors.subnetMask}
                                    </small>
                                )}
                            </div>

                            <div className="proxy-form-actions">
                                <button
                                    className="proxy-button secondary"
                                    type="button"
                                    onClick={closeForm}
                                >
                                    Annulla
                                </button>

                                <button
                                    className="proxy-button primary"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Salvataggio...'
                                        : editingId
                                            ? 'Salva modifiche'
                                            : 'Salva proxy'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}
        </main>
    )
}

export default GestioneAttributiProxy