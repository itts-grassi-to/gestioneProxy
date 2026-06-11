import socket

MOTORE_HOST = "127.0.0.1"
MOTORE_PORT = 9000


def receive_message(connection):
    """
    Riceve una risposta terminata da newline.
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


def send_request_to_motore(code, parameter=None):
    """
    Invia un codice al motore tramite socket TCP.
    """

    if parameter:
        message = f"{code}|{parameter}"
    else:
        message = code

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
        client_socket.connect((MOTORE_HOST, MOTORE_PORT))

        client_socket.sendall((message + "\n").encode("utf-8"))

        response_code = receive_message(client_socket)

    return response_code