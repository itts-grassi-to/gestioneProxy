import { useEffect, useState } from 'react'
import './GestioneFunzionalita.css'

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8100'

const EMPTY_FORM = {
    codice: '',
    descrizione: '',
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

function sortFunctionalities(functionalities) {
    return [...functionalities].sort((first, second) =>
        first.codice.localeCompare(second.codice),
    )
}

function GestioneFunzionalita({
                                  proxy,
                                  user,
                                  onBack,
                                  onLogout,
                              }) {
    const [functionalities, setFunctionalities] = useState([])
    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [startingId, setStartingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [functionStates, setFunctionStates] = useState({})

    const [createFormOpen, setCreateFormOpen] = useState(false)
    const [createForm, setCreateForm] = useState(EMPTY_FORM)
    const [createError, setCreateError] = useState('')
    const [creating, setCreating] = useState(false)

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState(EMPTY_FORM)
    const [editError, setEditError] = useState('')
    const [saving, setSaving] = useState(false)

    const [squidState, setSquidState] = useState('checking')
    const [squidMessage, setSquidMessage] = useState(
        'Verifica dello stato di Squid...',
    )
    const [squidAction, setSquidAction] = useState(null)

    const canManage = ['admin', 'docente'].includes(user.role)

    const hasOpenForm =
        createFormOpen || editingId !== null

    const isBusy =
        startingId !== null ||
        deletingId !== null ||
        creating ||
        saving ||
        squidAction !== null

    useEffect(() => {
        loadFunctionalities()
    }, [])

    useEffect(() => {
        if (!proxy?.id) {
            return
        }

        let cancelled = false

        async function loadInitialSquidStatus() {
            try {
                const response = await fetch(
                    `${API_URL}/api/funzionalita/proxy/${proxy.id}/squid/stato`,
                    {
                        method: 'POST',
                    },
                )

                const data = await response.json()

                if (cancelled) {
                    return
                }

                if (!response.ok) {
                    setSquidState('error')
                    setSquidMessage(getErrorMessage(data))
                    return
                }

                setSquidState(
                    data.active ? 'active' : 'inactive',
                )

                setSquidMessage(
                    data.message ||
                    (
                        data.active
                            ? 'Squid attivo'
                            : 'Squid non attivo'
                    ),
                )
            } catch {
                if (!cancelled) {
                    setSquidState('error')
                    setSquidMessage(
                        'Backend non raggiungibile',
                    )
                }
            }
        }

        loadInitialSquidStatus()

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

    async function loadFunctionalities() {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita`,
            )

            const data = await response.json()

            if (!response.ok) {
                setError(getErrorMessage(data))
                return
            }

            setFunctionalities(data)
        } catch {
            setError('Backend non raggiungibile')
        } finally {
            setLoading(false)
        }
    }

    async function handleSquidAction(action) {
        if (isBusy || hasOpenForm) {
            return
        }

        if (
            action !== 'stato' &&
            !canManage
        ) {
            return
        }

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
                {
                    method: 'POST',
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setSquidState('error')
                setSquidMessage(
                    getErrorMessage(data),
                )
                return
            }

            setSquidState(
                data.active ? 'active' : 'inactive',
            )

            setSquidMessage(
                data.message ||
                (
                    data.active
                        ? 'Squid attivo'
                        : 'Squid non attivo'
                ),
            )
        } catch {
            setSquidState('error')
            setSquidMessage(
                'Backend non raggiungibile',
            )
        } finally {
            setSquidAction(null)
        }
    }

    function openCreateForm() {
        if (isBusy || hasOpenForm) {
            return
        }

        setCreateFormOpen(true)
        setCreateForm(EMPTY_FORM)
        setCreateError('')
        setError('')
        setSuccess('')
    }

    function closeCreateForm() {
        if (creating) {
            return
        }

        setCreateFormOpen(false)
        setCreateForm(EMPTY_FORM)
        setCreateError('')
    }

    function handleCreateChange(event) {
        const { name, value } = event.target

        setCreateForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))

        setCreateError('')
    }

    async function handleCreate() {
        const codice = createForm.codice.trim()
        const descrizione = createForm.descrizione.trim()

        if (!codice || !descrizione) {
            setCreateError(
                'Codice e descrizione sono obbligatori',
            )
            return
        }

        setCreating(true)
        setCreateError('')
        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        codice,
                        descrizione,
                    }),
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setCreateError(
                    getErrorMessage(data),
                )
                return
            }

            setFunctionalities(
                (currentFunctionalities) =>
                    sortFunctionalities([
                        ...currentFunctionalities,
                        data,
                    ]),
            )

            setCreateFormOpen(false)
            setCreateForm(EMPTY_FORM)
            setCreateError('')

            setSuccess(
                'Funzionalità creata correttamente',
            )
        } catch {
            setCreateError(
                'Backend non raggiungibile',
            )
        } finally {
            setCreating(false)
        }
    }

    async function handleToggle(functionality) {
        if (hasOpenForm || isBusy) {
            return
        }

        const currentState =
            functionStates[functionality.id]

        if (currentState?.active) {
            setFunctionStates((currentStates) => ({
                ...currentStates,
                [functionality.id]: {
                    active: false,
                    message: '',
                    error: '',
                },
            }))

            setError('')

            setSuccess(
                `Funzionalità "${functionality.codice}" disattivata`,
            )

            return
        }

        setStartingId(functionality.id)
        setError('')
        setSuccess('')

        setFunctionStates((currentStates) => ({
            ...currentStates,
            [functionality.id]: {
                active: false,
                message: '',
                error: '',
            },
        }))

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/${functionality.id}` +
                `/proxy/${proxy.id}/avvia`,
                {
                    method: 'POST',
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setFunctionStates(
                    (currentStates) => ({
                        ...currentStates,
                        [functionality.id]: {
                            active: false,
                            message: '',
                            error: getErrorMessage(data),
                        },
                    }),
                )

                return
            }

            setFunctionStates((currentStates) => ({
                ...currentStates,
                [functionality.id]: {
                    active: true,
                    message: data.message || 'OK',
                    error: '',
                },
            }))

            setSuccess(
                `Funzionalità "${functionality.codice}" attivata`,
            )
        } catch {
            setFunctionStates(
                (currentStates) => ({
                    ...currentStates,
                    [functionality.id]: {
                        active: false,
                        message: '',
                        error: 'Backend non raggiungibile',
                    },
                }),
            )
        } finally {
            setStartingId(null)
        }
    }

    function openEditForm(functionality) {
        if (isBusy || hasOpenForm) {
            return
        }

        setEditingId(functionality.id)

        setEditForm({
            codice: functionality.codice,
            descrizione: functionality.descrizione,
        })

        setEditError('')
        setError('')
        setSuccess('')
    }

    function closeEditForm() {
        if (saving) {
            return
        }

        setEditingId(null)
        setEditForm(EMPTY_FORM)
        setEditError('')
    }

    function handleEditChange(event) {
        const { name, value } = event.target

        setEditForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }))

        setEditError('')
    }

    async function handleSave(functionalityId) {
        const codice = editForm.codice.trim()
        const descrizione = editForm.descrizione.trim()

        if (!codice || !descrizione) {
            setEditError(
                'Codice e descrizione sono obbligatori',
            )
            return
        }

        setSaving(true)
        setEditError('')
        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/${functionalityId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        codice,
                        descrizione,
                    }),
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setEditError(
                    getErrorMessage(data),
                )
                return
            }

            setFunctionalities(
                (currentFunctionalities) =>
                    sortFunctionalities(
                        currentFunctionalities.map(
                            (functionality) =>
                                functionality.id === functionalityId
                                    ? data
                                    : functionality,
                        ),
                    ),
            )

            setFunctionStates((currentStates) => ({
                ...currentStates,
                [functionalityId]: {
                    active: false,
                    message: '',
                    error: '',
                },
            }))

            setEditingId(null)
            setEditForm(EMPTY_FORM)
            setEditError('')

            setSuccess(
                'Funzionalità modificata correttamente',
            )
        } catch {
            setEditError(
                'Backend non raggiungibile',
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(functionality) {
        if (isBusy || hasOpenForm) {
            return
        }

        const confirmed = window.confirm(
            `Eliminare la funzionalità "${functionality.codice}"?`,
        )

        if (!confirmed) {
            return
        }

        setDeletingId(functionality.id)
        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_URL}/api/funzionalita/${functionality.id}`,
                {
                    method: 'DELETE',
                },
            )

            const data = await response.json()

            if (!response.ok) {
                setError(
                    getErrorMessage(data),
                )
                return
            }

            setFunctionalities(
                (currentFunctionalities) =>
                    currentFunctionalities.filter(
                        (currentFunctionality) =>
                            currentFunctionality.id !==
                            functionality.id,
                    ),
            )

            setFunctionStates((currentStates) => {
                const updatedStates = {
                    ...currentStates,
                }

                delete updatedStates[functionality.id]

                return updatedStates
            })

            setSuccess(
                'Funzionalità eliminata correttamente',
            )
        } catch {
            setError(
                'Backend non raggiungibile',
            )
        } finally {
            setDeletingId(null)
        }
    }

    if (!proxy) {
        return (
            <main className="features-page">
                <section className="features-empty">
                    <h1>Nessun proxy selezionato</h1>

                    <p>
                        Seleziona un proxy dalla pagina precedente.
                    </p>

                    <button
                        className="features-button secondary"
                        type="button"
                        onClick={onBack}
                    >
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
                    <p className="features-eyebrow">
                        Gestione Proxy
                    </p>

                    <h1>Gestione funzionalità</h1>
                </div>

                <div className="features-header-actions">
                    <p className="features-user">
                        Utente: <strong>{user.username}</strong>
                        <span>•</span>
                        Ruolo: <strong>{user.role}</strong>
                    </p>

                    <button
                        className="features-button secondary compact"
                        type="button"
                        onClick={onLogout}
                    >
                        Esci
                    </button>
                </div>
            </header>

            <section className="features-proxy-section">
                <div className="features-section-header">
                    <div>
                        <p className="features-section-label">
                            Proxy selezionato
                        </p>

                        <h2>{proxy.codiceProxy}</h2>
                    </div>

                    <button
                        className="features-button secondary compact"
                        type="button"
                        onClick={onBack}
                    >
                        ← Torna ai proxy
                    </button>
                </div>

                <article className="features-proxy-card">
                    <div>
                        <span>Codice proxy</span>
                        <strong>
                            {proxy.codiceProxy}
                        </strong>
                    </div>

                    <div>
                        <span>Descrizione</span>
                        <strong>
                            {proxy.descrizione}
                        </strong>
                    </div>

                    <div>
                        <span>Indirizzo IP</span>
                        <strong>
                            {proxy.indirizzoIP}
                        </strong>
                    </div>

                    <div>
                        <span>Subnet mask</span>
                        <strong>
                            {proxy.subnetMask}
                        </strong>
                    </div>
                </article>
            </section>

            <section className="features-functions-section">
                <div className="features-functions-header">
                    <div>
                        <h2>
                            Funzionalità disponibili
                        </h2>

                        <p>
                            Funzionalità applicabili al proxy selezionato.
                        </p>
                    </div>

                    <div className="features-functions-header-actions">
                        {canManage && (
                            <button
                                className="features-button primary compact"
                                type="button"
                                onClick={openCreateForm}
                                disabled={
                                    loading ||
                                    isBusy ||
                                    hasOpenForm
                                }
                            >
                                Nuova funzionalità
                            </button>
                        )}

                        <button
                            className="features-button secondary compact"
                            type="button"
                            onClick={loadFunctionalities}
                            disabled={
                                loading ||
                                isBusy ||
                                hasOpenForm
                            }
                        >
                            {loading
                                ? 'Aggiornamento...'
                                : 'Aggiorna'}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="features-message error">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="features-message success">
                        {success}
                    </p>
                )}

                <article
                    className={
                        `features-squid-row ${squidState}`
                    }
                >
                    <div className="features-squid-main">
                        <div>
                            <span className="features-squid-label">
                                Servizio Squid
                            </span>

                            <strong>
                                Squid Proxy Server
                            </strong>
                        </div>

                        <p className="features-squid-status">
                            {squidMessage}
                        </p>
                    </div>

                    <div className="features-squid-actions">
                        <button
                            className="features-button squid-status-button"
                            type="button"
                            onClick={() =>
                                handleSquidAction('stato')
                            }
                            disabled={
                                isBusy ||
                                hasOpenForm
                            }
                        >
                            {squidAction === 'stato'
                                ? 'Controllo...'
                                : 'Stato'}
                        </button>

                        <button
                            className="features-button squid-stop-button"
                            type="button"
                            onClick={() =>
                                handleSquidAction('stop')
                            }
                            disabled={
                                !canManage ||
                                isBusy ||
                                hasOpenForm
                            }
                        >
                            {squidAction === 'stop'
                                ? 'Stop...'
                                : 'Stop'}
                        </button>

                        <button
                            className="features-button squid-start-button"
                            type="button"
                            onClick={() =>
                                handleSquidAction('avvia')
                            }
                            disabled={
                                !canManage ||
                                isBusy ||
                                hasOpenForm
                            }
                        >
                            {squidAction === 'avvia'
                                ? 'Avvio...'
                                : 'Avvia'}
                        </button>
                    </div>
                </article>

                {createFormOpen && (
                    <div className="features-create-form">
                        <div className="features-form-heading">
                            <h3>
                                Nuova funzionalità
                            </h3>

                            <p>
                                Inserisci il codice del comando e una descrizione.
                            </p>
                        </div>

                        <label>
                            Codice

                            <input
                                name="codice"
                                type="text"
                                value={createForm.codice}
                                onChange={handleCreateChange}
                                maxLength={20}
                                placeholder="Esempio: 00"
                                required
                            />
                        </label>

                        <label>
                            Descrizione

                            <input
                                name="descrizione"
                                type="text"
                                value={createForm.descrizione}
                                onChange={handleCreateChange}
                                maxLength={255}
                                placeholder="Esempio: Test connessione server"
                                required
                            />
                        </label>

                        {createError && (
                            <p className="features-form-error">
                                {createError}
                            </p>
                        )}

                        <div className="features-create-actions">
                            <button
                                className="features-button secondary"
                                type="button"
                                onClick={closeCreateForm}
                                disabled={creating}
                            >
                                Annulla
                            </button>

                            <button
                                className="features-button primary"
                                type="button"
                                onClick={handleCreate}
                                disabled={
                                    creating ||
                                    !createForm.codice.trim() ||
                                    !createForm.descrizione.trim()
                                }
                            >
                                {creating
                                    ? 'Creazione...'
                                    : 'Crea'}
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="features-placeholder">
                        Caricamento funzionalità...
                    </div>
                ) : functionalities.length === 0 ? (
                    <div className="features-placeholder">
                        Nessuna funzionalità presente.
                    </div>
                ) : (
                    <div className="features-functions-list">
                        {functionalities.map(
                            (functionality) => {
                                const state =
                                    functionStates[
                                        functionality.id
                                        ]

                                const isActive =
                                    state?.active === true

                                const isStarting =
                                    startingId ===
                                    functionality.id

                                const isDeleting =
                                    deletingId ===
                                    functionality.id

                                const isEditing =
                                    editingId ===
                                    functionality.id

                                return (
                                    <article
                                        className="features-function-card"
                                        key={functionality.id}
                                    >
                                        <div className="features-function-main">
                                            <span className="features-function-code">
                                                {functionality.codice}
                                            </span>

                                            <div className="features-function-description">
                                                <span>
                                                    Descrizione
                                                </span>

                                                <strong>
                                                    {functionality.descrizione}
                                                </strong>
                                            </div>
                                        </div>

                                        {canManage && (
                                            <div className="features-function-actions">
                                                <button
                                                    className={
                                                        `features-button start-button ` +
                                                        (
                                                            isActive
                                                                ? 'active'
                                                                : 'inactive'
                                                        )
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggle(
                                                            functionality,
                                                        )
                                                    }
                                                    disabled={
                                                        isBusy ||
                                                        hasOpenForm
                                                    }
                                                >
                                                    {isStarting
                                                        ? 'Avvio...'
                                                        : isActive
                                                            ? 'Disattiva'
                                                            : 'Avvia'}
                                                </button>

                                                <button
                                                    className="features-button secondary"
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(
                                                            functionality,
                                                        )
                                                    }
                                                    disabled={
                                                        isBusy ||
                                                        hasOpenForm
                                                    }
                                                >
                                                    Modifica
                                                </button>

                                                <button
                                                    className="features-button danger"
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            functionality,
                                                        )
                                                    }
                                                    disabled={
                                                        isBusy ||
                                                        hasOpenForm
                                                    }
                                                >
                                                    {isDeleting
                                                        ? 'Eliminazione...'
                                                        : 'Elimina'}
                                                </button>
                                            </div>
                                        )}

                                        {state?.message && (
                                            <p className="features-function-result success">
                                                {state.message}
                                            </p>
                                        )}

                                        {state?.error && (
                                            <p className="features-function-result error">
                                                {state.error}
                                            </p>
                                        )}

                                        {isEditing && (
                                            <div className="features-edit-form">
                                                <label>
                                                    Codice

                                                    <input
                                                        name="codice"
                                                        type="text"
                                                        value={
                                                            editForm.codice
                                                        }
                                                        onChange={
                                                            handleEditChange
                                                        }
                                                        maxLength={20}
                                                        required
                                                    />
                                                </label>

                                                <label>
                                                    Descrizione

                                                    <input
                                                        name="descrizione"
                                                        type="text"
                                                        value={
                                                            editForm.descrizione
                                                        }
                                                        onChange={
                                                            handleEditChange
                                                        }
                                                        maxLength={255}
                                                        required
                                                    />
                                                </label>

                                                {editError && (
                                                    <p className="features-form-error">
                                                        {editError}
                                                    </p>
                                                )}

                                                <div className="features-edit-actions">
                                                    <button
                                                        className="features-button secondary"
                                                        type="button"
                                                        onClick={
                                                            closeEditForm
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                    >
                                                        Annulla
                                                    </button>

                                                    <button
                                                        className="features-button primary"
                                                        type="button"
                                                        onClick={() =>
                                                            handleSave(
                                                                functionality.id,
                                                            )
                                                        }
                                                        disabled={
                                                            saving ||
                                                            !editForm.codice.trim() ||
                                                            !editForm.descrizione.trim()
                                                        }
                                                    >
                                                        {saving
                                                            ? 'Salvataggio...'
                                                            : 'Salva'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                )
                            },
                        )}
                    </div>
                )}

                {!canManage && (
                    <p className="features-read-only">
                        Modalità sola lettura: il ruolo ospite può
                        controllare lo stato di Squid, ma non può
                        creare, avviare, fermare, modificare o
                        eliminare le funzionalità.
                    </p>
                )}
            </section>
        </main>
    )
}

export default GestioneFunzionalita