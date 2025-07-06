from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.api.v1.deps import get_db
from src.services.task_service import TaskService
from src.schemas.task import (
    Task, TaskCreate, TaskUpdate, TextInput,
    TaskResponse, TaskListResponse
)

router = APIRouter()


@router.post("/analyze", response_model=TaskResponse)
async def analyze_text_to_task(
    text_input: TextInput,
    db: Session = Depends(get_db)
):
    """
    Analyze text and create a structured task
    """
    service = TaskService(db)
    try:
        return await service.create_task_from_text(text_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Task)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task directly
    """
    service = TaskService(db)
    return service.create_task(task_data)


@router.get("/", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = None,
    priority: Optional[str] = None,
    is_completed: Optional[bool] = None,
    order_by: str = Query(default="created_at", regex="^(created_at|priority)$"),
    db: Session = Depends(get_db)
):
    """
    List tasks with pagination and filters
    """
    service = TaskService(db)
    return service.list_tasks(
        page=page,
        page_size=page_size,
        category=category,
        priority=priority,
        is_completed=is_completed,
        order_by=order_by
    )


@router.get("/{task_id}", response_model=Task)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific task
    """
    service = TaskService(db)
    task = service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=Task)
def update_task(
    task_id: UUID,
    update_data: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a task
    """
    service = TaskService(db)
    task = service.update_task(task_id, update_data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/steps/{step_id}/toggle-completion")
def toggle_step_completion(
    step_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Toggle step completion status
    """
    service = TaskService(db)
    success = service.toggle_step_completion(step_id)
    if not success:
        raise HTTPException(status_code=404, detail="Step not found")
    return {"success": True}


@router.delete("/{task_id}")
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a task
    """
    service = TaskService(db)
    success = service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True}