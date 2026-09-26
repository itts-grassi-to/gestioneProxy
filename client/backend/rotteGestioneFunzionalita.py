from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from clientMotore import (
    MotoreNonAttivoError,
    send_command,
)
from database import get_database
from models import Funzionalita, Proxy
from schemas import (
    FunzionalitaCreate,
    FunzionalitaResponse,
    FunzionalitaUpdate,
)


router = APIRouter(
    prefix="/api/funzionalita",
    tags=["Gestione funzionalità"],
)


# Codici avvio/stop squid
SQUID_STATUS_CODE = "05"
SQUID_START_CODE = "06"
SQUID_STOP_CODE = "07"
# Codici comando per Modalità Squid Moodle (aggiornare se il motore usa codici diversi)
SQUID_MOODLE_STATUS_CODE = "08"
SQUID_MOODLE_START_CODE = "09"
SQUID_MOODLE_STOP_CODE = "10"
# --- CODICI COMANDO CISCO ---
CISCO_STATUS_CODE = "11"
CISCO_START_CODE = "12"
CISCO_STOP_CODE = "13"

SQUID_STATUS_TIMEOUT = 5
SQUID_OPERATION_TIMEOUT = 45


def get_proxy_or_404(
        proxy_id: int,
        database: Session,
) -> Proxy:
    proxy = database.get(
        Proxy,
        proxy_id,
    )

    if proxy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxy non trovato",
        )

    return proxy


def send_squid_command(
        proxy: Proxy,
        code: str,
        timeout: float,
) -> str:
    try:
        return send_command(
            host=proxy.indirizzoIP,
            code=code,
            timeout=timeout,
        )

    except MotoreNonAttivoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Server funzionalità Squid "
                "non raggiungibile"
            ),
        ) from error


def create_squid_response(
        response_code: str,
):
    if response_code == "OK":
        return {
            "success": True,
            "active": True,
            "status": "OK",
            "message": "Squid attivo",
        }

    if response_code == "NOK":
        return {
            "success": True,
            "active": False,
            "status": "NOK",
            "message": "Squid non attivo",
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=(
            "Il server funzionalità Squid ha restituito "
            f"una risposta non valida: {response_code}"
        ),
    )


def create_squid_moodle_response(
        response_code: str,
):
    if response_code == "OK":
        return {
            "success": True,
            "active": True,
            "status": "OK",
            "message": "Modalità Squid Moodle attiva",
        }

    if response_code == "NOK":
        return {
            "success": True,
            "active": False,
            "status": "NOK",
            "message": "Modalità Squid Moodle non attiva",
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=(
            "Il server funzionalità Squid Moodle ha restituito "
            f"una risposta non valida: {response_code}"
        ),
    )

def create_cisco_response(response_code: str):
    if response_code == "OK":
        return {
            "success": True,
            "active": True,
            "status": "OK",
            "message": "Modalità Cisco attiva",
        }

    if response_code == "NOK":
        return {
            "success": True,
            "active": False,
            "status": "NOK",
            "message": "Modalità Cisco non attiva",
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=(
            "Il server funzionalità Cisco ha restituito "
            f"una risposta non valida: {response_code}"
        ),
    )

@router.get(
    "",
    response_model=list[FunzionalitaResponse],
)
def get_functionalities(
        database: Session = Depends(get_database),
):
    functionalities = database.scalars(
        select(Funzionalita).order_by(
            Funzionalita.codice
        )
    ).all()

    return functionalities


@router.post(
    "",
    response_model=FunzionalitaResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_functionality(
        request: FunzionalitaCreate,
        database: Session = Depends(get_database),
):
    duplicate = database.scalar(
        select(Funzionalita).where(
            Funzionalita.codice == request.codice
        )
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esiste già una funzionalità "
                "con questo codice"
            ),
        )

    functionality = Funzionalita(
        codice=request.codice,
        descrizione=request.descrizione,
    )

    database.add(functionality)
    database.commit()
    database.refresh(functionality)

    return functionality


