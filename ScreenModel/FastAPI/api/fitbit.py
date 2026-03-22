# -*- coding: utf-8 -*-
import warnings; warnings.filterwarnings('ignore')
import io
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import google.generativeai as genai
from pathlib import Path
from typing import Optional, Dict
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (classification_report, confusion_matrix, accuracy_score)
from sklearn.preprocessing import MinMaxScaler
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

# ─────────────────────────────────────────────────────────────────────────────
# Gemini Configuration
# ─────────────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"  # Replace with your actual key
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# ─────────────────────────────────────────────────────────────────────────────
# App Setup & State
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Fitbit Performance Score API with Gemini")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

pipeline_state = {
    "model": None, "scaler": None, "df": None, "accuracy": None,
    "status": "idle", "message": "", "features": None
}

FEATURES = [
    'TotalSteps', 'TotalDistance', 'VeryActiveMinutes', 'FairlyActiveMinutes',
    'LightlyActiveMinutes', 'SedentaryMinutes', 'Calories',
    'TotalMinutesAsleep', 'TotalTimeInBed', 'HR_Mean', 'HR_Min', 'HR_Max'
]

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    TotalSteps: float
    VeryActiveMinutes: float
    SedentaryMinutes: float
    Calories: float
    TotalMinutesAsleep: float
    HR_Mean: float
    # Metadata for comparison
    yesterday_steps: float
    yesterday_sleep: float
    yesterday_calories: float
    yesterday_sedentary: float

class PredictResponse(BaseModel):
    performance_score: int
    consolidated_change_pct: float
    metric_breakdown: Dict[str, float]
    recommendation: str
    interpretation: str

# ─────────────────────────────────────────────────────────────────────────────
# Helper: Gemini Recommendation
# ─────────────────────────────────────────────────────────────────────────────
async def get_gemini_advice(metrics: dict, total_change: float) -> str:
    prompt = f"""
    Acting as a professional health coach, analyze these daily Fitbit changes:
    {metrics}
    The overall performance index changed by {total_change:.2f}% compared to yesterday.
    
    Provide a concise, motivating 2-sentence recommendation. 
    Focus on the metric that needs the most attention.
    """
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Keep maintaining your activity levels and ensure consistent sleep for recovery."

# ─────────────────────────────────────────────────────────────────────────────
# Core Logic
# ─────────────────────────────────────────────────────────────────────────────
def run_pipeline(activity: pd.DataFrame, sleep: pd.DataFrame):
    global pipeline_state
    try:
        pipeline_state["status"] = "training"
        
        # Merging and Cleaning
        activity['Date'] = pd.to_datetime(activity['ActivityDate'])
        sleep['Date'] = pd.to_datetime(sleep['SleepDay']).dt.normalize()
        df = activity.merge(sleep[['Id', 'Date', 'TotalMinutesAsleep', 'TotalTimeInBed']], on=['Id', 'Date'], how='left').fillna(0)
        
        # Mock HR Data for training consistency
        df['HR_Mean'] = 72.0; df['HR_Min'] = 55.0; df['HR_Max'] = 110.0
        
        # Engineering the Performance Score based on Activity + Sleep
        scaler = MinMaxScaler()
        norm = scaler.fit_transform(df[['TotalSteps', 'TotalMinutesAsleep', 'VeryActiveMinutes']])
        df['Performance_Score'] = ((0.4*norm[:,0] + 0.3*norm[:,1] + 0.3*norm[:,2]) * 5).round().astype(int)

        X = df[FEATURES]
        y = df['Performance_Score']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)

        pipeline_state.update({
            "model": rf, "df": df, "features": FEATURES,
            "status": "ready", "message": "Model trained successfully."
        })
    except Exception as e:
        pipeline_state["status"] = "error"
        pipeline_state["message"] = str(e)

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if not pipeline_state["model"]:
        raise HTTPException(400, "Model not trained.")

    # 1. Calculate Individual Percentage Changes
    def calc_pct(now, then, reverse=False):
        if then == 0: return 0.0
        change = ((now - then) / then) * 100
        return -change if reverse else change

    breakdown = {
        "steps": calc_pct(req.TotalSteps, req.yesterday_steps),
        "sleep": calc_pct(req.TotalMinutesAsleep, req.yesterday_sleep),
        "calories": calc_pct(req.Calories, req.yesterday_calories),
        "sedentary": calc_pct(req.SedentaryMinutes, req.yesterday_sedentary, reverse=True)
    }

    # 2. Consolidated Percentage (The "One Number")
    total_change = sum(breakdown.values()) / len(breakdown)

    # 3. Model Prediction
    # Create full feature row (filling missing features with defaults)
    row = np.array([[req.TotalSteps, req.TotalSteps/2000, req.VeryActiveMinutes, 20, 180, 
                     req.SedentaryMinutes, req.Calories, req.TotalMinutesAsleep, 
                     req.TotalMinutesAsleep+40, req.HR_Mean, 55, 120]])
    score = int(pipeline_state["model"].predict(row))

    # 4. Gemini Recommendation
    advice = await get_gemini_advice(breakdown, total_change)

    interp_map = {0: "Critical", 1: "Low", 2: "Fair", 3: "Good", 4: "Great", 5: "Elite"}

    return PredictResponse(
        performance_score=score,
        consolidated_change_pct=round(total_change, 2),
        metric_breakdown=breakdown,
        recommendation=advice,
        interpretation=interp_map.get(score, "Unknown")
    )

@app.post("/upload")
async def upload_files(background_tasks: BackgroundTasks, activity_file: UploadFile = File(...), sleep_file: UploadFile = File(...)):
    activity = pd.read_csv(io.BytesIO(await activity_file.read()))
    sleep = pd.read_csv(io.BytesIO(await sleep_file.read()))
    background_tasks.add_task(run_pipeline, activity, sleep)
    return {"message": "Training started."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8501)