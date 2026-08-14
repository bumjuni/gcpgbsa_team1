from typing import Optional

from pydantic import BaseModel, Field
from .base import ORMBaseModel


class StudentCreate(BaseModel):
    name: str = Field(..., max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    birth_year: Optional[int] = None
