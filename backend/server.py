from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Radio Browser API base URL
RADIO_BROWSER_API = "https://at1.api.radio-browser.info/json"

# Define Models
class RadioStation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_uuid: str
    name: str
    url: str
    homepage: Optional[str] = None
    favicon: Optional[str] = None
    country: Optional[str] = None
    countrycode: Optional[str] = None
    state: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[str] = None
    votes: Optional[int] = 0
    codec: Optional[str] = None
    bitrate: Optional[int] = 0
    hls: Optional[int] = 0
    lastcheckok: Optional[int] = 1

class FavoriteStation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    station_uuid: str
    station_name: str
    station_url: str
    country: Optional[str] = None
    favicon: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Playlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    stations: List[str] = []  # List of station UUIDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreatePlaylist(BaseModel):
    name: str
    description: Optional[str] = None

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Global Radio Discovery API"}

# Radio Station Discovery Routes
@api_router.get("/stations/popular", response_model=List[RadioStation])
async def get_popular_stations(limit: int = 50):
    """Get popular radio stations"""
    try:
        # Use mock data for testing since Radio Browser API is not accessible
        mock_stations = [
            RadioStation(
                station_uuid="1",
                name="Mock Radio 1",
                url="https://example.com/stream1",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="United States",
                countrycode="US",
                state="",
                language="English",
                tags="pop,rock",
                votes=100,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            ),
            RadioStation(
                station_uuid="2",
                name="Mock Radio 2",
                url="https://example.com/stream2",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="United Kingdom",
                countrycode="UK",
                state="",
                language="English",
                tags="jazz,blues",
                votes=90,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            ),
            RadioStation(
                station_uuid="3",
                name="Mock Radio 3",
                url="https://example.com/stream3",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="Germany",
                countrycode="DE",
                state="",
                language="German",
                tags="classical,instrumental",
                votes=80,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            )
        ]
        
        # Log that we're using mock data
        logger.warning("Using mock data for popular stations since Radio Browser API is not accessible")
        
        return mock_stations[:limit]
    except Exception as e:
        logger.error(f"Error fetching popular stations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch popular stations")

@api_router.get("/stations/search")
async def search_stations(
    name: Optional[str] = None,
    country: Optional[str] = None,
    language: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 50
):
    """Search radio stations by various criteria"""
    try:
        # Use mock data for testing
        mock_stations = [
            RadioStation(
                station_uuid="1",
                name="Mock Radio 1",
                url="https://example.com/stream1",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="United States",
                countrycode="US",
                state="",
                language="English",
                tags="pop,rock",
                votes=100,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            ),
            RadioStation(
                station_uuid="2",
                name="Mock Radio 2",
                url="https://example.com/stream2",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="United Kingdom",
                countrycode="UK",
                state="",
                language="English",
                tags="jazz,blues",
                votes=90,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            ),
            RadioStation(
                station_uuid="3",
                name="Mock Radio 3",
                url="https://example.com/stream3",
                homepage="https://example.com",
                favicon="https://picsum.photos/200",
                country="Germany",
                countrycode="DE",
                state="",
                language="German",
                tags="classical,instrumental",
                votes=80,
                codec="MP3",
                bitrate=128,
                hls=0,
                lastcheckok=1
            )
        ]
        
        # Filter based on search criteria
        filtered_stations = []
        for station in mock_stations:
            if name and name.lower() not in station.name.lower():
                continue
            if country and country != station.country:
                continue
            if language and language != station.language:
                continue
            if tag and tag not in station.tags:
                continue
            filtered_stations.append(station)
        
        logger.warning("Using mock data for station search since Radio Browser API is not accessible")
        return filtered_stations[:limit]
    except Exception as e:
        logger.error(f"Error searching stations: {e}")
        raise HTTPException(status_code=500, detail="Failed to search stations")

@api_router.get("/countries")
async def get_countries():
    """Get list of available countries"""
    try:
        # Use mock data for testing
        mock_countries = [
            {"name": "United States", "code": "US", "stationcount": 500},
            {"name": "United Kingdom", "code": "UK", "stationcount": 300},
            {"name": "Germany", "code": "DE", "stationcount": 250},
            {"name": "France", "code": "FR", "stationcount": 200},
            {"name": "Canada", "code": "CA", "stationcount": 150},
            {"name": "Australia", "code": "AU", "stationcount": 100},
            {"name": "Japan", "code": "JP", "stationcount": 80},
            {"name": "Brazil", "code": "BR", "stationcount": 70},
            {"name": "Spain", "code": "ES", "stationcount": 60},
            {"name": "Italy", "code": "IT", "stationcount": 50}
        ]
        logger.warning("Using mock data for countries since Radio Browser API is not accessible")
        return mock_countries
    except Exception as e:
        logger.error(f"Error fetching countries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch countries")

