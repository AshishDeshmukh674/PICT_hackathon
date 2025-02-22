import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# FastAPI instance
app = FastAPI(title="Google Fit API")

# Enable CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Google Fit API is running"}

@app.options("/health_data")
def health_data_options():
    return {}

# OAuth Scopes
SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.blood_pressure.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.oxygen_saturation.read'
]

# Data Sources in Google Fit
DATA_SOURCES = {
    "Steps": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
    "Calories": "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
    "Heart Rate": "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
    "Distance": "derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta",
    "Blood Pressure": "derived:com.google.blood_pressure:com.google.android.gms:merged",
    "Oxygen Saturation": "derived:com.google.oxygen_saturation:com.google.android.gms:merged",
    "Sleep": "derived:com.google.sleep.segment:com.google.android.gms:merged"
}

# Input Model for User Selection
class UserSelection(BaseModel):
    mode: int  # 1: Today, 2: Past Days, 3: Custom Time
    days: int = 0  # Used only if mode=2
    start_hour: int = 0  # Used only if mode=3
    end_hour: int = 23  # Used only if mode=3

def get_credentials():
    """Get valid OAuth credentials and dynamically request missing scopes."""
    try:
        creds = None
        if not os.path.exists('credentials.json'):
            raise HTTPException(
                status_code=400,
                detail="credentials.json file not found. Please ensure it exists in the correct directory."
            )

        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            print("Found existing token.json")

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("Refreshing expired credentials")
                creds.refresh(Request())
            else:
                print("Getting new credentials")
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
                print("Saved new token.json")

        return creds
    except Exception as e:
        print(f"Error in get_credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

def retrieve_data(data_source, start_time, end_time):
    """Retrieve health data from Google Fit API"""
    try:
        creds = get_credentials()
        service = build('fitness', 'v1', credentials=creds)
        dataset = f"{start_time}-{end_time}"

        print(f"Fetching data for {data_source} from {start_time} to {end_time}")
        
        response = service.users().dataSources().datasets().get(
            userId="me",
            dataSourceId=data_source,
            datasetId=dataset
        ).execute()

        if not response or 'point' not in response:
            print(f"No data points found for {data_source}")
            return None

        print(f"Got response for {data_source} with {len(response.get('point', []))} points")
        return response
    except HttpError as error:
        print(f"⚠️ HttpError fetching data: {error}")
        return None
    except Exception as error:
        print(f"⚠️ Unexpected error fetching data: {error}")
        return None

def process_data(dataset):
    """Aggregate health data values"""
    try:
        if not dataset or 'point' not in dataset:
            print("No dataset or points to process")
            return 0

        total_value = 0
        points = dataset.get('point', [])
        for point in points:
            values = point.get('value', [])
            for value in values:
                # Try intVal first, then fpVal
                val = None
                if 'intVal' in value:
                    val = value['intVal']
                elif 'fpVal' in value:
                    val = value['fpVal']
                
                if val is not None:
                    try:
                        total_value += float(val)
                    except (TypeError, ValueError) as e:
                        print(f"Error converting value {val} to float: {e}")
                        continue

        print(f"Processed data total: {total_value}")
        return total_value
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return 0

@app.post("/health_data")
async def fetch_health_data(user_input: UserSelection):
    """Fetches health data based on user-selected mode"""
    try:
        now = datetime.now()
        print(f"Processing request for mode: {user_input.mode}")

        if user_input.mode == 1:  # Today's Data
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = now
        elif user_input.mode == 2:  # Past Days Data
            start_time = now - timedelta(days=user_input.days)
            start_time = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = now
        elif user_input.mode == 3:  # Custom Time Range
            start_time = now.replace(hour=user_input.start_hour, minute=0, second=0, microsecond=0)
            end_time = now.replace(hour=user_input.end_hour, minute=59, second=59, microsecond=999999)
        else:
            raise HTTPException(status_code=400, detail="Invalid mode. Choose 1, 2, or 3.")

        start_ns = int(start_time.timestamp() * 1000000000)
        end_ns = int(end_time.timestamp() * 1000000000)
        
        print(f"Time range: {start_time} to {end_time}")
        print(f"Nanoseconds range: {start_ns} to {end_ns}")

        health_data = {}
        for metric, data_source in DATA_SOURCES.items():
            print(f"Fetching {metric} data...")
            raw_data = retrieve_data(data_source, start_ns, end_ns)
            if raw_data:
                health_data[metric] = process_data(raw_data)
            else:
                health_data[metric] = 0

        response_data = {
            "mode_selected": {
                1: "Today's Data",
                2: f"Past {user_input.days} Days Data",
                3: f"Custom Time: {user_input.start_hour}:00 - {user_input.end_hour}:00"
            }.get(user_input.mode, "Unknown Mode"),
            "start_time": start_time.strftime('%Y-%m-%d %H:%M:%S'),
            "end_time": end_time.strftime('%Y-%m-%d %H:%M:%S'),
            "data": health_data
        }
        
        print(f"Returning response: {json.dumps(response_data)}")
        return response_data
    except Exception as e:
        print(f"Error in fetch_health_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 