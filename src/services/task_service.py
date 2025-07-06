from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from src.repositories.task_repository import TaskRepository
from src.services.task_analyzer import TaskAnalyzerService
from src.domain.models.task import TaskModel, TaskStepModel
from src.schemas.task import (
    Task, TaskCreate, TaskUpdate, TextInput, 
    TaskResponse, TaskListResponse
)
from src.core.logging import get_logger

logger = get_logger(__name__)


class TaskService:
    def __init__(self, db: Session):
        self.repository = TaskRepository(db)
        self.analyzer = TaskAnalyzerService()
    
    async def create_task_from_text(self, text_input: TextInput) -> TaskResponse:
        """Create task from text analysis"""
        try:
            # Analyze text with LLM
            task_data = await self.analyzer.analyze_text(text_input)
            
            # Save to database
            task_model = self.repository.create_with_steps(task_data)
            
            # Convert to response
            task = Task.from_orm(task_model)
            
            return TaskResponse(
                task=task,
                confidence=0.95  # Could be calculated based on LLM response
            )
        except Exception as e:
            logger.error(f"Error creating task from text: {str(e)}")
            raise
    
    def create_task(self, task_data: TaskCreate) -> Task:
        """Create task directly"""
        task_model = self.repository.create_with_steps(task_data)
        return Task.from_orm(task_model)
    
    def get_task(self, task_id: UUID) -> Optional[Task]:
        """Get single task"""
        task_model = self.repository.get_with_steps(task_id)
        if task_model:
            return Task.from_orm(task_model)
        return None
    
    def list_tasks(
        self,
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        is_completed: Optional[bool] = None,
        order_by: str = "created_at"
    ) -> TaskListResponse:
        """List tasks with pagination and filters"""
        skip = (page - 1) * page_size
        
        tasks = self.repository.list_tasks(
            skip=skip,
            limit=page_size,
            category=category,
            priority=priority,
            is_completed=is_completed,
            order_by=order_by
        )
        
        total = self.repository.count_tasks(
            category=category,
            priority=priority,
            is_completed=is_completed
        )
        
        return TaskListResponse(
            tasks=[Task.from_orm(t) for t in tasks],
            total=total,
            page=page,
            page_size=page_size
        )
    
    def update_task(self, task_id: UUID, update_data: TaskUpdate) -> Optional[Task]:
        """Update task"""
        task_model = self.repository.update_task(task_id, update_data)
        if task_model:
            return Task.from_orm(task_model)
        return None
    
    def toggle_step_completion(self, step_id: UUID) -> bool:
        """Toggle step completion status"""
        # Get current step status
        step = self.repository.db.query(TaskStepModel)\
            .filter(TaskStepModel.id == step_id).first()
        
        if not step:
            return False
        
        # Toggle completion
        return self.repository.update_step_completion(
            step_id, 
            not step.is_completed
        )
    
    def delete_task(self, task_id: UUID) -> bool:
        """Delete task"""
        return self.repository.delete(task_id)