from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_database
from models import Proxy
from schemas import ProxyCreate, ProxyResponse, ProxyUpdate


router = APIRouter(
    prefix="/api/proxy",
    tags=["Gestione proxy"],
)


@router.get(
    "",
    response_model=list[ProxyResponse],
)
def get_proxies(
        database: Session = Depends(get_database),
):
    proxies = database.scalars(
        select(Proxy).order_by(Proxy.codiceProxy)
    ).all()

    return proxies


@router.post(
    "",
    response_model=ProxyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_proxy(
        request: ProxyCreate,
        database: Session = Depends(get_database),
):
    existing_proxy = database.scalar(
        select(Proxy).where(
            Proxy.codiceProxy == request.codiceProxy
        )
    )

    if existing_proxy is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esiste già un proxy con questo codice",
        )

    proxy = Proxy(
        codiceProxy=request.codiceProxy,
        descrizione=request.descrizione,
        indirizzoIP=request.indirizzoIP,
        subnetMask=request.subnetMask,
    )

    database.add(proxy)
    database.commit()
    database.refresh(proxy)

    return proxy


@router.put(
    "/{proxy_id}",
    response_model=ProxyResponse,
)
def update_proxy(
        proxy_id: int,
        request: ProxyUpdate,
        database: Session = Depends(get_database),
):
    proxy = database.get(Proxy, proxy_id)

    if proxy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxy non trovato",
        )

    proxy_with_same_code = database.scalar(
        select(Proxy).where(
            Proxy.codiceProxy == request.codiceProxy,
            Proxy.id != proxy_id,
            )
    )

    if proxy_with_same_code is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esiste già un proxy con questo codice",
        )

    proxy.codiceProxy = request.codiceProxy
    proxy.descrizione = request.descrizione
    proxy.indirizzoIP = request.indirizzoIP
    proxy.subnetMask = request.subnetMask

    database.commit()
    database.refresh(proxy)

    return proxy


@router.delete(
    "/{proxy_id}",
    status_code=status.HTTP_200_OK,
)
def delete_proxy(
        proxy_id: int,
        database: Session = Depends(get_database),
):
    proxy = database.get(Proxy, proxy_id)

    if proxy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxy non trovato",
        )

    database.delete(proxy)
    database.commit()

    return {
        "success": True,
        "message": "Proxy eliminato correttamente",
    }