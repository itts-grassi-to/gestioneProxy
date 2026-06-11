# Server Prova

Prima prova di comunicazione tra client Python e motore Python tramite socket TCP sulla porta 9000.

## Avvio del progetto

Per verificare che tutto funzioni servono 3 terminali.

---

## 1. Avviare il motore

Dalla cartella `server_prova`:

```bash
python motore/server.py
```

oppure su Windows:

```bash
py motore/server.py
```

Il motore resta in ascolto sulla porta `9000`.

---

## 2. Avviare il backend Python

In un secondo terminale, sempre dalla cartella `server_prova`:

```bash
python client/backend_api.py
```

oppure su Windows:

```bash
py client/backend_api.py
```

Il backend resta in ascolto sulla porta `8000`.

---

## 3. Avviare il frontend

In un terzo terminale, entrare nella cartella `frontend`:

```bash
cd frontend
```

La prima volta installare le dipendenze:

```bash
npm install
```

Poi avviare il frontend:

```bash
npm run dev
```

Aprire il browser su:

```text
http://localhost:3000
```

---

## Test

Dopo aver avviato motore, backend e frontend, cliccare il pulsante:

```text
PING motore
```

Se tutto funziona, nella pagina viene mostrata una risposta positiva dal motore.

---

## Spegnimento

Per fermare motore, backend o frontend, premere:

```text
CTRL + C
```

nel terminale corrispondente.
