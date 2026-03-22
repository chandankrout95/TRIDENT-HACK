# Use a slim Python image to keep the size down
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system dependencies required for XGBoost
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# FastAPI runs on 8000 by default
EXPOSE 8000

# Command to start the app
# Syntax: uvicorn <folder>.<file>:<fastapi_instance_name>
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]