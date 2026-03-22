import { useState } from 'react'

function SleepPredictor() {
  // 1. State for User Inputs (Matches your Pydantic SleepData exactly)
  const [formData, setFormData] = useState({
    Gender: 'Male',
    Age: 21,
    Occupation: 'Software Engineer',
    Sleep_Duration: 7.0,
    Quality_of_Sleep: 8,
    Physical_Activity_Level: 60,
    Stress_Level: 3,
    BMI_Category: 'Normal',
    Blood_Pressure_Systolic: 120,
    Heart_Rate: 72,
    Daily_Steps: 8000
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      // Crucial: Convert numeric strings back to numbers for the ML model
      [name]: type === 'number' ? (value.includes('.') ? parseFloat(value) : parseInt(value)) : value
    }));
  };

  // 3. POST JSON Request to Backend
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Direct Talk with /predict endpoint using JSON
      const response = await fetch("https://sleep-disease-predictor.vercel.app/predict", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(formData) // Sending strictly JSON, not FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Prediction failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("API Error:", error.message);
      alert(`Connection Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
        
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Sleep AI Predictor
          </h1>
          <p className="text-slate-400 mt-2">Personalized ML Analysis Dashboard</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* --- LEFT: INPUT SECTION --- */}
          <form onSubmit={handlePredict} className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Object.keys(formData).map((key) => (
              <div key={key} className={key === 'Daily_Steps' ? 'sm:col-span-2' : ''}>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">
                  {key.replace(/_/g, ' ')}
                </label>
                
                {key === 'Gender' || key === 'BMI_Category' ? (
                  <select 
                    name={key} 
                    value={formData[key]}
                    onChange={handleChange} 
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-3 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {key === 'Gender' ? (
                      <><option value="Male">Male</option><option value="Female">Female</option></>
                    ) : (
                      <><option value="Normal">Normal</option><option value="Overweight">Overweight</option><option value="Obese">Obese</option></>
                    )}
                  </select>
                ) : (
                  <input 
                    type={typeof formData[key] === 'number' ? 'number' : 'text'} 
                    name={key} 
                    step={key === 'Sleep_Duration' ? '0.1' : '1'}
                    value={formData[key]} 
                    onChange={handleChange}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-3 outline-none focus:border-blue-500 transition-all"
                  />
                )}
              </div>
            ))}
            
            <button 
              type="submit" 
              disabled={loading}
              className="sm:col-span-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Analyzing Metrics..." : "Run AI Prediction"}
            </button>
          </form>

          {/* --- RIGHT: OUTPUT SECTION --- */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-black/30 rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
            {!result ? (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🌙</div>
                <p className="text-slate-500 italic">Enter data to see AI insights</p>
              </div>
            ) : (
              <div className="w-full space-y-6 animate-in fade-in duration-700">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Diagnosis</span>
                  <h2 className="text-5xl font-black text-white mt-2 drop-shadow-lg">{result.prediction}</h2>
                </div>
                
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
                  <span className="text-4xl font-bold text-indigo-400">{result.sleep_quality_score}</span>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mt-1">Quality Efficiency</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalized AI Advice:</h4>
                  {result.llm_personalized_advice.map((advice, i) => (
                    <div key={i} className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl text-sm text-slate-300">
                      {advice}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SleepPredictor;