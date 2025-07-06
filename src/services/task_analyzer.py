from typing import Dict, List, Optional
import json
from src.schemas.task import TaskCreate, TaskStepCreate, TextInput
from src.infrastructure.llm.providers.openai_client import OpenAIClient
from src.core.logging import get_logger

logger = get_logger(__name__)


class TaskAnalyzerService:
    def __init__(self):
        self.llm_client = OpenAIClient()
        
    async def analyze_text(self, text_input: TextInput) -> TaskCreate:
        """
        Analyze text and extract task information using LLM
        """
        prompt = self._build_analysis_prompt(text_input.text, text_input.context)
        
        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                system_message=self._get_system_message(),
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Parse LLM response
            task_data = json.loads(response)
            
            # Create TaskCreate object
            steps = [
                TaskStepCreate(
                    description=step["description"],
                    order_index=idx
                )
                for idx, step in enumerate(task_data.get("steps", []))
            ]
            
            return TaskCreate(
                title=task_data["title"],
                description=task_data["description"],
                priority=task_data.get("priority", "medium"),
                category=task_data.get("category", "general"),
                source_text=text_input.text,
                steps=steps
            )
            
        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            # Fallback to simple task creation
            return self._create_fallback_task(text_input.text)
    
    def _get_system_message(self) -> str:
        return """You are a task extraction specialist. Analyze the given text and extract actionable tasks.
        
        Return a JSON object with the following structure:
        {
            "title": "Short, clear task title (max 50 chars)",
            "description": "Detailed description of what needs to be done",
            "priority": "high|medium|low (based on urgency indicators in text)",
            "category": "work|personal|meeting|research|general",
            "steps": [
                {"description": "Step 1 description"},
                {"description": "Step 2 description"}
            ]
        }
        
        Guidelines:
        - Extract clear, actionable tasks from conversational text
        - Break down complex tasks into steps
        - Infer priority from keywords like "urgent", "ASAP", "when you can"
        - Categorize based on context clues
        - Keep titles concise and action-oriented
        - Each step should be independently actionable
        """
    
    def _build_analysis_prompt(self, text: str, context: Optional[str]) -> str:
        prompt = f"Extract actionable tasks from this text:\n\n{text}"
        if context:
            prompt += f"\n\nAdditional context: {context}"
        return prompt
    
    def _create_fallback_task(self, text: str) -> TaskCreate:
        """Create a simple task when LLM analysis fails"""
        title = text[:50] + "..." if len(text) > 50 else text
        return TaskCreate(
            title=title,
            description=text,
            priority="medium",
            category="general",
            source_text=text,
            steps=[]
        )