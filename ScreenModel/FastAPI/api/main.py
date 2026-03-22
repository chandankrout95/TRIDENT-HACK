import os
import json
import pickle
import numpy as np
import pandas as pd
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')
# ── SETUP ─────────────────────────────────────────────────────────────────────

load_dotenv()
app = FastAPI(title="Fitbit AI Progress Analyzer")

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Configuration
# Ensure your API Key is set in your .env file
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Using gemini-1.5-flash for speed and cost-efficiency
# response_mime_type ensures the AI strictly returns JSON
ai_engine = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={"response_mime_type": "application/json"}
)

# Load Local Random Forest Model
MODEL_PATH = "api/fitbit_rf_model.pkl"
model = None
features = []

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
            model = bundle["model"]
            features = bundle["features"]
    else:
        print(f"⚠️ Model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"⚠️ Error loading model: {e}")

# ── SCHEMAS ───────────────────────────────────────────────────────────────────

class Metrics(BaseModel):
    total_steps: int
    very_active_minutes: int
    fairly_active_minutes: int
    lightly_active_minutes: int
    sedentary_minutes: int
    total_minutes_asleep: int
    total_time_in_bed: int
    heart_rate_mean: float
    calories: int

class CompareInput(BaseModel):
    yesterday: Metrics
    today: Metrics

# ── LOGIC ─────────────────────────────────────────────────────────────────────

def get_ml_score(m: Metrics) -> int:
    """Predicts a health score 0-5 using the local Random Forest model."""
    if model is None:
        return 3 # Neutral fallback if model is missing
    
    input_dict = {
        "TotalSteps": float(m.total_steps),
        "TotalDistance": round(m.total_steps / 1312.0, 4),
        "VeryActiveMinutes": float(m.very_active_minutes),
        "FairlyActiveMinutes": float(m.fairly_active_minutes),
        "LightlyActiveMinutes": float(m.lightly_active_minutes),
        "SedentaryMinutes": float(m.sedentary_minutes),
        "Calories": float(m.calories),
        "TotalMinutesAsleep": float(m.total_minutes_asleep),
        "TotalTimeInBed": float(m.total_time_in_bed),
        "HR_Mean": float(m.heart_rate_mean),
        "HR_Min": float(m.heart_rate_mean - 10),
        "HR_Max": float(m.heart_rate_mean + 40),
        "MinuteSteps_Total": float(m.total_steps),
    }
    
    try:
        df = pd.DataFrame([input_dict])
        # Match feature order from training
        df = df.reindex(columns=features, fill_value=0)
        
        prediction = model.predict(df)
        # Convert numpy type to native Python int for JSON compatibility
        return int(np.clip(prediction, 0, 5).item())
    except Exception as e:
        print(f"❌ ML Prediction error: {e}")
        return 3

async def generate_ai_report(stats: dict, score_td: int, score_yd: int, overall_pct: float) -> str:
    """Calls Gemini 1.5 Flash to generate a specific health recommendation."""
    
    prompt =f"""
    Compare these fitness metrics: {overall_pct}% change, scores {score_yd}->{score_td}, and deltas: {json.dumps(stats)}.
    Return a JSON object with a "recommendation" key containing exactly one sentence acknowledging the trend and one sentence giving a tip. 
    Strictly limit the total response to 1 sentences.
    """
    
    try:
        # Crucial: Use the async version of the call
        response = await ai_engine.generate_content_async(prompt)
        # Parse result directly since we forced JSON output in the config
        data = json.loads(response.text)
        return data.get("recommendation", "Great consistency! Keep pushing toward your goals.")
    except Exception as e:
        print(f"⚠️ AI Generation Error: {e}")
        return "Focus on balancing activity with recovery to keep your momentum going."

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.post("/analyze/compare")
async def analyze_progress(data: CompareInput):
    # 1. Generate Scores from the ML model
    score_yd = get_ml_score(data.yesterday)
    score_td = get_ml_score(data.today)

    # 2. Calculate Percentage Deltas
    def pct(t, y, invert=False):
        if y == 0: return 0.0
        change = ((t - y) / abs(y)) * 100
        return round(-change if invert else change, 2)
    
    deltas = {
        "steps": pct(data.today.total_steps, data.yesterday.total_steps),
        "sleep": pct(data.today.total_minutes_asleep, data.yesterday.total_minutes_asleep),
        "intensity": pct(data.today.very_active_minutes, data.yesterday.very_active_minutes),
        "sedentary_reduction": pct(data.today.sedentary_minutes, data.yesterday.sedentary_minutes, invert=True)
    }

    # 3. Calculate Overall Performance Change
    overall_change = round(sum(deltas.values()) / len(deltas), 2)

    # 4. Fetch AI Insights
    recommendation = await generate_ai_report(deltas, score_td, score_yd, overall_change)

    return {
        "performance_score": score_td,
        "score_improvement": int(score_td - score_yd),
        "overall_change_pct": overall_change,
        "metric_breakdown": {
            "step_growth": f"{deltas['steps']}%",
            "sleep_growth": f"{deltas['sleep']}%",
            "intensity_growth": f"{deltas['intensity']}%",
            "sedentary_change": f"{deltas['sedentary_reduction']}%"
        },
        "coach_recommendation": recommendation
    }

if __name__ == "__main__":
    import uvicorn
    # Port 8501 is standard for your current setup
    uvicorn.run(app, host="0.0.0.0", port=8501)