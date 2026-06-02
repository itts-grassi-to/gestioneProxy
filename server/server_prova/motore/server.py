import socket
import json

HOST = "0.0.0.0"
PORT = 9000


def receive_json(connection):
    """
    Riceve un messaggio JSON terminato da newline.
    """

    data = b""

    while b"\n" not in data:
        chunk = connection.recv(1024)

        if not chunk:
            break

        data += chunk

    if not data:
        return None

    message = data.decode("utf-8").strip()
    return json.loads(message)


def send_json(connection, response):
    """
    Invia una risposta JSON terminata da newline.
    """

    message = json.dumps(response) + "\n"
    connection.sendall(message.encode("utf-8"))


def handle_request(request):
    """
    Gestisce il codice ricevuto dal backend.
    """

    code = request.get("code")
    payload = request.get("payload", {})

    print("Codice ricevuto:", code)
    print("Payload ricevuto:", payload)

    if code == "PING":
        return {
            "status": "ok",
            "message": "Motore raggiungibile"
        }

    if code == "ENABLE_BLACKLIST":
        blacklist_name = payload.get("blacklistName", "default")

        return {
            "status": "ok",
            "message": f"Richiesta di attivazione blacklist '{blacklist_name}' ricevuta"
        }

    if code == "DISABLE_BLACKLIST":
        blacklist_name = payload.get("blacklistName", "default")

        return {
            "status": "ok",
            "message": f"Richiesta di disattivazione blacklist '{blacklist_name}' ricevuta"
        }

    if code == "ADD_WHITELIST":
        domain = payload.get("domain")

        return {
            "status": "ok",
            "message": f"Richiesta di aggiunta dominio in whitelist ricevuta: {domain}"
        }

    if code == "REMOVE_WHITELIST":
        domain = payload.get("domain")

        return {
            "status": "ok",
            "message": f"Richiesta di rimozione dominio dalla whitelist ricevuta: {domain}"
        }

    return {
        "status": "error",
        "message": "Codice non riconosciuto"
    }


def start_server():
    """
    Avvia il motore sulla porta 9000.
    Il server resta sempre in ascolto e gestisce una richiesta alla volta.
    """

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        server_socket.bind((HOST, PORT))
        server_socket.listen()

        print(f"Motore avviato. In ascolto su {HOST}:{PORT}")

        while True:
            connection, address = server_socket.accept()

            with connection:
                print(f"\nConnessione ricevuta da {address}")

                try:
                    request = receive_json(connection)

                    if request is None:
                        print("Nessun dato ricevuto.")
                        continue

                    response = handle_request(request)
                    send_json(connection, response)

                except json.JSONDecodeError:
                    send_json(connection, {
                        "status": "error",
                        "message": "JSON non valido"
                    })

                except Exception as error:
                    send_json(connection, {
                        "status": "error",
                        "message": str(error)
                    })


if __name__ == "__main__":
    start_server()