# src/ai_providers/together_client.py
"""
Together AI client with OpenAI and Claude fallbacks
90%+ cost reduction with 85-90% quality retention using serverless Llama-3.1-Turbo models
Uses Claude Sonnet for superior performance in fallback scenarios

Model Strategy:
- Primary: Together AI serverless Llama-3.1-Turbo (high quality, low cost, instant availability)
- Secondary: OpenAI (reliable, high quality)
- Tertiary: Claude Sonnet (superior quality for critical tasks)
"""

from together import Together
from openai import OpenAI
from anthropic import Anthropic
from typing import Dict, Any, List, Union
import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class AIResponse:
    content: str
    model: str
    usage: Dict[str, int]
    provider: str
    cost_estimate: float

class AIClient:
    """
    Unified AI client with Together AI primary, OpenAI secondary, Claude Sonnet tertiary
    Drop-in replacement for your existing OpenAI calls with triple redundancy
    """
    
    def __init__(self):
        self.together_key = os.getenv("TOGETHER_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        
        # Initialize clients
        if self.together_key:
            self.togetherai = Together(api_key=self.together_key)
            self.together_available = True
        else:
            logger.warning("Together AI key not found")
            self.together_available = False
            
        if self.openai_key:
            self.openai = OpenAI(api_key=self.openai_key)
            self.openai_available = True
        else:
            logger.warning("OpenAI key not found")
            self.openai_available = False
            
        if self.anthropic_key:
            self.anthropic_client = Anthropic(api_key=self.anthropic_key)
            self.claude_available = True
        else:
            logger.warning("Anthropic key not found")
            self.claude_available = False
        
        # Model mapping: SERVERLESS Together AI models (Turbo = serverless)
        self.model_mapping = {
            # Chat models - Using serverless Llama-3.1-Turbo models (higher quality than Llama-3)
            "gpt-4": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",  # Serverless, ~90% GPT-4 quality
            "gpt-4-turbo": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",  # Serverless, best available
            "gpt-3.5-turbo": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  # Serverless, ~85% GPT-3.5 quality

            # Completion models - Using serverless models
            "text-davinci-003": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            "text-curie-001": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",

            # Embedding models
            "text-embedding-ada-002": "sentence-transformers/all-MiniLM-L6-v2",
        }
        
        # Claude model mapping - using Sonnet for better performance
        self.claude_mapping = {
            "gpt-4": "claude-3-5-sonnet-20241022",
            "gpt-4-turbo": "claude-3-5-sonnet-20241022",
            "gpt-3.5-turbo": "claude-3-5-sonnet-20241022",  # Upgraded to Sonnet
            "text-davinci-003": "claude-3-5-sonnet-20241022",
            "text-curie-001": "claude-3-5-sonnet-20241022",  # Upgraded to Sonnet
        }
        
        # Cost estimates (per 1K tokens) - Updated for Llama-3.1-Turbo serverless models
        self.together_costs = {
            # Llama 3.1 Turbo (serverless)
            "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": 0.00088,  # vs GPT-4: $0.03 (~97% savings)
            "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": 0.00018,   # vs GPT-3.5: $0.002 (~91% savings)
            "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": 0.00270, # Premium serverless option

            # Legacy models (non-serverless, kept for reference)
            "meta-llama/Llama-3-70b-chat-hf": 0.0009,
            "meta-llama/Llama-3-8b-chat-hf": 0.0002,
            "mistralai/Mixtral-8x7B-Instruct-v0.1": 0.0006,
            "meta-llama/Llama-2-70b-chat-hf": 0.0009,
            "meta-llama/Llama-2-13b-chat-hf": 0.0003,
        }
        
        # Claude pricing (per 1K tokens)
        self.claude_costs = {
            "claude-3-5-sonnet-20241022": {
                "input": 0.003,
                "output": 0.015
            },
            "claude-3-haiku-20240307": {
                "input": 0.00025,
                "output": 0.00125
            },
            "claude-3-opus-20240229": {
                "input": 0.015,
                "output": 0.075
            }
        }
        
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "gpt-4.1-nano", #"gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        use_primary_only=False,
        **kwargs
    ) -> AIResponse:
        """
        Chat completion with Together AI primary, OpenAI secondary, Claude Sonnet tertiary
        """
        
        # Try Together AI first
        if self.together_available and not use_primary_only:
            try:
                together_model = self.model_mapping.get(model, "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo")
                
                # Convert messages to Together AI format
                # prompt = self._messages_to_prompt(messages)
                
                response = self.togetherai.chat.completions.create(
                    model=together_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )
                
                content = response.choices[0].message.content
                usage = getattr(response, 'usage', {})
                cost = self._calculate_together_cost(together_model, usage)
                
                logger.info(f"✅ Together AI success: {together_model} - ${cost:.4f}")
                
                return AIResponse(
                    content=content,
                    model=together_model,
                    usage=usage,
                    provider="together",
                    cost_estimate=cost
                )
                
            except Exception as e:
                logger.warning(f"Together AI failed: {e}, falling back to OpenAI")
        
        # Fallback to OpenAI
        if self.openai_available:
            try:
                response = self.openai.responses.create(
                    model=model,
                    input=messages,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    **kwargs
                )
                
                # content = response.choices[0].message.content
                content = response.output[0].content[0].text
                # usage = response.usage.model_dump() if response.usage else {}
                # cost = self._calculate_openai_cost(model, usage)
                
                # logger.info(f"🔄 OpenAI fallback: {model} - ${cost:.4f}")
                
                return AIResponse(
                    content=content,
                    model=model,
                    usage={},
                    provider="openai",
                    cost_estimate=0
                )
                
            except Exception as e:
                logger.warning(f"OpenAI also failed: {e}, falling back to Claude")
        
        # Final fallback to Claude
        if self.claude_available:
            try:
                claude_model = self.claude_mapping.get(model, "claude-3-5-sonnet-20241022")
                
                # Convert messages to Claude format
                claude_messages = self._messages_to_claude_format(messages)
                system_message = self._extract_system_message(messages)
                
                response = self.anthropic_client.messages.create(
                    model=claude_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_message,
                    messages=claude_messages
                )
                
                content = response.content[0].text
                usage = {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                }
                cost = self._calculate_claude_cost(claude_model, response.usage.input_tokens, response.usage.output_tokens)
                
                logger.info(f"🆘 Claude fallback: {claude_model} - ${cost:.4f}")
                
                return AIResponse(
                    content=content,
                    model=claude_model,
                    usage=usage,
                    provider="claude",
                    cost_estimate=cost
                )
                
            except Exception as e:
                logger.error(f"Claude also failed: {e}")
                raise
        
        raise Exception("No AI providers available")
    
    def completion(
        self,
        prompt: str,
        model: str = "text-davinci-003", 
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> AIResponse:
        """
        Text completion with Together AI primary, OpenAI secondary, Claude tertiary
        """
        
        # Try Together AI first
        if self.together_available:
            try:
                together_model = self.model_mapping.get(model, "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo")
                
                response = self.togetherai.completions.create(
                    prompt=prompt,
                    model=together_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )
                
                content = response.choices[0].text
                usage = response.get('usage', {})
                cost = self._calculate_together_cost(together_model, usage)
                
                return AIResponse(
                    content=content,
                    model=together_model,
                    usage=usage,
                    provider="together",
                    cost_estimate=cost
                )
                
            except Exception as e:
                logger.warning(f"Together AI completion failed: {e}")
        
        # OpenAI fallback
        if self.openai_available:
            try:
                response = self.openai.completions.create(
                    model=model,
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                )
                
                content = response.choices[0].text
                usage = response.usage.model_dump() if response.usage else {}
                cost = self._calculate_openai_cost(model, usage)
                
                return AIResponse(
                    content=content,
                    model=model,
                    usage=usage,
                    provider="openai",
                    cost_estimate=cost
                )
                
            except Exception as e:
                logger.warning(f"OpenAI completion failed: {e}, falling back to Claude")
        
        # Claude fallback - convert completion to chat format
        if self.claude_available:
            try:
                claude_model = self.claude_mapping.get(model, "claude-3-5-sonnet-20241022")
                
                # Convert completion prompt to chat message
                messages = [{"role": "user", "content": prompt}]
                
                response = self.anthropic_client.messages.create(
                    model=claude_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    messages=messages
                )
                
                content = response.content[0].text
                usage = {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                }
                cost = self._calculate_claude_cost(claude_model, response.usage.input_tokens, response.usage.output_tokens)
                
                return AIResponse(
                    content=content,
                    model=claude_model,
                    usage=usage,
                    provider="claude",
                    cost_estimate=cost
                )
                
            except Exception as e:
                logger.error(f"Claude completion failed: {e}")
                raise
        
        raise Exception("No AI providers available")
    
    def embedding(self, text: Union[str, List[str]], model: str = "text-embedding-ada-002") -> Dict[str, Any]:
        """
        Generate embeddings - fallback to OpenAI for now
        Together AI embeddings coming soon, Claude doesn't offer embeddings
        """
        if self.openai_available:
            response = self.openai.embeddings.create(
                model=model,
                input=text
            )
            return {
                "embeddings": [d.embedding for d in response.data],
                "model": model,
                "usage": response.usage.model_dump()
            }
        else:
            raise Exception("Embeddings require OpenAI API key")
    
    def _messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI chat messages to Together AI prompt format"""
        prompt_parts = []
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"Human: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant:")
        return "\n\n".join(prompt_parts)
    
    def _messages_to_claude_format(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Convert OpenAI messages to Claude format (exclude system messages)"""
        claude_messages = []
        
        for message in messages:
            if message["role"] != "system":  # System messages handled separately
                claude_messages.append({
                    "role": message["role"],
                    "content": message["content"]
                })
        
        return claude_messages
    
    def _extract_system_message(self, messages: List[Dict[str, str]]) -> str:
        """Extract system message content for Claude"""
        system_messages = [msg["content"] for msg in messages if msg["role"] == "system"]
        return "\n\n".join(system_messages) if system_messages else ""
    
    def _calculate_together_cost(self, model: str, usage: Dict[str, Any]) -> float:
        """Calculate Together AI cost"""
        rate = self.together_costs.get(model, 0.00018)  # Default to Llama-3.1-8B-Turbo rate
        total_tokens = getattr(usage, 'total_tokens', 0)
        return (total_tokens / 1000) * rate
    
    def _calculate_openai_cost(self, model: str, usage: Dict[str, Any]) -> float:
        """Calculate OpenAI cost"""
        # OpenAI pricing (approximate)
        rates = {
            "gpt-4": 0.03,
            "gpt-4-turbo": 0.01,
            "gpt-3.5-turbo": 0.002,
            "text-davinci-003": 0.02,
            "gpt-4.1-nano": 0.01
        }
        rate = rates.get(model, 0.002)
        total_tokens = usage.get("total_tokens", 0)
        return (total_tokens / 1000) * rate
    
    def _calculate_claude_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate Claude cost"""
        pricing = self.claude_costs.get(model, self.claude_costs["claude-3-5-sonnet-20241022"])
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        return input_cost + output_cost

# Global client instance
ai_client = AIClient()

# Convenience functions for easy migration
def chat_completion(*args, **kwargs):
    """Drop-in replacement for openai.chat.completions.create()"""
    return ai_client.chat_completion(*args, **kwargs)

def completion(*args, **kwargs):
    """Drop-in replacement for openai.completions.create()"""
    return ai_client.completion(*args, **kwargs)

def embedding(*args, **kwargs):
    """Drop-in replacement for openai.embeddings.create()"""
    return ai_client.embedding(*args, **kwargs)