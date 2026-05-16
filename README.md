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
