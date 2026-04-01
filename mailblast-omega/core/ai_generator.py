import os
import json
import re
from groq import Groq

class AIGenerator:
    """
    Single-engine AI using Groq (free).
    Model: llama-3.3-70b-versatile
    Free tier: 14,400 req/day, 6,000 tokens/min
    """
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.model = "llama-3.3-70b-versatile"

    def generate(self, brief: dict, mode: str = "email", variants: int = 1) -> list[dict]:
        prompt_mode = brief.get("promptMode", "templates")
        prompt = self._build_prompt(brief, mode)
        
        sys_content = (
            "You are an expert cold email copywriter and AI assistant. "
            "Output ONLY raw JSON — no markdown, no backticks, no text outside the JSON. "
            'Format: {"subject": "...", "body": "..."}. '
        )
        if prompt_mode == "custom":
            sys_content += "CRITICAL: You MUST output exactly what the user asks for inside the 'body' field and nothing else. If they ask for a list, give ONLY the HTML-formatted list. DO NOT write an email, greeting, or conclusion unless explicitly asked. NO conversational filler."
        else:
            sys_content += "CRITICAL: Space out the email organically. Do not output a single massive wall of text."

        results = []
        for _ in range(variants):
            results.append(self._call_groq(prompt, sys_content))
        return results

    def _call_groq(self, prompt: str, system_content: str = None) -> dict:
        if not system_content:
            system_content = (
                "You are an expert cold email copywriter. "
                "Output ONLY raw JSON — no markdown, no backticks, no preamble. "
                'Format: {"subject": "...", "body": "..."}. '
            )
            
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_content
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.85,
                max_tokens=1000
            )
            raw = resp.choices[0].message.content.strip()
            # Strip markdown code fences if model misbehaves
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                data = {"subject": "Error", "body": raw}
                
            data["tokens_used"] = resp.usage.total_tokens if hasattr(resp, 'usage') and hasattr(resp.usage, 'total_tokens') else 0
            data["engine"] = "groq/llama-3.3-70b"
            return data
        except Exception as e:
            err_msg = str(e)
            if "Connection error" in err_msg and not self.client.api_key:
                err_msg = "Critical: GROQ_API_KEY is completely empty in the backend. Please save your API key in the MailBlast Settings UI."
            return {"subject": "API Connection Error", "body": f"Groq API Error Output:\n\n{err_msg}", "tokens_used": 0, "engine": "error"}

    def rewrite(self, draft: str, instruction: str) -> dict:
        prompt = (
            f"Rewrite this cold email with this instruction: {instruction}\n\n"
            f"---\n{draft}\n---\n"
            'Return ONLY JSON: {"subject": "...", "body": "..."}'
        )
        return self._call_groq(prompt)

    def generate_subjects(self, context: str, count: int = 10) -> list[str]:
        prompt = (
            f"Generate {count} compelling cold email subject lines for: {context}. "
            "Return ONLY a JSON array of strings. No markdown: [\"subject 1\", \"subject 2\"]"
        )
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=500
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return []

    def generate_sequence(self, brief: dict, num_emails: int = 3) -> list[dict]:
        prompt = (
            f"Create a {num_emails}-email cold outreach sequence.\n"
            f"Product: {brief.get('product')}\n"
            f"Target: {brief.get('audience')}\n"
            f"Tone: {brief.get('tone', 'professional')}\n\n"
            "Email 1: Initial outreach (Day 0)\n"
            "Email 2: Follow-up (Day 3)\n"
            "Email 3: Break-up email (Day 7)\n\n"
            "Use variables: {FirstName}, {Company}, {Website}\n"
            'Return ONLY JSON array: [{"subject":"...","body":"...","send_day":0}, ...]'
        )
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=2000
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return []

    def _build_prompt(self, brief: dict, mode: str) -> str:
        prompt_mode = brief.get("promptMode", "templates")
        
        if prompt_mode == "custom":
            custom = brief.get("customPrompt", "").strip()
            prompt_lines = [
                f"Follow these exact instructions:\n{custom}\n",
                "\nRules:",
                "- The output MUST be a single valid JSON object. NEVER break JSON formatting.",
                "- Wrap your generated content inside standard HTML tags (<b>, <i>, <ul>, <li>, <p>, <br>) for beautiful rich text formatting.",
                "- CRITICAL RULE: Give the user EXACTLY the precise data they asked for and NOTHING ELSE. If they ask for a list of 10 subjects, output ONLY an HTML list of 10 subjects.",
                "- DO NOT WRITE AN EMAIL BODY unless explicitly asked. No 'Hi [Name]', no intros, no 'Here is your list', no sign-offs. Zero conversational filler.",
                '- Return ONLY raw JSON with this exact structure: {"subject": "Relevant Title", "body": "<html>...</html>"}',
                "- Do NOT wrap the JSON in markdown code blocks."
            ]
            return "\n".join(prompt_lines)

        # Standard templates mode
        prompt_lines = [
            "Write a cold outreach email:",
            f"- Product/Service: {brief.get('product', 'our product')}",
            f"- Target audience: {brief.get('audience', 'business owners')}",
            f"- Tone: {brief.get('tone', 'professional but friendly')}"
        ]
        
        prompt_lines.append("\nRules:")
        prompt_lines.append("- Use {FirstName}, {Company}, {Website} naturally")
        prompt_lines.append("- No 'I hope this email finds you well'")
        prompt_lines.append("- Feel personal, not spammy")
        prompt_lines.append("- Output the body using HTML tags (<p>, <b>, <i>, <ul>, <br>) for beautiful rich text formatting.")
        prompt_lines.append("- Use 6th-grade readability and high-converting copywriting best practices.")
        prompt_lines.append('- Return ONLY valid JSON: {"subject": "...", "body": "<p>...</p>"}')
        
        return "\n".join(prompt_lines)
