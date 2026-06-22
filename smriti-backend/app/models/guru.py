from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid


class GuruMessage(BaseModel):
    role: Literal["system", "interviewer", "expert"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    embedded: bool = False
    item_id: Optional[str] = None


class GuruSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    expert_name: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    messages: list[GuruMessage] = []
    questions_asked: int = 0
    knowledge_added: int = 0
    initial_debt_score: int = 0
    current_debt_score: int = 0
    status: Literal["active", "completed", "abandoned"] = "active"


class GuruStartRequest(BaseModel):
    asset_id: str
    expert_name: str


class GuruRespondRequest(BaseModel):
    session_id: str
    answer: str
