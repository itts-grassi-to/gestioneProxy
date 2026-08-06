import socket
import subprocess
import time


HOST = "0.0.0.0"
PORT = 9000

CODE_TEST = "00"
CODE_SQUID_STATUS = "05"
CODE_SQUID_START = "06"
CODE_SQUID_STOP = "07"

RESPONSE_TEST_OK = "50"
RESPONSE_SQUID_OK = "OK"
RESPONSE_SQUID_NOK = "NOK"
RESPONSE_UNKNOWN_COMMAND = "90"
RESPONSE_ERROR = "99"

SQUID_OPERATION_TIMEOUT = 45
SQUID_CHECK_INTERVAL = 0.5


def get_squid_state():
    """
    Restituisce lo stato reale del servizio Squid.

    Possibili esempi:
    active
    inactive
    activating
    deactivating
    failed
    """

    result = subprocess.run(
        [
            "systemctl",
            "is-active",
            "squid",
        ],
        capture_output=True,
        text=True,
        timeout=5,
        check=False,
    )

    squid_state = result.stdout.strip()

    if not squid_state:
        squid_state = "unknown"

    print(
        f"Stato Squid: {squid_state}",
        flush=True,
    )

    return squid_state


def is_squid_active():
    """
    Restituisce True solamente quando
    Squid è realmente active.
    """

    return get_squid_state() == "active"


def wait_for_squid_start(
    timeout=SQUID_OPERATION_TIMEOUT,
):
    """
    Attende che Squid raggiunga realmente
    lo stato active.
    """

    start_time = time.monotonic()

    while (
        time.monotonic() - start_time
        < timeout
    ):
        squid_state = get_squid_state()

        if squid_state == "active":
            return True

        if squid_state == "failed":
            return False

        time.sleep(SQUID_CHECK_INTERVAL)

    return False


def wait_for_squid_stop(
    timeout=SQUID_OPERATION_TIMEOUT,
):
    """
    Attende che Squid abbia realmente
    terminato la fase di arresto.

    Lo stato deactivating NON viene
    considerato come servizio già fermo.
    """

    start_time = time.monotonic()

    while (
        time.monotonic() - start_time
        < timeout
    ):
        squid_state = get_squid_state()

        if squid_state in {
            "inactive",
            "failed",
        }:
            return True

        time.sleep(SQUID_CHECK_INTERVAL)

    return False


def start_squid():
    """
    Richiede a systemd l'avvio di Squid
    e attende che diventi realmente active.
    """

    result = subprocess.run(
        [
            "systemctl",
            "--no-block",
            "start",
            "squid",
        ],
        capture_output=True,
        text=True,
        timeout=5,
        check=False,
    )

    if result.returncode != 0:
        print(
            "Errore durante l'avvio di Squid: "
            f"{result.stderr.strip()}",
            flush=True,
        )

        return False

    return wait_for_squid_start()


def stop_squid():
    """
    Richiede a systemd lo stop di Squid
    e attende la conclusione reale dello shutdown.
    """

    result = subprocess.run(
        [
            "systemctl",
            "--no-block",
            "stop",
            "squid",
        ],
        capture_output=True,
        text=True,
        timeout=5,
        check=False,
    )

    if result.returncode != 0:
        print(
            "Errore durante lo stop di Squid: "
            f"{result.stderr.strip()}",
            flush=True,
        )

        return False

    return wait_for_squid_stop()


def handle_command(code):
    """
    Gestisce i codici ricevuti dal backend.
    """

    if code == CODE_TEST:
        return RESPONSE_TEST_OK

    if code == CODE_SQUID_STATUS:
        if is_squid_active():
            return RESPONSE_SQUID_OK

        return RESPONSE_SQUID_NOK

    if code == CODE_SQUID_START:
        start_completed = start_squid()

        if start_completed:
            return RESPONSE_SQUID_OK

        return RESPONSE_SQUID_NOK

    if code == CODE_SQUID_STOP:
        stop_completed = stop_squid()

        if stop_completed:
            return RESPONSE_SQUID_NOK

        print(
            "Timeout: impossibile confermare "
            "l'arresto completo di Squid",
            flush=True,
        )

        return RESPONSE_ERROR

    return RESPONSE_UNKNOWN_COMMAND


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

    return data.decode("utf-8").strip()


def handle_client(connection, address):
    print(
        f"Connessione ricevuta da {address}",
        flush=True,
    )

    try:
        message = receive_message(connection)

        if not message:
            return

        parts = message.split("|", 1)

        code = parts[0].strip()

        parameter = (
            parts[1].strip()
            if len(parts) > 1
            else None
        )

        print(
            f"Codice ricevuto: {code}",
            flush=True,
        )

        print(
            f"Parametro ricevuto: {parameter}",
            flush=True,
        )

        response = handle_command(code)

    except Exception as error:
        print(
            "Errore durante la gestione "
            f"del comando: {error}",
            flush=True,
        )

        response = RESPONSE_ERROR

    connection.sendall(
        f"{response}\n".encode("utf-8")
    )

    print(
        f"Risposta inviata: {response}",
        flush=True,
    )


def start_server():
    with socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM,
    ) as server:
        server.setsockopt(
            socket.SOL_SOCKET,
            socket.SO_REUSEADDR,
            1,
        )

        server.bind(
            (
                HOST,
                PORT,
            )
        )

        server.listen()

        print(
            "server-funzionalita-squid avviato "
            f"su {HOST}:{PORT}",
            flush=True,
        )

        while True:
            connection, address = server.accept()

            with connection:
                handle_client(
                    connection,
                    address,
                )


if __name__ == "__main__":
    start_server()
