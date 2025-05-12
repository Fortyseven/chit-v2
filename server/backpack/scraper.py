import requests
from bs4 import BeautifulSoup
import html2text
import re

def url_to_markdown(url):
    """
    Fetches a web page and converts it to Markdown format.
    Strips navigation elements, ads, and other non-content elements.

    Args:
        url: The URL of the web page to fetch

    Returns:
        A string containing the Markdown version of the main content
    """
    # Fetch the page
    headers = {
        # 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        # lynx
        # 'User-Agent': 'Lynx/2.8.9rel.1 libwww-FM/2.14 SSL-MM/1.4.1 OpenSSL/1.0.2k',
        # google bot
        # 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'

    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for bad responses

    # Parse with BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

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
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False
    h.body_width = 0  # No wrapping

    markdown_content = h.handle(str(main_content))

    # Clean up excessive newlines and spaces
    markdown_content = re.sub(r'\n{3,}', '\n\n', markdown_content)

    return markdown_content