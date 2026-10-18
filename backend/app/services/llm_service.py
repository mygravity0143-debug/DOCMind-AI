import os
import re
import math
import json
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

class LLMService:
    @staticmethod
    async def generate_response(
        system_prompt: str,
        user_prompt: str,
        retrieved_chunks: List[Dict[str, Any]],
        api_keys: Optional[Dict[str, str]] = None,
        preferred_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Routes generation to Gemini, OpenAI, or the offline grounded generator.
        """
        gemini_key = (api_keys or {}).get("gemini_api_key") or settings.GEMINI_API_KEY
        openai_key = (api_keys or {}).get("openai_api_key") or settings.OPENAI_API_KEY

        # If user explicitly preferred gemini or gemini key exists
        if gemini_key:
            try:
                answer = await LLMService._call_gemini(system_prompt, user_prompt, gemini_key)
                if answer and len(answer.strip()) > 0:
                    return {"answer": answer, "provider": "gemini"}
            except Exception as e:
                # Log error and fallback
                print(f"[LLMService] Gemini error: {e}, falling back to local synthesis")

        # If openai key exists
        if openai_key:
            try:
                answer = await LLMService._call_openai(system_prompt, user_prompt, openai_key)
                if answer and len(answer.strip()) > 0:
                    return {"answer": answer, "provider": "openai"}
            except Exception as e:
                print(f"[LLMService] OpenAI error: {e}, falling back to local synthesis")

        # Offline Grounded Synthesis
        answer = LLMService._synthesize_grounded_offline(user_prompt, retrieved_chunks)
        return {"answer": answer, "provider": "grounded_offline"}

    @staticmethod
    async def _call_gemini(system_prompt: str, user_prompt: str, api_key: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Question:\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                raise Exception(f"Gemini API returned status {resp.status_code}: {resp.text}")
        return ""

    @staticmethod
    async def _call_openai(system_prompt: str, user_prompt: str, api_key: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1000
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
            else:
                raise Exception(f"OpenAI API returned status {resp.status_code}: {resp.text}")
        return ""

    @staticmethod
    def _synthesize_grounded_offline(user_prompt: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        High quality, deterministic grounded synthesis engine when offline or no API key is set.
        Synthesizes facts directly from retrieved chunks, formatting exact citations [Doc: Page X].
        """
        # Extract actual user question if embedded in evidence prompt template
        q_match = re.search(r'USER QUESTION:\s*(.*)', user_prompt, re.DOTALL | re.IGNORECASE)
        actual_query = q_match.group(1).strip() if q_match else user_prompt

        STOP_WORDS = {
            "what", "when", "where", "which", "does", "have", "from", "with", "this", "that", "these",
            "explain", "describe", "tell", "about", "properties", "are", "the", "and", "for", "how",
            "can", "could", "would", "should", "why", "who", "whom", "whose", "been", "being",
            "was", "were", "has", "had", "than", "then", "into", "onto", "over", "under", "more",
            "most", "also", "each", "both", "such", "using", "used", "does", "doing", "done", "not"
        }
        query_terms = set(re.findall(r'\b\w{3,}\b', actual_query.lower())) - STOP_WORDS

        # For multi-term queries, require majority (>50%) concept coverage to prevent hallucinations
        min_overlap = max(2, int(math.ceil(len(query_terms) * 0.55))) if len(query_terms) >= 3 else 1

        # Filter out chunks with low similarity score or insufficient query term overlap
        valid_chunks = []
        for c in retrieved_chunks:
            c_score = c.get("similarity_score", 0.0)
            c_tokens = set(re.findall(r'\b\w{3,}\b', c["content"].lower()))
            overlap = len(query_terms.intersection(c_tokens))
            if c_score >= 0.15 and overlap >= min_overlap:
                valid_chunks.append((c, overlap))

        if not valid_chunks:
            return "The uploaded documents do not contain sufficient information to answer this question."

        # If query contains multiple distinct topics across different documents with zero co-occurrence
        if len(valid_chunks) >= 2:
            doc_names = set(c.get("filename", "") for c, _ in valid_chunks)
            if len(doc_names) >= 2:
                # Check if each chunk only contains a subset of terms with zero cross-pollination
                c1_tokens = set(re.findall(r'\b\w{3,}\b', valid_chunks[0][0]["content"].lower()))
                c2_tokens = set(re.findall(r'\b\w{3,}\b', valid_chunks[1][0]["content"].lower()))
                # If neither chunk contains the other chunk's primary query terms
                c1_query = query_terms.intersection(c1_tokens)
                c2_query = query_terms.intersection(c2_tokens)
                if len(c1_query - c2_query) > 0 and len(c2_query - c1_query) > 0 and len(c1_query.intersection(c2_query)) == 0:
                    return "The uploaded documents do not contain sufficient information to answer this question. The mentioned concepts appear in separate unrelated documents with no documented connection."

        sections = []

        for idx, (chunk, _) in enumerate(valid_chunks[:3]):
            content = chunk["content"]
            page = chunk["page_number"]
            filename = chunk.get("filename", "Document")
            citation_tag = f"[{filename}, Page {page}]"

            # Break into sentences
            raw_sents = re.split(r'(?<=[.!?])\s+', content)
            matched_sents = []

            for s in raw_sents:
                s_clean = s.strip()
                if len(s_clean) < 15:
                    continue
                s_tokens = set(re.findall(r'\b\w{3,}\b', s_clean.lower()))
                overlap = len(query_terms.intersection(s_tokens))
                if overlap >= min_overlap:
                    matched_sents.append((s_clean, overlap))

            # Pick top sentences from this chunk
            matched_sents.sort(key=lambda x: x[1], reverse=True)
            top_sents = [s[0] for s in matched_sents[:2]]

            if top_sents:
                evidence_text = " ".join(top_sents)
                sections.append(f"• **According to {filename} (Page {page})**:\n  > {evidence_text}\n  *Citation: {citation_tag}*")

        if not sections:
            return "The uploaded documents do not contain sufficient information to address this inquiry."

        response = (
            f"Based on the analysis of your documents, here are the key findings:\n\n"
            + "\n\n".join(sections)
            + "\n\n**Evidence Summary**: The retrieved passages provide direct evidence answering your query with documented source pages."
        )
        return response
