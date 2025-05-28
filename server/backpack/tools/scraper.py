import requests
from bs4 import BeautifulSoup
import html2text
import re
from ..utils.web import USER_AGENTS
from backpack.utils.cache import http_cache

def html_to_markdown(html):
    """
    Converts HTML content to Markdown format.

    Args:
        html: The HTML content to convert

    Returns:
        A string containing the Markdown version of the HTML
    """
    # Parse with BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')

    # Convert to Markdown
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False
    h.body_width = 0  # No wrapping

    markdown_content = h.handle(str(soup))

    # Clean up excessive newlines and spaces
    markdown_content = re.sub(r'\n{3,}', '\n\n', markdown_content)

    return markdown_content


def wikipedia_to_markdown(url):
    response = requests.get(
        'https://en.wikipedia.org/w/api.php',
        params={
            'action': 'query',
            'format': 'json',
            'titles': url.split('/')[-1],
            'prop': 'extracts',
            'exintro': True,
            'explaintext': True,
        },
        headers={
            'User-Agent': USER_AGENTS['chit'],
        }
    ).json()
    page = next(iter(response['query']['pages'].values()))
    if 'extract' in page:
        # Convert to Markdown
        markdown_content = html_to_markdown(page['extract'])
        print(page['extract'])
        return markdown_content
    else:
        raise ValueError("No extract found for the given Wikipedia page.")





def url_to_markdown(url):
    """
    Fetches a web page and converts it to Markdown format.
    Strips navigation elements, ads, and other non-content elements.

    Args:
        url: The URL of the web page to fetch

    Returns:
        A string containing the Markdown version of the main content
    """

    # is wikipedia? let's call another function
    if 'wikipedia.org' in url:
        # Use a different function for Wikipedia
        return wikipedia_to_markdown(url)
        # pass

    response = http_cache.get(url)

    # Parse with BeautifulSoup
    soup = BeautifulSoup(response, 'html.parser')

    # Remove common non-content elements
    for element in soup.select('nav, header, footer, aside, .ads, .navigation, .menu, .comments, script, style'):
        element.decompose()

    # Try to find the main content
    main_content = None
    for selector in ['main', 'article', '.content', '#content', '.post', '.entry']:
        content = soup.select_one(selector)
        if content:
            main_content = content
            break

    # If no main content found, use the whole body
    if not main_content:
        main_content = soup.body

    # Convert to Markdown
    markdown_content = html_to_markdown(str(main_content))

    return markdown_content