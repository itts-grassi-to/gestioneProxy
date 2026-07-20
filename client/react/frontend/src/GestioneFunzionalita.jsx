import './GestioneFunzionalita.css'

function GestioneFunzionalita({
                                  proxy,
                                  user,
                                  onBack,
                                  onLogout,
                              }) {
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
                        <strong>{proxy.codiceProxy}</strong>
                    </div>

                    <div>
                        <span>Descrizione</span>
                        <strong>{proxy.descrizione}</strong>
                    </div>

                    <div>
                        <span>Indirizzo IP</span>
                        <strong>{proxy.indirizzoIP}</strong>
                    </div>

                    <div>
                        <span>Subnet mask</span>
                        <strong>{proxy.subnetMask}</strong>
                    </div>
                </article>
            </section>

            <section className="features-functions-section">
                <h2>Funzionalità disponibili</h2>

                <p>
                    In questa sezione verranno inseriti i comandi per la
                    gestione degli script del proxy selezionato.
                </p>

                <div className="features-placeholder">
                    Le funzionalità saranno aggiunte nel prossimo passaggio.
                </div>
            </section>
        </main>
    )
}

export default GestioneFunzionalita