from bs4 import BeautifulSoup
import requests
import re


def extract_ddg_lite_results(html, num_results=3):
    """
    Extracts search results from DuckDuckGo Lite HTML.

    Args:
        html (str): The HTML content from DuckDuckGo Lite search results.
        num_results (int): The number of top results to return.

    Returns:
        list: A list of dictionaries containing the title and URL of the top results.
    """
    soup = BeautifulSoup(html, 'html.parser')
    results = []

    # Find all result links - in DDG Lite they have class='result-link'
    result_links = soup.find_all('a', class_='result-link')

    for link in result_links[:num_results]:
        title = link.get_text(strip=True)
        url = link.get('href', '')

        # DDG Lite uses redirects with the format //duckduckgo.com/l/?uddg=<encoded_url>
        if '//duckduckgo.com/l/?uddg=' in url:
            # Extract the encoded URL
            encoded_url = url.split('uddg=')[1].split('&')[0]
            # Decode the URL
            import urllib.parse
            url = urllib.parse.unquote(encoded_url)

        results.append({'title': title, 'url': url})

    return results

def searchTop(search, num_results=3):
    """
    Searches for the top results using DuckDuckGo Lite and extracts the top results.

    Args:
        search (str): The search term.
        num_results (int): The number of top results to extract.

    Returns:
        list: A list of dictionaries containing the title and URL of the top results.
    """
    # URL encode the search term
    import urllib.parse
    encoded_search = urllib.parse.quote(search)

    # Use DuckDuckGo Lite which has a simpler HTML structure
    url = f'https://lite.duckduckgo.com/lite/?q={encoded_search}'

    # Set up headers to mimic a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }

    # Perform the search
    response = requests.get(url, headers=headers)

    # Check if request was successful
    if response.status_code != 200:
        return []

    # Extract results
    results = extract_ddg_lite_results(response.text, num_results)

    return results
