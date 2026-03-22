from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI()

# Enable CORS so your frontend can talk to your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and columns
model = joblib.load('stress_model.pkl')
model_columns = joblib.load('model_columns.pkl')

class StudentInput(BaseModel):
    Age: int
    Gender: str  # Expecting "Male" or "Female"
    Department: str # e.g., "Engineering", "Science"
    CGPA: float
    Sleep_Duration: float
    Study_Hours: float
    Social_Media_Hours: float
    Physical_Activity: float

@app.post("/predict")
async def predict(data: StudentInput):
    # 1. Convert input to DataFrame
    input_df = pd.DataFrame([data.model_dump()])
    
    # 2. Match the Dummy Encoding used during training
    input_df = pd.get_dummies(input_df)
    
    # 3. Add missing columns with 0s (for Gender/Dept not present in input)
    for col in model_columns:
        if col not in input_df.columns:
            input_df[col] = 0
            
    # 4. Ensure column order is identical to training
    input_df = input_df[model_columns]
    
    # 5. Predict
    prediction = int(model.predict(input_df)[0])
    probability = float(model.predict_proba(input_df)[0][1])
    
    return {
        "is_depressed": bool(prediction),
        "confidence": round(probability * 100, 2),
        "message": "High risk detected. Please take a break." if prediction else "Low risk. Keep it up!"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)