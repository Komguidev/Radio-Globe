import os
import requests

API_KEY = os.getenv('OPENWEATHER_API_KEY')


def get_weather(city):
    """Fetch current weather information for a city using OpenWeather API."""
    if not API_KEY:
        raise EnvironmentError("OPENWEATHER_API_KEY environment variable not set")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "fr"
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def format_weather(data):
    """Return a human-friendly weather description from API response."""
    name = data.get("name")
    main = data.get("weather", [{}])[0].get("description", "")
    temp = data.get("main", {}).get("temp")
    return f"\u2601\uFE0F  {name}: {main}, {temp} \u00B0C"


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Get weather forecast for a city")
    parser.add_argument("city", help="City name, e.g., 'Paris'")
    args = parser.parse_args()

    try:
        data = get_weather(args.city)
        print(format_weather(data))
    except Exception as exc:
        print(f"Erreur lors de la r\xE9cup\xE9ration de la m\xE9t\xE9o: {exc}")




