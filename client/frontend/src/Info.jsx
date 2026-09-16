import './Info.css'

function Info({ onBack }) {
    return (
        <main className="info-page">
            <section
                className="info-card"
                aria-labelledby="info-title"
            >
                <header className="info-header">
                    <div>
                        <h1 id="info-title">
                            Gestione Proxy v1.0
                        </h1>

                        <p>
                            Applicazione per la gestione remota
                            del servizio proxy Squid.
                        </p>
                    </div>

                    <button
                        className="info-back-button"
                        type="button"
                        onClick={onBack}
                    >
                        Indietro
                    </button>
                </header>

                <div className="info-content">
                    <section className="info-section">
                        <h2>Informazioni</h2>

                        <p>
                            Gestione Proxy permette di controllare
                            da un’interfaccia web i proxy Squid
                            presenti nella rete, senza richiedere
                            all’operatore la conoscenza delle
                            credenziali di amministrazione del server.
                        </p>

                        <dl className="info-details">
                            <div>
                                <dt>Sviluppatore</dt>
                                <dd>Stefano Poetto</dd>
                            </div>

                            <div>
                                <dt>Corso di laurea</dt>
                                <dd>
                                    Informatica – Università
                                    degli Studi di Torino
                                </dd>
                            </div>

                            <div>
                                <dt>Contatto</dt>
                                <dd>
                                    <a href="mailto:stefanopoetto.business@gmail.com">
                                        stefanopoetto.business@gmail.com
                                    </a>
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="info-section">
                        <h2>Licenza</h2>

                        <p>
                            Questo software è distribuito come
                            software libero secondo i termini della
                            GNU General Public License v3.0.
                            È consentito ridistribuirlo e modificarlo
                            nel rispetto dei termini della licenza.
                        </p>

                        <a
                            className="info-license-link"
                            href="https://www.gnu.org/licenses/gpl-3.0.html"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Consulta la GNU GPL v3.0
                        </a>
                    </section>

                    <section className="info-section info-disclaimer">
                        <h2>
                            Esclusione di garanzia e responsabilità
                        </h2>

                        <p>
                            IL SOFTWARE È FORNITO “COSÌ COM’È”
                            (“AS IS”), SENZA GARANZIA DI ALCUN TIPO,
                            ESPRESSA O IMPLICITA, INCLUSE, A TITOLO
                            ESEMPLIFICATIVO MA NON LIMITATIVO, LE
                            GARANZIE DI COMMERCIABILITÀ, IDONEITÀ
                            PER UNO SCOPO PARTICOLARE E NON VIOLAZIONE.
                        </p>

                        <p>
                            IN NESSUN CASO L’AUTORE O I TITOLARI
                            DEL COPYRIGHT SARANNO RESPONSABILI PER
                            QUALSIASI RECLAMO, DANNO O ALTRA
                            RESPONSABILITÀ, INCLUSI DANNI DIRETTI,
                            INDIRETTI, INCIDENTALI O CONSEQUENZIALI,
                            PERDITA DI DATI O MALFUNZIONAMENTI DEL
                            SISTEMA, DERIVANTI DA O IN CONNESSIONE
                            CON L’USO O L’IMPOSSIBILITÀ DI UTILIZZARE
                            IL SOFTWARE.
                        </p>
                    </section>
                </div>
            </section>
        </main>
    )
}

export default Info