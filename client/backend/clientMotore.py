import socket


DEFAULT_PORT = 9000
DEFAULT_TIMEOUT = 3.0


class MotoreNonAttivoError(Exception):
    """
    Sollevata quando il motore non è raggiungibile
    o non risponde entro il timeout.
    """


def receive_message(connection: socket.socket) -> str:
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
        raise MotoreNonAttivoError(
            "Il motore non ha inviato alcuna risposta"
        )

    return data.decode("utf-8").strip()


def send_command(
        host: str,
        code: str,
        parameter: str | None = None,
        port: int = DEFAULT_PORT,
        timeout: float = DEFAULT_TIMEOUT,
) -> str:
    """
    Invia un comando al motore tramite socket TCP.
    """

    message = code

    if parameter:
        message = f"{code}|{parameter}"

    try:
        with socket.create_connection(
                (host, port),
                timeout=timeout,
        ) as connection:
            connection.settimeout(timeout)

            connection.sendall(
                f"{message}\n".encode("utf-8")
            )

            return receive_message(connection)

    except (
            socket.timeout,
            ConnectionRefusedError,
            OSError,
    ) as error:
        raise MotoreNonAttivoError(
            "Server non attivo"
        ) from error