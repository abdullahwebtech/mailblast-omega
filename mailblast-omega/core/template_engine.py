import re
import random
from jinja2 import Environment, BaseLoader

def process_spintax(text: str) -> str:
    """
    Processes {option1|option2|option3} spintax.
    Example: "Hi {there|friend|{FirstName}}!" → "Hi there!" (random pick)
    Supports nested spintax.
    """
    def spin(match):
        options = match.group(1).split("|")
        return random.choice(options)
    
    # Process inner-most first (repeat until no more spintax)
    while re.search(r'\{([^{}]+\|[^{}]+)\}', text):
        text = re.sub(r'\{([^{}]+\|[^{}]+)\}', spin, text)
    
    return text

def render_template(template_str: str, context: dict) -> str:
    """
    Renders variables gracefully. Handles {{FirstName|title}} using Jinja.
    First we replace simple {Var} with {{Var}} so Jinja can parse it.
    """
    # Quick variable substitution without Jinja if needed:
    for key, value in context.items():
        template_str = template_str.replace("{" + str(key) + "}", str(value))
    
    # Run through jinja for advanced cases
    env = Environment(loader=BaseLoader())
    t = env.from_string(template_str)
    return t.render(**context)