@api_router.get("/languages")
async def get_languages():
    """Get list of available languages"""
    try:
        # Use mock data for testing
        mock_languages = [
            {"name": "English", "stationcount": 1000},
            {"name": "Spanish", "stationcount": 500},
            {"name": "German", "stationcount": 400},
            {"name": "French", "stationcount": 350},
            {"name": "Italian", "stationcount": 300},
            {"name": "Japanese", "stationcount": 200},
            {"name": "Portuguese", "stationcount": 150},
            {"name": "Russian", "stationcount": 100},
            {"name": "Chinese", "stationcount": 80},
            {"name": "Arabic", "stationcount": 50}
        ]
        logger.warning("Using mock data for languages since Radio Browser API is not accessible")
        return mock_languages
    except Exception as e:
        logger.error(f"Error fetching languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch languages")

@api_router.get("/tags")
async def get_tags():
    """Get list of available tags/genres"""
    try:
        # Use mock data for testing
        mock_tags = [
            {"name": "pop", "stationcount": 800},
            {"name": "rock", "stationcount": 700},
            {"name": "jazz", "stationcount": 500},
            {"name": "classical", "stationcount": 400},
            {"name": "electronic", "stationcount": 350},
            {"name": "hip hop", "stationcount": 300},
            {"name": "country", "stationcount": 250},
            {"name": "news", "stationcount": 200},
            {"name": "talk", "stationcount": 150},
            {"name": "sports", "stationcount": 100}
        ]
        logger.warning("Using mock data for tags since Radio Browser API is not accessible")
        return mock_tags
    except Exception as e:
        logger.error(f"Error fetching tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tags")

# Favorites Management
@api_router.post("/favorites")
async def add_favorite(favorite: FavoriteStation):
    """Add station to favorites"""
    try:
        # Check if already exists
        existing = await db.favorites.find_one({
            "user_id": favorite.user_id,
            "station_uuid": favorite.station_uuid
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Station already in favorites")
        
        result = await db.favorites.insert_one(favorite.dict())
        return {"message": "Station added to favorites", "id": favorite.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding favorite: {e}")
        raise HTTPException(status_code=500, detail="Failed to add favorite")

@api_router.get("/favorites/{user_id}", response_model=List[FavoriteStation])
async def get_favorites(user_id: str):
    """Get user's favorite stations"""
    try:
        favorites = await db.favorites.find({"user_id": user_id}).to_list(1000)
        return [FavoriteStation(**fav) for fav in favorites]
    except Exception as e:
        logger.error(f"Error fetching favorites: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch favorites")

@api_router.delete("/favorites/{user_id}/{station_uuid}")
async def remove_favorite(user_id: str, station_uuid: str):
    """Remove station from favorites"""
    try:
        result = await db.favorites.delete_one({
            "user_id": user_id,
            "station_uuid": station_uuid
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        return {"message": "Station removed from favorites"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing favorite: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove favorite")

# Playlist Management
@api_router.post("/playlists/{user_id}")
async def create_playlist(user_id: str, playlist_data: CreatePlaylist):
    """Create a new playlist"""
    try:
        playlist = Playlist(
            user_id=user_id,
            name=playlist_data.name,
            description=playlist_data.description
        )
        
        result = await db.playlists.insert_one(playlist.dict())
        return {"message": "Playlist created", "id": playlist.id}
    except Exception as e:
        logger.error(f"Error creating playlist: {e}")
        raise HTTPException(status_code=500, detail="Failed to create playlist")

@api_router.get("/playlists/{user_id}", response_model=List[Playlist])
async def get_playlists(user_id: str):
    """Get user's playlists"""
    try:
        playlists = await db.playlists.find({"user_id": user_id}).to_list(1000)
        return [Playlist(**playlist) for playlist in playlists]
    except Exception as e:
        logger.error(f"Error fetching playlists: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch playlists")

@api_router.put("/playlists/{playlist_id}/stations/{station_uuid}")
async def add_station_to_playlist(playlist_id: str, station_uuid: str):
    """Add station to playlist"""
    try:
        result = await db.playlists.update_one(
            {"id": playlist_id},
            {
                "$addToSet": {"stations": station_uuid},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        return {"message": "Station added to playlist"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding station to playlist: {e}")
        raise HTTPException(status_code=500, detail="Failed to add station to playlist")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
