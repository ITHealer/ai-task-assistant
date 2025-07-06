import httpx
import json
from typing import Dict, Any, Optional, List
from src.infrastructure.llm.base_client import BaseLLMClient
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class OllamaClient(BaseLLMClient):
    """Ollama LLM client for local models"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama2"  # or mistral, phi, etc.
    
    async def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """Generate text using Ollama"""
        try:
            # Build the prompt
            full_prompt = ""
            if system_message:
                full_prompt = f"System: {system_message}\n\n"
            full_prompt += f"User: {prompt}\n\nAssistant:"
            
            # If JSON response is required, add instruction
            if response_format and response_format.get("type") == "json_object":
                full_prompt += "\n\nPlease respond with valid JSON only."
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "temperature": temperature or 0.3,
                        "stream": False
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["response"]
                else:
                    raise Exception(f"Ollama error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ollama API error: {str(e)}")
            raise
    
    async def generate_embedding(
        self,
        text: str,
        **kwargs
    ) -> List[float]:
        """Generate embeddings using Ollama"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.model,
                        "prompt": text
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["embedding"]
                else:
                    raise Exception(f"Ollama error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ollama Embedding API error: {str(e)}")
            raise