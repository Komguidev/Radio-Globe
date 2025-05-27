
import requests
import sys
import json
import uuid
from datetime import datetime

class RadioAPITester:
    def __init__(self, base_url="https://e1b9b4b1-d869-4b57-922b-4de0249c8cd2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = f"test-user-{uuid.uuid4()}"
        self.test_station = None
        self.playlist_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except json.JSONDecodeError:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_popular_stations(self):
        """Test getting popular stations"""
        success, response = self.run_test("Get Popular Stations", "GET", "stations/popular", 200)
        if success and len(response) > 0:
            self.test_station = response[0]
            print(f"Found {len(response)} stations")
            return True
        return False

    def test_search_stations(self):
        """Test searching stations"""
        params = {"limit": 10}
        if self.test_station and self.test_station.get("country"):
            params["country"] = self.test_station.get("country")
        
        success, response = self.run_test(
            "Search Stations", 
            "GET", 
            "stations/search", 
            200,
            params=params
        )
        if success:
            print(f"Found {len(response)} stations in search")
            return True
        return False

    def test_get_countries(self):
        """Test getting countries list"""
        success, response = self.run_test("Get Countries", "GET", "countries", 200)
        if success:
            print(f"Found {len(response)} countries")
            return True
        return False

    def test_get_languages(self):
        """Test getting languages list"""
        success, response = self.run_test("Get Languages", "GET", "languages", 200)
        if success:
            print(f"Found {len(response)} languages")
            return True
        return False

    def test_get_tags(self):
        """Test getting tags/genres list"""
        success, response = self.run_test("Get Tags", "GET", "tags", 200)
        if success:
            print(f"Found {len(response)} tags")
            return True
        return False

    def test_add_favorite(self):
        """Test adding a station to favorites"""
        if not self.test_station:
            print("❌ No test station available for favorites test")
            return False
        
        favorite_data = {
            "user_id": self.user_id,
            "station_uuid": self.test_station.get("station_uuid"),
            "station_name": self.test_station.get("name"),
            "station_url": self.test_station.get("url"),
            "country": self.test_station.get("country"),
            "favicon": self.test_station.get("favicon")
        }
        
        success, response = self.run_test(
            "Add Favorite", 
            "POST", 
            "favorites", 
            200,
            data=favorite_data
        )
        return success

    def test_get_favorites(self):
        """Test getting user's favorites"""
        success, response = self.run_test(
            "Get Favorites", 
            "GET", 
            f"favorites/{self.user_id}", 
            200
        )
        if success:
            print(f"Found {len(response)} favorites for user")
            return True
        return False

    def test_remove_favorite(self):
        """Test removing a station from favorites"""
        if not self.test_station:
            print("❌ No test station available for remove favorite test")
            return False
        
        success, _ = self.run_test(
            "Remove Favorite", 
            "DELETE", 
            f"favorites/{self.user_id}/{self.test_station.get('station_uuid')}", 
            200
        )
        return success

    def test_create_playlist(self):
        """Test creating a playlist"""
        playlist_data = {
            "name": f"Test Playlist {datetime.now().strftime('%H:%M:%S')}",
            "description": "Created by automated test"
        }
        
        success, response = self.run_test(
            "Create Playlist", 
            "POST", 
            f"playlists/{self.user_id}", 
            200,
            data=playlist_data
        )
        
        if success and "id" in response:
            self.playlist_id = response.get("id")
            return True
        return False

    def test_get_playlists(self):
        """Test getting user's playlists"""
        success, response = self.run_test(
            "Get Playlists", 
            "GET", 
            f"playlists/{self.user_id}", 
            200
        )
        if success:
            print(f"Found {len(response)} playlists for user")
            return True
        return False

    def test_add_station_to_playlist(self):
        """Test adding a station to a playlist"""
        if not self.test_station or not self.playlist_id:
            print("❌ Missing test station or playlist for add to playlist test")
            return False
        
        success, _ = self.run_test(
            "Add Station to Playlist", 
            "PUT", 
            f"playlists/{self.playlist_id}/stations/{self.test_station.get('station_uuid')}", 
            200
        )
        return success

def main():
    # Setup
    tester = RadioAPITester()
    
    # Run tests
    print("\n🔍 TESTING GLOBAL RADIO DISCOVERY API\n")
    
    # Basic API tests
    tester.test_api_root()
    
    # Radio station discovery tests
    tester.test_get_popular_stations()
    tester.test_search_stations()
    tester.test_get_countries()
    tester.test_get_languages()
    tester.test_get_tags()
    
    # Favorites management tests
    tester.test_add_favorite()
    tester.test_get_favorites()
    tester.test_remove_favorite()
    
    # Playlist management tests
    tester.test_create_playlist()
    tester.test_get_playlists()
    tester.test_add_station_to_playlist()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
