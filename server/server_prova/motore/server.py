import socket

HOST = "0.0.0.0"
PORT = 9000


def receive_message(connection):
    """
    Riceve un messaggio terminato da newline.
    """

    data = b""

    while b"\n" not in data:
        chunk = connection.recv(1024)

        if not chunk:
            break

        data += chunk

    if not data:
        return None

    return data.decode("utf-8").strip()


def send_message(connection, message):
    """
    Invia una risposta terminata da newline.
    """

    connection.sendall((message + "\n").encode("utf-8"))


def handle_code(message):
    """
    Gestisce il codice ricevuto dal backend.
    """

    parts = message.split("|", 1)
    code = parts[0]
    parameter = parts[1] if len(parts) > 1 else None

    print("Codice ricevuto:", code)
    print("Parametro ricevuto:", parameter)

    if code == "00":
        return "50"

    elif code == "01":
        return "51"

    elif code == "02":
        return "52"

    elif code == "03":
        if not parameter:
            return "91"

        return "53"

    elif code == "04":
        if not parameter:
            return "91"

        return "54"

    else:
        return "90"

    
def start_server():
    """
    Avvia il motore sulla porta 9000.
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
                    message = receive_message(connection)

                    if message is None:
                        print("Nessun dato ricevuto.")
                        continue

                    response_code = handle_code(message)
                    send_message(connection, response_code)

                    print("Codice risposta inviato:", response_code)

                except Exception as error:
                    print("Errore:", error)
                    send_message(connection, "99")


if __name__ == "__main__":
    start_server()