import os
import sys
sys.path.insert(0, r"c:\Users\user\Downloads\FYP_1_AudioGuard\deepfake_intel_v2")
import google.generativeai as genai
import json
from config import GEMINI_API_KEY, GEMINI_MODEL
from embedding.vector_store import retrieve
from config import DAILY_REPORT_QUERY

genai.configure(api_key=GEMINI_API_KEY)

def generate_llm_summary(articles):
    model = genai.GenerativeModel(GEMINI_MODEL)
    
    context = ""
    for idx, a in enumerate(articles[:10]):
        context += f"Article {idx+1}:\nTitle: {a['title']}\nURL: {a['url']}\nSource: {a['source']}\nContent Snippet: {a['text'][:1000]}\n\n"
        
    prompt = f"""
    You are an AI intelligence analyst specializing in deepfakes and synthetic media.
    Based on the following retrieved articles, provide a comprehensive summary of the current issues and how they can be resolved.
    Also extract key insights, emerging threats, and prevention/mitigation tips. Ensure you include the article links where appropriate in the key insights.

    Return the result strictly as a valid JSON object with the following schema:
    {{
        "summary": "A detailed 2-3 paragraph summary discussing the core issues identified in the articles and how they can be resolved.",
        "key_insights": [
            {{
                "sentence": "A very specific, impactful sentence describing an insight.",
                "title": "Title of the article this insight came from",
                "url": "URL of the article"
            }}
        ],
        "threats": [
            "A specific threat mentioned in the articles (string)"
        ],
        "prevention": [
            "A specific prevention or mitigation tip (string)"
        ]
    }}

    Articles Context:
    {context}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        return json.loads(text.strip())
    except Exception as e:
        print(f"LLM Error: {e}")
        return None

if __name__ == "__main__":
    articles = retrieve(DAILY_REPORT_QUERY, top_k=5)
    if articles:
        res = generate_llm_summary(articles)
        print(json.dumps(res, indent=2))
    else:
        print("No articles found")