@router.put(
    "/{functionality_id}",
    response_model=FunzionalitaResponse,
)
def update_functionality(
        functionality_id: int,
        request: FunzionalitaUpdate,
        database: Session = Depends(get_database),
):
    functionality = database.get(
        Funzionalita,
        functionality_id,
    )

    if functionality is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funzionalità non trovata",
        )

    duplicate = database.scalar(
        select(Funzionalita).where(
            Funzionalita.codice == request.codice,
            Funzionalita.id != functionality_id,
        )
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esiste già una funzionalità "
                "con questo codice"
            ),
        )

    functionality.codice = request.codice
    functionality.descrizione = request.descrizione

    database.commit()
    database.refresh(functionality)

    return functionality

@router.delete(
    "/{functionality_id}",
    status_code=status.HTTP_200_OK,
)
def delete_functionality(
        functionality_id: int,
        database: Session = Depends(get_database),
):
    functionality = database.get(
        Funzionalita,
        functionality_id,
    )

    if functionality is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funzionalità non trovata",
        )

    database.delete(functionality)
    database.commit()

    return {
        "success": True,
        "message": "Funzionalità eliminata correttamente",
    }


@router.post(
    "/{functionality_id}/proxy/{proxy_id}/avvia",
)
def start_functionality(
        functionality_id: int,
        proxy_id: int,
        database: Session = Depends(get_database),
):
    functionality = database.get(
        Funzionalita,
        functionality_id,
    )

    if functionality is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funzionalità non trovata",
        )

    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    try:
        response_code = send_command(
            host=proxy.indirizzoIP,
            code=functionality.codice,
        )

    except MotoreNonAttivoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server non attivo",
        ) from error

    if response_code != "50":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Il server ha restituito "
                f"una risposta non valida: {response_code}"
            ),
        )

    return {
        "success": True,
        "active": True,
        "message": "OK",
        "responseCode": response_code,
    }

# ******************************* Stato del servizio squid
@router.post(
    "/proxy/{proxy_id}/squid/stato",
)
def squid_status(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_STATUS_CODE,
        timeout=SQUID_STATUS_TIMEOUT,
    )

    return create_squid_response(
        response_code
    )

# ****************************** Avvio del servizio squid
@router.post(
    "/proxy/{proxy_id}/squid/avvia",
)
def squid_start(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_START_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )

    return create_squid_response(
        response_code
    )

# ****************************** Stop del servizio squid
@router.post(
    "/proxy/{proxy_id}/squid/stop",
)
def squid_stop(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_STOP_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )

    return create_squid_response(
        response_code
    )


# ------------------------------------------------------------------
# ENDPOINT PER MODALITÀ SQUID MOODLE
# ------------------------------------------------------------------

@router.post(
    "/proxy/{proxy_id}/squid-moodle/stato",
)
def squid_moodle_status(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_MOODLE_STATUS_CODE,
        timeout=SQUID_STATUS_TIMEOUT,
    )

    return create_squid_moodle_response(
        response_code
    )


@router.post(
    "/proxy/{proxy_id}/squid-moodle/avvia",
)
def squid_moodle_start(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_MOODLE_START_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )

    return create_squid_moodle_response(
        response_code
    )


@router.post(
    "/proxy/{proxy_id}/squid-moodle/stop",
)
def squid_moodle_stop(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(
        proxy_id,
        database,
    )

    response_code = send_squid_command(
        proxy=proxy,
        code=SQUID_MOODLE_STOP_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )

    return create_squid_moodle_response(
        response_code
    )
# ------------------------------------------------------------------
# ENDPOINT PER MODALITÀ CISCO
# ------------------------------------------------------------------

@router.post("/proxy/{proxy_id}/cisco/stato")
def cisco_status(
    proxy_id: int,
    database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(proxy_id, database)
    response_code = send_squid_command(
        proxy=proxy,
        code=CISCO_STATUS_CODE,
        timeout=SQUID_STATUS_TIMEOUT,
    )
    return create_cisco_response(response_code)


@router.post("/proxy/{proxy_id}/cisco/avvia")
def cisco_start(
    proxy_id: int,
    database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(proxy_id, database)
    response_code = send_squid_command(
        proxy=proxy,
        code=CISCO_START_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )
    return create_cisco_response(response_code)


@router.post("/proxy/{proxy_id}/cisco/stop")
def cisco_stop(
    proxy_id: int,
    database: Session = Depends(get_database),
):
    proxy = get_proxy_or_404(proxy_id, database)
    response_code = send_squid_command(
        proxy=proxy,
        code=CISCO_STOP_CODE,
        timeout=SQUID_OPERATION_TIMEOUT,
    )
    return create_cisco_response(response_code)