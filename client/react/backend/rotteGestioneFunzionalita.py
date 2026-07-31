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

    proxy = database.get(
        Proxy,
        proxy_id,
    )

    if proxy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxy non trovato",
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