from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class BaseLLMClient(ABC):
    """Base class for LLM clients"""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate text completion"""
        pass
    
    @abstractmethod
    async def generate_embedding(
        self,
        text: str,
        **kwargs
    ) -> List[float]:
        """Generate text embedding"""
        pass