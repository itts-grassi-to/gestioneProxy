import socket
import json

MOTORE_HOST = "127.0.0.1"
MOTORE_PORT = 9000


def receive_json(connection):
    """
    Riceve una risposta JSON terminata da newline.
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


def send_request_to_motore(code, payload=None):
    """
    Invia una richiesta al motore tramite socket TCP.

    Il backend manda un codice operativo e un eventuale payload.
    Il motore risponde con un JSON contenente lo stato dell'operazione.
    """

    if payload is None:
        payload = {}

    request = {
        "code": code,
        "payload": payload
    }

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
        client_socket.connect((MOTORE_HOST, MOTORE_PORT))

        message = json.dumps(request) + "\n"
        client_socket.sendall(message.encode("utf-8"))

        response = receive_json(client_socket)

    return response