from ipaddress import IPv4Address, IPv4Network

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class ProxyBase(BaseModel):
    codiceProxy: str = Field(
        min_length=1,
        max_length=50,
    )

    descrizione: str = Field(
        min_length=1,
        max_length=80,
    )

    indirizzoIP: str = Field(
        min_length=7,
        max_length=15,
    )

    subnetMask: str = Field(
        min_length=7,
        max_length=15,
    )

    @field_validator("indirizzoIP")
    @classmethod
    def validate_indirizzo_ip(cls, value: str) -> str:
        try:
            IPv4Address(value)
        except ValueError as error:
            raise ValueError(
                "L'indirizzo IP non è valido"
            ) from error

        return value

    @field_validator("subnetMask")
    @classmethod
    def validate_subnet_mask(cls, value: str) -> str:
        try:
            IPv4Network(
                f"0.0.0.0/{value}"
            )
        except ValueError as error:
            raise ValueError(
                "La subnet mask non è valida"
            ) from error

        return value


class ProxyCreate(ProxyBase):
    pass


class ProxyUpdate(ProxyBase):
    pass


class ProxyResponse(ProxyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int