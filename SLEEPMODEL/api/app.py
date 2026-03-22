from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
import os

# 1. Load Environment Variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI(title="Sleep Health AI Predictor")

# 2. CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
llm_model = genai.GenerativeModel('gemini-1.5-flash')

# 4. Load ML Artifacts
try:
    model = joblib.load('api/sleep_disorder_model.pkl')
    encoders = joblib.load('api/label_encoders.pkl')
    model_columns = joblib.load('api/model_columns.pkl')
    print("All ML artifacts loaded successfully!")
except Exception as e:
    print(f"Error loading artifacts: {e}")

class SleepData(BaseModel):
    Gender: str
    Age: int
    Occupation: str
    Sleep_Duration: float
    Quality_of_Sleep: int 
    Physical_Activity_Level: int
    Stress_Level: int
    BMI_Category: str
    Blood_Pressure_Systolic: int
    Heart_Rate: int
    Daily_Steps: int

async def get_llm_recommendations(user_data: dict, prediction: str):
    # Ensure Gemini knows that "No Sleep Disorder" is a positive result
    display_pred = "a healthy sleep cycle" if "no sleep disorder" in prediction.lower() else prediction
    
    prompt = f"""
    You are a professional Sleep Health Consultant. 
    Profile: Age {user_data['Age']}, Job: {user_data['Occupation']}, Sleep Quality: {user_data['Quality_of_Sleep']}/10.
    ML Prediction: {display_pred}.
    Provide 2 short, supportive health tips (one sentence each) specifically for this user.
    If the user is healthy, encourage them to maintain their good habits.
    Do not use markdown bolding.
    """
    try:
        response = llm_model.generate_content(prompt)
        tips = [tip.strip() for tip in response.text.strip().split('\n') if tip.strip()]
        return tips[:2]
    except:
        return ["Maintain a consistent sleep schedule.", "Ensure your room is cool and dark."]

@app.post("/predict")
async def predict_sleep_disorder(data: SleepData):
    try:
        input_dict = data.dict()
        
        # Calculation: Quality of Sleep in Percentage
        quality_percentage = (data.Quality_of_Sleep / 10) * 100
        
        # Blood Pressure logic
        systolic_val = input_dict['Blood_Pressure_Systolic']
        formatted_bp = f"{systolic_val}/80"
        input_dict['Blood_Pressure'] = formatted_bp
        
        # Create DataFrame
        input_df = pd.DataFrame([input_dict])
        
        # --- 5. FIXED: Categorical Encoding Logic ---
        categorical_cols = ['Gender', 'Occupation', 'BMI_Category']
        for col in categorical_cols:
            if col in encoders:
                le = encoders[col]
                # Use .iloc to get the value properly from the single row
                val = input_df[col].iloc 
                if val in le.classes_:
                    input_df[col] = int(le.transform([val]))
                else:
                    input_df[col] = 0

        # Handle Blood Pressure Hash Encoding
        if 'Blood_Pressure' in model_columns:
            input_df['Blood_Pressure'] = hash(formatted_bp) % 100
        
        # Reorder and Predict
        final_features = input_df.reindex(columns=model_columns, fill_value=0)
        prediction_idx = model.predict(final_features)
        
        # --- 6. FIXED: Result Decoding (Handling nan/None) ---
        target_encoder = encoders['Sleep_Disorder']
        # Use to extract the string value from the numpy array
        raw_label = target_encoder.inverse_transform(prediction_idx)
        
        # Standardize the prediction text
        label_str = str(raw_label).strip()
        if label_str.lower() in ["none", "nan", "normal"]:
            final_prediction_text = "No Sleep Disorder"
        else:
            final_prediction_text = label_str

        # Get Gemini AI advice based on the cleaned prediction
        llm_recommendations = await get_llm_recommendations(data.dict(), final_prediction_text)

        return {
            "status": "success",
            "prediction": final_prediction_text,
            "sleep_quality_score": f"{quality_percentage}%",
            "llm_personalized_advice": llm_recommendations,
            "metadata": {
                "calculated_bp": formatted_bp,
                "input_quality_rating": f"{data.Quality_of_Sleep}/10"
            }
        }

    except Exception as e:
        # Detailed error log for your HP Victus console debugging
        print(f"Prediction Error Details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 for better container/network accessibility
    uvicorn.run(app, host="0.0.0.0", port=8000)