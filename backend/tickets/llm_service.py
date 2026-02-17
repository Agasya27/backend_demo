import json
import logging
import os
import re
from django.conf import settings

logger = logging.getLogger(__name__)


class LLMService:
    SYSTEM_PROMPT = """You are a support ticket classifier. Analyze the ticket description and return ONLY a JSON object with two fields:
- "category": one of ["billing", "technical", "account", "general"]
- "priority": one of ["low", "medium", "high", "critical"]

Rules:
- billing: payment issues, invoices, refunds, pricing questions
- technical: bugs, errors, performance issues, feature problems
- account: login, password, profile, permissions, access issues
- general: questions, feedback, other topics

- critical: system down, data loss, security breach, complete service failure
- high: major feature broken, significant business impact, many users affected
- medium: feature partially working, moderate impact, workaround exists
- low: minor issue, cosmetic problem, feature request, general question

Return ONLY valid JSON, no other text."""

    USER_PROMPT_TEMPLATE = """Classify this support ticket:

Description: {description}

Return only JSON with category and priority."""

    @staticmethod
    def classify_ticket(description: str) -> dict:
        """
        Classify ticket using configured LLM provider.
        Returns dict with suggested_category and suggested_priority.
        Falls back to safe defaults on any error.
        """
        provider = settings.LLM_PROVIDER.lower()
        api_key = LLMService._resolve_api_key(provider)

        logger.info(f"classify_ticket called: provider={provider}, has_api_key={bool(api_key)}")

        if not api_key:
            logger.warning("No API key configured for provider '%s', using defaults", provider)
            return LLMService._get_defaults()

        try:
            if provider == 'openai':
                return LLMService._classify_openai(description, api_key)
            elif provider == 'openrouter':
                logger.info("Calling _classify_openrouter")
                return LLMService._classify_openrouter(description, api_key)
            elif provider == 'anthropic':
                return LLMService._classify_anthropic(description, api_key)
            elif provider == 'gemini':
                return LLMService._classify_gemini(description, api_key)
            else:
                logger.error(f"Unknown LLM provider: {provider}")
                return LLMService._get_defaults()
        except Exception as e:
            logger.error(f"LLM classification failed: {str(e)}")
            return LLMService._get_defaults()
    
    @staticmethod
    def _classify_openai(description: str, api_key: str) -> dict:
        import openai

        model = getattr(settings, 'OPENAI_MODEL', os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'))
        client = openai.OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": LLMService.SYSTEM_PROMPT},
                {"role": "user", "content": LLMService.USER_PROMPT_TEMPLATE.format(description=description)}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        content = response.choices[0].message.content.strip()
        return LLMService._parse_response(content)
    
    @staticmethod
    def _classify_openrouter(description: str, api_key: str) -> dict:
        """
        Classify using OpenRouter API (compatible with OpenAI format).
        Uses meta-llama/llama-3.1-8b-instruct:free by default (free tier).
        You can change the model by setting OPENROUTER_MODEL env var.
        """
        import requests
        from django.conf import settings
        
        # Get model from settings, default to free tier model
        model = getattr(settings, 'OPENROUTER_MODEL', 'meta-llama/llama-3.1-8b-instruct:free')
        
        logger.info(f"Calling OpenRouter API with model: {model}")
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": LLMService.SYSTEM_PROMPT},
                {"role": "user", "content": LLMService.USER_PROMPT_TEMPLATE.format(description=description)}
            ],
            "temperature": 0.3,
            "max_tokens": 100,
        }
        
        logger.info(f"Making OpenRouter request to {url}")
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"OpenRouter response received: {result.get('id', 'no-id')}")
        content = result['choices'][0]['message']['content'].strip()
        return LLMService._parse_response(content)
    
    @staticmethod
    def _classify_anthropic(description: str, api_key: str) -> dict:
        import anthropic

        model = getattr(
            settings,
            'ANTHROPIC_MODEL',
            os.environ.get('ANTHROPIC_MODEL', 'claude-3-5-haiku-latest')
        )
        client = anthropic.Anthropic(api_key=api_key)

        response = client.messages.create(
            model=model,
            max_tokens=100,
            temperature=0.3,
            system=LLMService.SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": LLMService.USER_PROMPT_TEMPLATE.format(description=description)}
            ]
        )
        
        content = response.content[0].text.strip()
        return LLMService._parse_response(content)
    
    @staticmethod
    def _classify_gemini(description: str, api_key: str) -> dict:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model_name = getattr(settings, 'GEMINI_MODEL', os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash'))
        model = genai.GenerativeModel(model_name)

        prompt = f"{LLMService.SYSTEM_PROMPT}\n\n{LLMService.USER_PROMPT_TEMPLATE.format(description=description)}"

        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.3,
                    'max_output_tokens': 100,
                }
            )
        except Exception:
            fallback_model = genai.GenerativeModel('gemini-pro')
            response = fallback_model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.3,
                    'max_output_tokens': 100,
                }
            )

        content = response.text.strip()
        return LLMService._parse_response(content)
    
    @staticmethod
    def _parse_response(content: str) -> dict:
        """Parse LLM response and validate fields."""
        try:
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()

            if not content.startswith('{'):
                content = LLMService._extract_json(content)

            data = json.loads(content)
            
            category = data.get('category', '').lower()
            priority = data.get('priority', '').lower()
            
            valid_categories = ['billing', 'technical', 'account', 'general']
            valid_priorities = ['low', 'medium', 'high', 'critical']
            
            if category not in valid_categories:
                logger.warning(f"Invalid category from LLM: {category}")
                category = 'general'
            
            if priority not in valid_priorities:
                logger.warning(f"Invalid priority from LLM: {priority}")
                priority = 'medium'
            
            return {
                'suggested_category': category,
                'suggested_priority': priority
            }
        except (json.JSONDecodeError, KeyError, AttributeError) as e:
            logger.error(f"Failed to parse LLM response: {str(e)}, content: {content}")
            return LLMService._get_defaults()

    @staticmethod
    def _extract_json(content: str) -> str:
        """Extract first JSON object from model text response."""
        match = re.search(r'\{.*\}', content, flags=re.DOTALL)
        if not match:
            raise json.JSONDecodeError("No JSON object found", content, 0)
        return match.group(0)

    @staticmethod
    def _resolve_api_key(provider: str) -> str:
        """Resolve provider-specific key, with LLM_API_KEY fallback."""
        fallback_key = getattr(settings, 'LLM_API_KEY', '') or os.environ.get('LLM_API_KEY', '')
        key_map = {
            'openai': getattr(settings, 'OPENAI_API_KEY', '') or os.environ.get('OPENAI_API_KEY', ''),
            'openrouter': getattr(settings, 'OPENROUTER_API_KEY', '') or os.environ.get('OPENROUTER_API_KEY', ''),
            'anthropic': getattr(settings, 'ANTHROPIC_API_KEY', '') or os.environ.get('ANTHROPIC_API_KEY', ''),
            'gemini': (
                getattr(settings, 'GOOGLE_API_KEY', '')
                or os.environ.get('GOOGLE_API_KEY', '')
                or os.environ.get('GEMINI_API_KEY', '')
            ),
        }
        return key_map.get(provider) or fallback_key
    
    @staticmethod
    def _get_defaults() -> dict:
        """Return safe default classification."""
        return {
            'suggested_category': 'general',
            'suggested_priority': 'medium'
        }
