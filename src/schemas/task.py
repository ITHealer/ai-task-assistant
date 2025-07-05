from datetime import datetime
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

# Schema
class TextInput(BaseModel):
    text: str
    context: Optional[str] = None

class TaskStep(BaseModel):
    id: str
    descriptions: str
    isCompleted: bool = False

class Task(BaseModel):
    id: str
    title: str
    description: str
    steps: List[TaskStep]
    priority: str = "medium"  # high, medium, low
    category: str = "general"
    createdAt: datetime
    completedAt: Optional[datetime] = None
    isCompleted: bool = False
    sourceText: str

class TaskResponse(BaseModel):
    task: Task
    confidence: float