from typing import Dict, List, Optional
import json
from openai import OpenAI, RateLimitError, APIError
from src.schemas.task import TaskCreate, TaskStepCreate, TextInput
from src.infrastructure.llm.providers.openai_client import OpenAIClient
from src.core.logging import get_logger
from src.core.exceptions import AppException

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
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit error: {str(e)}")
            # Use fallback when rate limited
            logger.info("Using fallback task creation due to rate limit")
            return self._create_fallback_task(text_input.text)
            
        except APIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            if "insufficient_quota" in str(e):
                raise AppException(
                    message="OpenAI API quota exceeded. Please check your billing.",
                    error_code="OPENAI_QUOTA_EXCEEDED",
                    status_code=503
                )
            return self._create_fallback_task(text_input.text)
            
        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
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
        """
    
    def _build_analysis_prompt(self, text: str, context: Optional[str]) -> str:
        prompt = f"Extract actionable tasks from this text:\n\n{text}"
        if context:
            prompt += f"\n\nAdditional context: {context}"
        return prompt
    
    def _create_fallback_task(self, text: str) -> TaskCreate:
        """Create a simple task when LLM analysis fails"""
        # Smart fallback - try to extract meaningful title
        lines = text.strip().split('\n')
        first_line = lines[0] if lines else text
        
        # Truncate for title
        title = first_line[:50]
        if len(first_line) > 50:
            title = first_line[:47] + "..."
        
        # Try to identify priority from keywords
        priority = "medium"
        urgent_keywords = ["urgent", "asap", "immediately", "critical", "important"]
        if any(keyword in text.lower() for keyword in urgent_keywords):
            priority = "high"
        
        # Try to categorize
        category = "general"
        if any(word in text.lower() for word in ["meeting", "call", "discuss"]):
            category = "meeting"
        elif any(word in text.lower() for word in ["review", "analyze", "report"]):
            category = "work"
        
        return TaskCreate(
            title=title,
            description=text,
            priority=priority,
            category=category,
            source_text=text,
            steps=[
                TaskStepCreate(
                    description="Review and complete this task",
                    order_index=0
                )
            ]
        )