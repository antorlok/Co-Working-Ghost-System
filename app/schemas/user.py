import re
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

class UserBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50, description="User full name")
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=64,
        description="8-64 chars, incluye mayuscula, minuscula, numero y simbolo",
    )

    @field_validator("password")
    def validate_password(cls, v):
        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$", v):
            raise ValueError("Password must contain uppercase, lowercase, digit, and symbol")
        return v

class UserResponse(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
        

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=64,
        description="8-64 chars, incluye mayuscula, minuscula, numero y simbolo",
    )

    @field_validator("password")
    def validate_password(cls, v):
        if v is not None and not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$", v):
            raise ValueError("Password must contain uppercase, lowercase, digit, and symbol")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str