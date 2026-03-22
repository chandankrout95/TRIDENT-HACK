import os
import joblib
import pandas as pd
import warnings
import time

# Suppress warnings (Specifically for sklearn version mismatches)
warnings.filterwarnings('ignore')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Gemini Client
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    print("⚠️ Warning: GEMINI_API_KEY not found in .env")

app = FastAPI(
    title="Digital Habits & Mental Health API",
    description="Predicts Mood & Stress with Gemini-powered insights.",
    version="1.4.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELS ──────────────────────────────────────────────────────────────────

class HabitInput(BaseModel):
    screen_time_hours: float = Field(..., ge=0, le=24, example=7.5)
    social_media_platforms_used: int = Field(..., ge=0, example=3)
    hours_on_Instagram: float = Field(..., ge=0, le=24, example=2.0)
    sleep_hours: float = Field(..., ge=0, le=24, example=6.5)

    @field_validator('hours_on_Instagram')
    @classmethod
    def instagram_not_exceed_total(cls, v, info):
        if 'screen_time_hours' in info.data and v > info.data['screen_time_hours']:
            raise ValueError('Instagram usage cannot be greater than total screen time')
        return v

class PredictionOutput(BaseModel):
    predicted_mood_score: float
    predicted_stress_category: str
    recommendation: str

# ─── ML MODEL LOADING ────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "digital_habits_model.pkl")
bundle = None

@app.on_event("startup")
def verify_connections():
    global bundle, client
    # 1. Check ML Model
    if os.path.exists(MODEL_PATH):
        try:
            bundle = joblib.load(MODEL_PATH)
            print("✅ ML Model loaded.")
        except Exception as e:
            print(f"❌ Error loading ML Model: {e}")
    
    # 2. Verify Gemini Connectivity
    if client:
        try:
            client.models.list(config={'page_size': 1})
            print("✅ Gemini API: Connected and Authenticated.")
        except Exception as e:
            print(f"❌ Gemini API Connection Failed: {e}")
            client = None

# ─── AI RECOMMENDATION LOGIC ─────────────────────────────────────────────────

def get_ai_recommendation(mood, stress, habits: HabitInput):
    """Generates insights using Gemini with fallback for 429 errors."""
    if not client:
        return "Try to keep your screen time under 6 hours and aim for 7+ hours of sleep for better focus."

    prompt = (
        f"Context: Mood score {mood}/10, Stress level: {stress}. "
        f"Habits: {habits.screen_time_hours}h screen time, {habits.hours_on_Instagram}h on Instagram, "
        f"{habits.sleep_hours}h sleep. "
        "Task: Provide a supportive, personalized 2-sentence recommendation to improve well-being."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        if "429" in str(e):
            print("🤖 Gemini Rate Limit hit. Returning static recommendation.")
        else:
            print(f"🤖 Gemini Error: {e}")
        return "Consider reducing Instagram usage before bed to improve your sleep quality and overall mood."

# ─── ENDPOINTS ──────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionOutput)
def predict_mental_health(data: HabitInput):
    if bundle is None:
        raise HTTPException(status_code=503, detail="ML Model not loaded.")

    try:
        # Convert Pydantic model to dict
        input_dict = data.model_dump()
        
        # Handle the feature name mismatch (Renaming Instagram to TikTok if expected by model)
        input_dict['hours_on_TikTok'] = input_dict.pop('hours_on_Instagram')
        
        # Create DataFrame and align columns
        df_input = pd.DataFrame([input_dict])[bundle["feature_columns"]]
        
        # Scale features
        scaled_features = bundle["feature_scaler"].transform(df_input)
        
        # 1. Regression Prediction (Mood)
        # Index [0] extracts the scalar from the 1D prediction array
        mood_pred = bundle["regressor"].predict(scaled_features)
        mood_score = float(mood_pred[0])
        
        # 2. Classification Prediction (Stress)
        # Index [0] extracts the single label string from the 1D array
        stress_idx = bundle["classifier"].predict(scaled_features)
        raw_stress_label = bundle["classifier_label_enc"].inverse_transform(stress_idx)
        stress_label = str(raw_stress_label[0])

        # 3. Call AI with clean data
        recommendation = get_ai_recommendation(round(mood_score, 2), stress_label, data)

        return {
            "predicted_mood_score": round(mood_score, 2),
            "predicted_stress_category": stress_label,
            "recommendation": recommendation
        }
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Internal prediction error: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "Online", "model_loaded": bundle is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)