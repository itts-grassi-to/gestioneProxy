import sys
from motore_client import send_request_to_motore


def build_payload(code, args):
    """
    Costruisce il payload da inviare al motore in base al codice richiesto.
    """

    if code in ["ENABLE_BLACKLIST", "DISABLE_BLACKLIST"]:
        blacklist_name = args[0] if len(args) > 0 else "default"

        return {
            "blacklistName": blacklist_name
        }

    if code in ["ADD_WHITELIST", "REMOVE_WHITELIST"]:
        domain = args[0] if len(args) > 0 else None

        return {
            "domain": domain
        }

    return {}


def main():
    """
    Simula una richiesta del frontend al backend.

    Esempi:
    python backend/backend_test.py PING
    python backend/backend_test.py ENABLE_BLACKLIST social
    python backend/backend_test.py ADD_WHITELIST youtube.com
    """

    if len(sys.argv) < 2:
        code = "PING"
        args = []
    else:
        code = sys.argv[1]
        args = sys.argv[2:]

    payload = build_payload(code, args)

    print("Richiesta inviata al motore:")
    print({
        "code": code,
        "payload": payload
    })

    response = send_request_to_motore(code, payload)

    print("\nRisposta ricevuta dal motore:")
    print(response)


if __name__ == "__main__":
    main()