# gestioneProxy

La gestione deve provvedere ad attivare e disattivare i filtri (white e black list) del proxy (Squid) senza che l’operatore che esegue l’operazione debba conoscere le password di root del server che ospita Squid. Per far questo si dovranno costruire i seguenti programmi.

Motore Interfaccia di gestione Il progetto dovrà essere sviluppato in locale e messo in produzione in una macchina Debian sul server della scuola. Essenziale la condivisione del codice su piattaforma GitHub.

MOTORE (server) Il motore deve essere un server Python in ascolto sulla porta 9000. Riceverà dei codici per eseguire le funzionalità disponibili. CLIENT Si dovrà creare una Docker con frontend React. Il frontend dovrà contenere le pagine per la gestione degli utenti e delle funzionalità del proxy.

Lavoro del team GP

---

# Architettura

Schema generale del progetto:

```text
Frontend React
      |
      v
Backend FastAPI
      |
      | TCP - porta 9000
      v
server-funzionalita-squid
      |
      |-----------------------|
      v                       v
systemd                 script FAD/Cisco
      |                       |
      v                       v
squid.service            file status.txt
```

---

## Ruoli

L'applicazione prevede tre ruoli:

- `guest`: accesso in sola lettura;
- `docente`: gestione dei filtri proxy;
- `admin`: gestione completa, compresi gli utenti.

Attualmente sono implementati:

- accesso come ospite;
- autenticazione amministratore tramite username e password;
- memorizzazione sicura delle password tramite hash;
- collegamento del backend a PostgreSQL.

---

# Gestione proxy

Ogni proxy contiene i seguenti attributi principali:

```text
codiceProxy
descrizione
indirizzoIP
subnetMask
```

L'indirizzo IP del proxy è utilizzato dal backend per contattare il server Python installato sulla macchina associata al proxy.

Esempio:

```text
Codice proxy: TEST
Descrizione: Proxy di test
Indirizzo IP: 192.168.56.101
Subnet mask: 255.255.255.0
```

La comunicazione avviene tramite socket TCP sulla porta:

```text
9000
```

Il flusso è quindi:

```text
Frontend
   |
   v
Backend FastAPI
   |
   | utilizza l'indirizzo IP del proxy selezionato
   v
Macchina Debian : porta 9000
   |
   v
server-funzionalita-squid
```

---

# Funzionalità configurabili

Le funzionalità memorizzate nel database contengono:

```text
codice
descrizione
```

Tramite l'interfaccia web è possibile:

- visualizzare le funzionalità;
- creare nuove funzionalità;
- modificare le funzionalità;
- eliminare le funzionalità;
- avviare una funzionalità sul proxy selezionato.

All'avvio del backend viene creata automaticamente, se non esiste già, la funzionalità:

```text
Codice: 00
Descrizione: Test connessione server
```

La funzionalità con codice `00` permette di verificare la comunicazione tra backend e server Python.

Quando il server riceve:

```text
00
```

risponde:

```text
50
```

Il backend interpreta la risposta come test di connessione riuscito.

Il test `00` è indipendente dallo stato di Squid e può quindi funzionare anche quando `squid.service` è spento.

Il pulsante `Disattiva` relativo alla funzionalità `00` modifica attualmente solamente lo stato grafico mostrato nel frontend e non arresta Squid o il server Python.

---

# Installazione del server sulla macchina Debian

La macchina deve avere installati:

```text
Python 3
systemd
Squid
```

Per installare Squid:

```bash
sudo apt update
sudo apt install squid -y
```

Creare la directory utilizzata dal server:

```bash
sudo mkdir -p /opt/gestione-proxy
```

Copiare il server e gli script delle funzionalità:

```bash
sudo cp server/server-funzionalita-squid.py /opt/gestione-proxy/
sudo cp -r server/fad server/cisco /opt/gestione-proxy/
```

I file saranno quindi disponibili in:

```text
/opt/gestione-proxy/server-funzionalita-squid.py
/opt/gestione-proxy/fad/
/opt/gestione-proxy/cisco/
```

Copiare il file systemd:

```bash
sudo cp server/server-funzionalita-squid.service /etc/systemd/system/
```

Ricaricare systemd:

```bash
sudo systemctl daemon-reload
```

Abilitare il server all'avvio automatico della macchina:

```bash
sudo systemctl enable server-funzionalita-squid
```

Avviare il servizio:

```bash
sudo systemctl start server-funzionalita-squid
```

In alternativa è possibile abilitarlo e avviarlo contemporaneamente:

```bash
sudo systemctl enable --now server-funzionalita-squid
```

---

# Servizio systemd

Il file:

```text
server/server-funzionalita-squid.service
```

permette a systemd di gestire automaticamente il server Python.

Il servizio esegue:

```text
/usr/bin/python3 /opt/gestione-proxy/server-funzionalita-squid.py
```

ed è configurato per riavviare automaticamente il processo in caso di arresto anomalo.

Una volta eseguito:

```bash
sudo systemctl enable server-funzionalita-squid
```

il server Python viene avviato automaticamente ad ogni accensione della macchina Debian.

Non è quindi necessario avviarlo manualmente.

