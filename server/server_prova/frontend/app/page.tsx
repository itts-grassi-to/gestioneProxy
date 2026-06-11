"use client";

import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState("Nessuna richiesta inviata");

  async function sendCommand(action: string, parameter?: string) {
    setResponse("Invio richiesta...");

    try {
      const result = await fetch("http://localhost:8000/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action,
          parameter: parameter,
        }),
      });

      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch {
      setResponse("Errore: backend non raggiungibile");
    }
  }

  return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1>Stage Squid - Prova Frontend</h1>

          <p>Frontend React collegato al backend Python.</p>

          <div style={styles.buttons}>
            <button onClick={() => sendCommand("PING")}>
              PING motore
            </button>

            <button onClick={() => sendCommand("ENABLE_BLACKLIST", "social")}>
              Attiva blacklist
            </button>

            <button onClick={() => sendCommand("DISABLE_BLACKLIST", "social")}>
              Disattiva blacklist
            </button>

            <button onClick={() => sendCommand("ADD_WHITELIST", "youtube.com")}>
              Aggiungi whitelist
            </button>

            <button onClick={() => sendCommand("REMOVE_WHITELIST", "youtube.com")}>
              Rimuovi whitelist
            </button>
          </div>

          <h2>Risposta</h2>

          <pre style={styles.response}>
          {response}
        </pre>
        </div>
      </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    color: "white",
    fontFamily: "Arial",
  },
  card: {
    width: "600px",
    padding: "30px",
    borderRadius: "16px",
    backgroundColor: "#1f2937",
  },
  buttons: {
    display: "grid",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  response: {
    minHeight: "120px",
    padding: "15px",
    borderRadius: "10px",
    backgroundColor: "#000",
    color: "#22c55e",
    overflow: "auto",
  },
} as const;