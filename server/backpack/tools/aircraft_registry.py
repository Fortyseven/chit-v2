
import requests
from bs4 import BeautifulSoup
from rich import print

FAA_URL = "https://registry.faa.gov/aircraftinquiry/Search/NNumberResult"

def tool_aircraft_registry(search:str) -> str:
    print(f"Fetching aircraft registry for: {search} ")
    response = requests.post(FAA_URL, data={'NNumbertxt': search})
    if response.status_code != 200:
        print(f"Error fetching aircraft registry: {response.status_code}")
        return "Error fetching aircraft registry"

    print(response.text)