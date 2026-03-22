import React from 'react';
import SleepPredictor from './pages/SleepPredictor'; // Your new 3D UI component
 // Global styles (reset, body colors, etc.)

function App() {
  return (
    <div className="App">
    
      
      <main>
        <SleepPredictor />
      </main>

      {/* Footer or Copyright */}
      <footer className="text-center py-6 text-slate-500 text-xs bg-[#0f172a]">
        <p>&copy; 2026 Sleep Health AI | Built with MERN & Gemini</p>
      </footer>
    </div>
  );
}

export default App;