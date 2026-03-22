<div align="center">
  <img src="https://capsule-render.vercel.app/render?type=waving&color=00b4d8&height=200&section=header&text=Unbothered&fontSize=80&animation=fadeIn&fontAlignY=35" width="100%" />

  <h3>🌿 AI-Powered Mental Wellness Companion</h3>
  <p><i>Helping the world stay calm, focused, and emotionally resilient in a chaotic digital landscape.</i></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
    <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </p>
</div>

---

## 🧠 Overview
**Unbothered** is an intelligent React Native application designed to bridge the gap between neuroscience and daily habit-tracking. By leveraging wearable data and behavioral analytics, it provides students and professionals with a personal mental resilience system.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **😴 Sleep Intelligence** | Predicts sleep disorders and generates brainwave frequency sounds. |
| **⌚ Wearable Analytics** | Real-time stress spike detection and burnout risk forecasting. |
| **🤖 AI Companion** | Emotion-aware AI providing CBT-based micro-interventions. |
| **🌬️ Adaptive Therapy** | Dynamic meditation sessions and guided breathing exercises. |

---

## 🛠️ Tech Stack

### **Frontend & Mobile**
* **Framework:** React Native / Expo
* **Web Deployment:** Vercel (for Landing/Web Dashboard)
* **State Management:** Redux Toolkit

### **Backend & AI**
* **API:** FastAPI (Python 3.9+)
* **Models:** TensorFlow, PyTorch, Scikit-learn
* **Deployment:** Docker & Render

---

## 🚢 Deployment & DevOps

### **🐳 Dockerize the Backend**
To run the FastAPI server inside a container:
```bash
# Build the image
docker build -t unbothered-api .

# Run the container
docker run -p 8000:8000 unbothered-api
