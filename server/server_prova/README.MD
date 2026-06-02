# Server Prova

Prima prova di comunicazione tra client Python e motore Python tramite socket TCP sulla porta 9000.

## Avvio

Per verificare che funzioni servono 2 terminali.

### Terminale 1 - Avviare il motore

Dalla cartella principale del progetto:

```bash
python motore/server.py
```

oppure su Windows:

```bash
py motore/server.py
```

Il motore deve mostrare:

```text
Motore avviato. In ascolto su 0.0.0.0:9000
```

Lasciare questo terminale aperto.

---

### Terminale 2 - Avviare il client di test

Dalla cartella principale del progetto:

```bash
python client/backend_test.py PING
```

oppure su Windows:

```bash
py client/backend_test.py PING
```

Se funziona, il client mostra una risposta positiva dal motore.

---

## Altri comandi di test

```bash
python client/backend_test.py ENABLE_BLACKLIST social
```

```bash
python client/backend_test.py DISABLE_BLACKLIST social
```

```bash
python client/backend_test.py ADD_WHITELIST youtube.com
```

```bash
python client/backend_test.py REMOVE_WHITELIST youtube.com
```

---

## Spegnimento

Per fermare il motore premere:

```text
CTRL + C
```

nel terminale in cui è stato avviato.