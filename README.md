# gestioneProxy
La gestione deve provvedere ad attivare e disattivare i filtri (white e black list) del proxy (squid) senza che l’operatore che esegue l’operazione debba conoscere le password di root del server che ospita squid. Per far questo si dovranno costruire i seguenti programmi.

Motore
Interfaccia di gestione
Il progetto dovrà essere sviluppato in locale e messo in produzione in una macchina Debian sul server della scuola.
Essenziale la condivisione del codice su piattaforma GitHub

MOTORE (server)
Il motore deve essere un server python in ascolto sulla porta 9000.
Riceverà dei codici che serviranno ad installare gli script per attivare le varie blacklist.
CLIENT
Si dovrà creare una docker con front-end REACT (Next.js) 
Il front-end dovrà contenere le pagine sia per la gestione utenti, sia per la gestione delle whitelist squid.

Lavoro del team GP


## Architettura

Il progetto è composto da:

- `server/`: motore Python in ascolto sulla porta `9000`;
- `client/react/backend/`: backend Python con FastAPI;
- `client/react/frontend/`: frontend React avviato con Vite;
- PostgreSQL per la gestione degli utenti;
- Docker Compose per avviare client e database.

## Ruoli

L'applicazione prevede tre ruoli:

- `guest`: accesso alle sole funzionalità pubbliche;
- `docente`: gestione dei filtri proxy;
- `admin`: gestione completa, compresi gli utenti.

Attualmente sono implementati:

- accesso come ospite;
- autenticazione amministratore tramite username e password;
- memorizzazione sicura delle password tramite hash;
- collegamento del backend a PostgreSQL.

# Test del server e gestione delle funzionalità

Questa guida descrive come provare la comunicazione tra il backend e il server Python e come utilizzare la pagina di gestione delle funzionalità.

## 1. Avvio del server

Aprire un terminale nella cartella:

```text
server
```

Avviare il server con:

```powershell
py server.py
```

In alternativa:

```powershell
python server.py
```

Il server rimane in ascolto sulla porta `9000`. Il terminale deve restare aperto durante il test.

## 2. Configurazione del proxy

Recuperare l'indirizzo IPv4 del computer con:

```powershell
ipconfig
```

Creare o modificare un proxy inserendo l'indirizzo IPv4 del computer.

Esempio:

```text
Codice proxy: TEST
Indirizzo IP: 192.168.1.25
Subnet mask: 255.255.255.0
```

Non utilizzare `127.0.0.1`, perché il backend viene eseguito dentro Docker.

Se Windows mostra una richiesta del firewall, consentire l'accesso a Python sulle reti private.

## 3. Test della connessione

Dalla pagina dei proxy:

1. Aprire il menu del proxy.
2. Premere `Vai a`.
3. Individuare la funzionalità con codice `00`.
4. Premere `Avvia`.

Con il server attivo:

- il backend invia il codice `00`;
- il server risponde con il codice `50`;
- il backend mostra il risultato `OK`;
- il pulsante diventa verde e mostra `Disattiva`.

Premendo `Disattiva`, la funzionalità torna graficamente allo stato inattivo.

## 4. Test con server spento

Fermare il server con:

```text
Ctrl + C
```

Premere nuovamente `Avvia`.

Il risultato atteso è:

```text
Server non attivo
```

Il pulsante rimane rosso.

## Limitazioni attuali

Per ora il test del server funziona solamente con:

```text
Codice: 00
Descrizione: Test connessione server
```

Le funzionalità con altri codici possono essere salvate nel database, ma non sono ancora collegate a un test gestito dal backend.

Il pulsante `Disattiva` modifica solamente lo stato mostrato nel frontend e non arresta il processo `server.py`.