import sys
from motore_client import send_request_to_motore


REQUEST_CODES = {
    "PING": "00",
    "ENABLE_BLACKLIST": "01",
    "DISABLE_BLACKLIST": "02",
    "ADD_WHITELIST": "03",
    "REMOVE_WHITELIST": "04",
}


RESPONSE_MESSAGES = {
    "50": "Motore raggiungibile",
    "51": "Blacklist attivata correttamente",
    "52": "Blacklist disattivata correttamente",
    "53": "Dominio aggiunto alla whitelist",
    "54": "Dominio rimosso dalla whitelist",
    "90": "Codice non riconosciuto dal motore",
    "91": "Parametro mancante",
    "99": "Errore interno del motore",
}


def get_request_code(command):
    """
    Converte un comando testuale nel codice del protocollo.
    """

    command = command.upper()

    if command in REQUEST_CODES:
        return REQUEST_CODES[command]

    return command


def get_response_message(response_code):
    """
    Converte il codice di risposta in un messaggio leggibile.
    """

    if response_code in RESPONSE_MESSAGES:
        return RESPONSE_MESSAGES[response_code]

    return "Risposta sconosciuta"


def main():
    """
    Client di test per inviare codici al motore.

    Esempi:
    python client/backend_test.py PING
    python client/backend_test.py 00
    python client/backend_test.py ENABLE_BLACKLIST social
    python client/backend_test.py 01 social
    """

    if len(sys.argv) < 2:
        command = "PING"
        parameter = None
    else:
        command = sys.argv[1]
        parameter = sys.argv[2] if len(sys.argv) > 2 else None

    request_code = get_request_code(command)

    print("Comando richiesto:", command)
    print("Codice inviato:", request_code)
    print("Parametro inviato:", parameter)

    response_code = send_request_to_motore(request_code, parameter)
    response_message = get_response_message(response_code)

    print("\nCodice risposta ricevuto:", response_code)
    print("Risposta interpretata:", response_message)


if __name__ == "__main__":
    main()