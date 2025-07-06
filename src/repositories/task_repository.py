from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_
from datetime import datetime

from src.repositories.base import BaseRepository
from src.domain.models.task import TaskModel, TaskStepModel
from src.schemas.task import TaskCreate, TaskUpdate


class TaskRepository(BaseRepository[TaskModel]):
    def __init__(self, db: Session):
        super().__init__(TaskModel, db)
        
    def create_with_steps(self, task_data: TaskCreate) -> TaskModel:
        """Create task with steps"""
        # Create task
        task_dict = task_data.model_dump(exclude={"steps"})
        task = TaskModel(**task_dict)
        self.db.add(task)
        self.db.flush()
        
        # Create steps
        for step_data in task_data.steps:
            step = TaskStepModel(
                task_id=task.id,
                **step_data.model_dump()
            )
            self.db.add(step)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_with_steps(self, task_id: UUID) -> Optional[TaskModel]:
        """Get task with all steps"""
        return self.db.query(TaskModel)\
            .options(joinedload(TaskModel.steps))\
            .filter(TaskModel.id == task_id)\
            .first()
    
    def list_tasks(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        is_completed: Optional[bool] = None,
        order_by: str = "created_at"
    ) -> List[TaskModel]:
        """List tasks with filters"""
        query = self.db.query(TaskModel).options(joinedload(TaskModel.steps))
        
        # Apply filters
        filters = []
        if category:
            filters.append(TaskModel.category == category)
        if priority:
            filters.append(TaskModel.priority == priority)
        if is_completed is not None:
            filters.append(TaskModel.is_completed == is_completed)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Apply ordering
        if order_by == "created_at":
            query = query.order_by(desc(TaskModel.created_at))
        elif order_by == "priority":
            # Custom priority ordering
            query = query.order_by(
                TaskModel.priority.desc(),
                desc(TaskModel.created_at)
            )
        
        return query.offset(skip).limit(limit).all()
    
    def update_task(self, task_id: UUID, update_data: TaskUpdate) -> Optional[TaskModel]:
        """Update task"""
        task = self.get_with_steps(task_id)
        if not task:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Handle completion
        if "is_completed" in update_dict and update_dict["is_completed"]:
            update_dict["completed_at"] = datetime.utcnow()
        
        for field, value in update_dict.items():
            setattr(task, field, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def update_step_completion(self, step_id: UUID, is_completed: bool) -> bool:
        """Update step completion status"""
        step = self.db.query(TaskStepModel).filter(TaskStepModel.id == step_id).first()
        if not step:
            return False
        
        step.is_completed = is_completed
        
        # Check if all steps are completed
        task = step.task
        all_completed = all(s.is_completed for s in task.steps)
        if all_completed and not task.is_completed:
            task.is_completed = True
            task.completed_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def count_tasks(
        self,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        is_completed: Optional[bool] = None
    ) -> int:
        """Count tasks with filters"""
        query = self.db.query(TaskModel)
        
        filters = []
        if category:
            filters.append(TaskModel.category == category)
        if priority:
            filters.append(TaskModel.priority == priority)
        if is_completed is not None:
            filters.append(TaskModel.is_completed == is_completed)
        
        if filters:
            query = query.filter(and_(*filters))
        
        return query.count()