---

# Verifica del server

Per controllare lo stato del server Python:

```bash
systemctl status server-funzionalita-squid
```

oppure:

```bash
systemctl is-active server-funzionalita-squid
```

Il risultato atteso è:

```text
active
```

Per verificare che il server sia in ascolto sulla porta 9000:

```bash
sudo ss -ltnp | grep 9000
```

---

# Log

Per visualizzare in tempo reale i log del server Python:

```bash
sudo journalctl -u server-funzionalita-squid -f
```

Per visualizzare i log di Squid:

```bash
sudo journalctl -u squid -f
```

Per controllare direttamente lo stato di Squid:

```bash
systemctl status squid
```

oppure:

```bash
systemctl is-active squid
```

---

# Codici supportati

Il server utilizza attualmente i seguenti codici:

```text
00 -> test connessione server
05 -> stato Squid
06 -> avvio Squid
07 -> stop Squid
08 -> gestione FAD tramite status, start e stop
09 -> gestione Cisco tramite status, start e stop
```

Le principali risposte sono:

```text
50  -> test connessione riuscito
OK  -> funzionalità attiva
NOK -> funzionalità non attiva
90  -> comando non riconosciuto
99  -> errore durante l'esecuzione
```

---

# Codice 00 - Test connessione

Il codice:

```text
00
```

permette di verificare che il backend riesca a comunicare con il server Python.

Il server risponde:

```text
50
```

Questo test non controlla Squid.

Può quindi funzionare anche quando:

```text
squid.service = inactive
```

perché verifica solamente che `server-funzionalita-squid` sia raggiungibile.

---

# Codice 05 - Stato Squid

Il codice:

```text
05
```

controlla lo stato corrente di Squid tramite systemd.

Il server utilizza lo stato restituito da:

```bash
systemctl is-active squid
```

Se Squid è attivo viene restituito:

```text
OK
```

Se Squid non è attivo viene restituito:

```text
NOK
```

`NOK` non rappresenta necessariamente un errore.

Indica semplicemente che Squid non si trova nello stato `active`.

---

# Codice 06 - Avvio Squid

Il codice:

```text
06
```

richiede a systemd l'avvio del servizio Squid.

Il server esegue l'equivalente di:

```bash
systemctl start squid
```

e successivamente verifica che Squid abbia raggiunto realmente lo stato:

```text
active
```

Durante l'avvio il servizio può temporaneamente trovarsi nello stato:

```text
activating
```

Il server continua ad effettuare controlli fino al raggiungimento dello stato definitivo oppure fino al timeout.

Quando Squid è realmente attivo viene restituito:

```text
OK
```

---

# Codice 07 - Stop Squid

Il codice:

```text
07
```

richiede a systemd l'arresto del servizio Squid.

Il server esegue l'equivalente di:

```bash
systemctl stop squid
```

Squid utilizza uno shutdown controllato.

Durante l'arresto può quindi trovarsi temporaneamente nello stato:

```text
deactivating
```

Durante i test Squid può attendere circa 30 secondi per permettere alle eventuali connessioni attive di terminare.

Il server Python non considera lo stato:

```text
deactivating
```

come servizio già arrestato.

Continua quindi a controllare lo stato fino a quando Squid raggiunge realmente:

```text
inactive
```

Solo a quel punto restituisce:

```text
NOK
```

In questo caso `NOK` è la risposta corretta perché indica che Squid non è più attivo.

Il timeout previsto per le operazioni di avvio e arresto è di:

```text
45 secondi
```

---

# Gestione Squid dal frontend

Entrando nella pagina delle funzionalità di un proxy viene visualizzata una riga dedicata al servizio Squid.

La riga mette a disposizione tre operazioni:

```text
Stato
Stop
Avvia
```

Lo stato di Squid viene controllato automaticamente quando viene aperta la pagina.

## Squid attivo

Quando il backend riceve:

```text
OK
```

la riga viene visualizzata in verde e viene mostrato:

```text
Squid attivo
```

## Squid non attivo

Quando il backend riceve:

```text
NOK
```

la riga viene visualizzata in rosso e viene mostrato:

```text
Squid non attivo
```

## Pulsante Stato

Il pulsante `Stato` controlla lo stato corrente di Squid senza modificarlo.

## Pulsante Stop

Il pulsante `Stop` richiede l'arresto di Squid.

L'interfaccia attende la conclusione dell'operazione.

Il server restituisce la risposta solamente quando Squid ha realmente terminato lo shutdown.

## Pulsante Avvia

Il pulsante `Avvia` richiede l'avvio di Squid.

Il server attende che il servizio raggiunga realmente lo stato `active` prima di restituire `OK`.

---

# Gestione FAD e Cisco

Il frontend permette di controllare FAD e Cisco tramite i pulsanti `Stato`, `Stop` e `Avvia`.

Il backend invia al server i codici `08` per FAD e `09` per Cisco, accompagnati dai parametri `status`, `start` o `stop`.

Ogni funzionalità salva il proprio stato in un file `status.txt` separato:

```text
1 -> avviata -> OK -> riga verde
0 -> non avviata -> NOK -> riga rossa
```