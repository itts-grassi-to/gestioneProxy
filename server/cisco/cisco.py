#!/usr/bin/env python3
import os
import sys


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATUS_FILE = os.path.join(BASE_DIR, "status.txt")


def read_status():
    """
    Legge lo stato della funzionalita Cisco.

    Restituisce "1" se la funzionalita e attiva,
    "0" se non e attiva oppure None se il file
    non esiste o contiene un valore non valido.
    """

    if not os.path.exists(STATUS_FILE):
        return None

    try:
        with open(
                STATUS_FILE,
                "r",
                encoding="utf-8",
        ) as status_file:
            value = status_file.read().strip()

    except OSError:
        return None

    if value not in {"0", "1"}:
        return None

    return value


def write_status(value):
    """
    Scrive lo stato della funzionalita Cisco.

    Restituisce True solamente se il valore e stato
    scritto e riletto correttamente dal file.
    """

    if value not in {"0", "1"}:
        return False

    try:
        with open(
                STATUS_FILE,
                "w",
                encoding="utf-8",
        ) as status_file:
            status_file.write(value)

    except OSError:
        return False

    return read_status() == value


def print_current_status():
    if read_status() == "1":
        print("OK")
    else:
        print("NOK")


def main():
    if len(sys.argv) != 2:
        print("NOK")
        return 1

    command = sys.argv[1].lower()

    if command == "status":
        print_current_status()
        return 0

    if command == "start":
        if not write_status("1"):
            print("NOK")
            return 1

        print_current_status()
        return 0

    if command == "stop":
        if not write_status("0"):
            print("NOK")
            return 1

        print_current_status()
        return 0

    print("NOK")
    return 1


if __name__ == "__main__":
    sys.exit(main())