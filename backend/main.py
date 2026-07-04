import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# 1. Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# 2. Define the expected data format from the ESP32
class SensorData(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float

# 3. Create the Endpoint
@app.post("/api/telemetry")
async def receive_telemetry(data: SensorData):
    try:
        # --- MOCK MACHINE LEARNING LOGIC ---
        # A simple baseline rule to test the pipeline before you train your real model
        stress_level = "Safe"
        if data.temperature >= 35.0 or (data.temperature > 32.0 and data.humidity > 80.0):
            stress_level = "Critical"
        elif data.temperature >= 32.0:
            stress_level = "Warning"
            
        # Determine valve status (e.g., open if moisture drops below 30%)
        valve_status = True if data.soil_moisture < 30.0 else False

        # --- DATABASE INSERTION ---
        # Structure the payload exactly as your SQL table expects it
        payload = {
            "temperature": data.temperature,
            "humidity": data.humidity,
            "soil_moisture": data.soil_moisture,
            "heat_stress_level": stress_level,
            "valve_open": valve_status
        }
        
        # Push to Supabase
        response = supabase.table("sensor_logs").insert(payload).execute()
        
        return {"status": "success", "recorded_data": payload}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint just to check if the server is alive
@app.get("/")
def read_root():
    return {"status": "Backend is running!"}