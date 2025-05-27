from bs4 import BeautifulSoup
import requests
from duckduckgo_search import DDGS
from backpack.utils.cache import http_cache
from backpack.tools.scraper import html_to_markdown
from backpack.utils.web import USER_AGENTS

# def fetchHtml(url):
#     """
#     Fetches the HTML content of a given URL.

#     Args:
#         url (str): The URL to fetch.

#     Returns:
#         str: The HTML content of the page.
#     """
#     headers = {
#         'User-Agent': USER_AGENTS['chit'],
#     }
#     response = requests.get(url, headers=headers)

#     if response.status_code == 200:
#         return response.text
#     else:
#         raise Exception(f"Failed to fetch {url}: {response.status_code}")

# def extract_ddg_lite_results(html, num_results=3):
#     """
#     Extracts search results from DuckDuckGo Lite HTML.

#     Args:
#         html (str): The HTML content from DuckDuckGo Lite search results.
#         num_results (int): The number of top results to return.

#     Returns:
#         list: A list of dictionaries containing the title and URL of the top results.
#     """
#     soup = BeautifulSoup(html, 'html.parser')
#     results = []

#     # Find all result links - in DDG Lite they have class='result-link'
#     result_links = soup.find_all('a', class_='result-link')

#     for link in result_links[:num_results]:
#         title = link.get_text(strip=True)
#         url = link.get('href', '')

#         if '//duckduckgo.com/l/?uddg=' in url:
#             # Extract the encoded URL
#             encoded_url = url.split('uddg=')[1].split('&')[0]
#             # Decode the URL
#             import urllib.parse
#             url = urllib.parse.unquote(encoded_url)

#         results.append({'title': title, 'url': url})

#     return results


# this is a WIP
def searchTop(search:str, num_results=5):
    results = DDGS().text(keywords=search, max_results=num_results)
    print(f"Search results for '{search}': {results}")

# def searchTopOld(search:str, num_results=5):
#     """
#     Searches for the top results using DuckDuckGo Lite and extracts the top results.

#     Args:
#         search (str): The search term.
#         num_results (int): The number of top results to extract.

#     Returns:
#         list: A list of dictionaries containing the title and URL of the top results.
#     """
#     # URL encode the search term
#     import urllib.parse
#     encoded_search = urllib.parse.quote(search)

#     # Use DuckDuckGo Lite which has a simpler HTML structure
#     url = f'https://lite.duckduckgo.com/lite/?q={encoded_search}'

#     # Set up headers to mimic a browser
#     headers = {
#         'User-Agent': USER_AGENTS['googlebot'],
#     }

#     print(f"Searching DuckDuckGo Lite for: {search}")
#     # Perform the search
#     response = requests.get(url, headers=headers)

#     # Check if request was successful
#     if response.status_code >= 300:
#         print(f"Failed to fetch search results: {response}")
#         return []

#     print("RESULTS:", response.status_code, response.text)

#     # Extract results
#     results = extract_ddg_lite_results(response.text, num_results)

#     print(f"Search results for '{search}': {results}")

#     for result in results:
#         try:
#             html = http_cache.get(result['url'])
#             print(f"Fetched HTML for {result['url']}")

#             result['url'] = result['url'].strip()
#             result['content'] = html_to_markdown(html)
#         except Exception as e:
#             print(f"Error processing URL {result['url']}: {e}")
#             result['content'] = f"Content could not be fetched or processed for {result['url']}."

#     return results
