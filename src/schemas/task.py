from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from uuid import UUID
import uuid


class TextInput(BaseModel):
    text: str
    context: Optional[str] = None


class TaskStepBase(BaseModel):
    description: str
    order_index: int = 0
    is_completed: bool = False


class TaskStepCreate(TaskStepBase):
    pass


class TaskStepUpdate(BaseModel):
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class TaskStep(TaskStepBase):
    id: UUID
    
    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: str = "general"
    source_text: str


class TaskCreate(TaskBase):
    steps: List[TaskStepCreate] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None


class Task(TaskBase):
    id: UUID
    steps: List[TaskStep] = []
    is_completed: bool = False
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    task: Task
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TaskListResponse(BaseModel):
    tasks: List[Task]
    total: int
    page: int
    page_size: int