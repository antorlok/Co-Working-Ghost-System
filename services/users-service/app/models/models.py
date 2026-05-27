from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, nullable=False)
    email: str = Field(
        max_length=255,
        index=True,
        sa_column_kwargs={"unique": True, "nullable": False},
    )
    password_hash: str = Field(max_length=255, nullable=False)
    role: str = Field(default="member", max_length=50, nullable=False)