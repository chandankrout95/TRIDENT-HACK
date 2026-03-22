import os
import base64
import uvicorn
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from openai import OpenAI
from bs4 import BeautifulSoup
import urllib.parse

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("groq api key loaded")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not GROQ_API_KEY or not OPENROUTER_API_KEY:
    print("⚠️ Warning: Missing API keys in .env file. Check GROQ_API_KEY and OPENROUTER_API_KEY.")

# Initialize clients
groq_client = Groq(api_key=GROQ_API_KEY)

# Use OpenAI client for OpenRouter
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

app = FastAPI(title="Medicine Analyzer API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_image_with_groq(image_bytes: bytes) -> str:
    """Uses Groq's Llama Vision model to check if the image is a clear medicine."""
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt = (
        "You are an expert medical OCR assistant. Analyze this image carefully. "
    "1. If the image is NOT a medical document (prescription, lab report, or doctor's note), reply ONLY with 'UNCLEAR'. "
    "2. If it is a handwritten note, extract the text by following the flow of the handwriting. "
    "3. Identify key sections: 'Patient History', 'Physical Findings' (e.g., Neck Mass, Thyroid), 'Suspected Diagnosis' (e.g., Cancer vs. Not Cancer), and 'Plan' (e.g., Biopsy, Ultrasound). "
    "4. List any specific medications mentioned. If no medications are found, list the recommended diagnostic tests. "
    "Return the extracted information in a clear, structured summary."
    )
    
    try:
        response = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct", # Updated to a stable Groq vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq Vision Error: {e}")
        return "UNCLEAR"

def get_doctor_advice(medicine_name: str) -> str:
    """Uses OpenRouter LLM to generate short, perfect medical instructions."""
    try:
        response = openrouter_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional medical assistant. You will receive text extracted from a prescription or medicine image. "
                        "Your task is to identify the primary medicine and the disease/condition it treats, and provide a short guide. "
                        "Return your response strictly as a JSON object with these keys: "
                        '"medicine" (string: ONLY the exact name(s) of the prescribed medicine(s), e.g., "CALPOL, DELCON, LEVOLIN". Do not include patient name, age, or dosage here. This name is used for search queries), '
                        '"disease" (string: the disease or condition it treats), '
                        '"instructions" (string: markdown guide with 1. 💊 **Primary Uses**, 2. 📋 **Dosage**, 3. ⚠️ **Safety Rules**, 4. **Disclaimer**). '
                        "Do NOT wrap the JSON in markdown blocks like ```json, just return the raw JSON string."
                    )
                },
                {
                    "role": "user",
                    "content": f"Extracted text: '{medicine_name}'"
                }

            ],
            temperature=0.2, # Lower temperature for more consistent, factual formatting
            max_tokens=500,  # Keeps it short and saves your credits
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        return "⚠️ Error generating instructions. Please check medicine name or try again."

def get_medicine_buy_link(medicine_name: str) -> str:
    """Scrapes DuckDuckGo to find the direct 1mg product page for the medicine."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    query = f"site:1mg.com buy {medicine_name}"
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    
    fallback_url = f"https://www.1mg.com/search/all?name={urllib.parse.quote(medicine_name)}"
    try:
        response = httpx.get(search_url, headers=headers, timeout=8.0)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for a in soup.find_all('a', class_='result__url'):
            href = a.get('href', '')
            if 'uddg=' in href:
                actual_link = urllib.parse.unquote(href.split('uddg=')[1].split('&')[0])
                if '1mg.com/drugs/' in actual_link or '1mg.com/otc/' in actual_link:
                    return actual_link
    except Exception as e:
        print(f"Scraping Error: {e}")
        
    return fallback_url

@app.post("/analyze")
async def analyze_medicine(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        image_bytes = await file.read()
        
        # Step 1: Analyze image with Groq
        vision_result = analyze_image_with_groq(image_bytes)
        
        # Clean up output
        cleaned_result = vision_result.upper().replace(".", "").replace("'", "").replace('"', '').strip()
        
        if "UNCLEAR" in cleaned_result or not cleaned_result:
            return JSONResponse(content={
                "status": "error",
                "message": "Please upload a clearer picture with the medicine name properly shown."
            })
        
        # Step 2: Get doctor advice from OpenRouter
        response_text = get_doctor_advice(vision_result)
        
        # Clean formatting (Gemini often adds ```json ... ``` despite instructions)
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()
            
        try:
            import json
            data = json.loads(clean_json)
            medicine = data.get("medicine", "Multiple Medicines")
            if medicine == vision_result or len(medicine) > 100:
                medicine = "Check Extracted Data"
            disease = data.get("disease", "Unknown")
            instructions = data.get("instructions", response_text)
        except Exception as e:
            print(f"JSON Parse Error: {e}")
            print(f"Failed string: {response_text}")
            medicine = "Parsed Medicine Unknown"
            disease = "Unknown"
            instructions = response_text
            
        # Step 3: Get direct product page URL via scraping
        # If multiple medicines, just search the first one to guarantee a result
        search_medicine = medicine.split(',')[0].strip() if ',' in medicine else medicine
        buy_link = get_medicine_buy_link(search_medicine)
            
        return JSONResponse(content={
            "status": "success",
            "extracted_text": vision_result,
            "medicine": medicine,
            "disease": disease,
            "instructions": instructions,
            "buy_link": buy_link
        })
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "An internal error occurred during the analysis process."
        })


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)