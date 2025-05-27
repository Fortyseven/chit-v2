import requests
import time
from typing import Dict, Any, Optional
import json
import logging
from backpack.utils.web import USER_AGENTS

TTL_SECONDS = 60 * 10 * 3

DEFAULT_HEADERS = {
    'User-Agent': USER_AGENTS['googlebot'],
}

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('HTTPCache')

class HTTPCache:
    def __init__(self, ttl_seconds: int = TTL_SECONDS):
        """
        Initialize the in-memory HTTP cache with a specified TTL.

        Args:
            ttl_seconds: Time to live in seconds (default: 10 minutes)
        """
        self.ttl_seconds = ttl_seconds
        self.cache = {}  # In-memory cache dictionary
        self.url_handlers = {}  # Pattern-based URL handlers

    def url_handler(self, url_pattern: str):
        """
        Decorator to register a function as a handler for a specific URL pattern.

        Usage:
            @http_cache.url_handler('wikipedia.org')
            def handle_wikipedia(url, headers):
                # Custom implementation
                return data

        Args:
            url_pattern: String pattern to match against URLs (e.g. 'linkedin.com', 'wikipedia.org')

        Returns:
            Decorator function that registers the handler
        """
        def decorator(handler_func):
            self.register_url_handler(url_pattern, handler_func)
            return handler_func
        return decorator

    def register_url_handler(self, url_pattern: str, handler_func):
        """
        Register a custom handler function for URLs matching a specific pattern.

        Args:
            url_pattern: String pattern to match against URLs (e.g. 'linkedin.com', 'wikipedia.org')
            handler_func: Function that takes a URL and headers and returns data
        """
        self.url_handlers[url_pattern] = handler_func
        logger.info(f"Registered custom URL handler for pattern: {url_pattern}")

    def get(self, url: str, headers: Dict[str, str] = DEFAULT_HEADERS) -> Any:
        """
        Get data for the URL, either from cache if valid or by making a fresh request.
        If a custom URL handler is registered for this URL pattern, it will be used.

        Args:
            url: The URL to fetch or retrieve from cache
            headers: Optional HTTP headers for the request

        Returns:
            The response content (usually parsed JSON or text)
        """
        # Check if we have a valid cache entry
        cached_data = self._get_from_cache(url)
        if cached_data:
            logger.info(f"Cache HIT for {url}")
            return cached_data

        # Check if we have a custom handler for this URL
        for pattern, handler in self.url_handlers.items():
            if pattern in url:
                logger.info(f"Using custom handler for {url} (pattern: {pattern})")
                data = handler(url, headers)
                self._store_in_cache(url, data)
                return data

        # No valid cache or custom handler, make a fresh request
        logger.info(f"Cache MISS for {url}, fetching fresh data")
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise exception for bad responses

        # Try to parse as JSON, fallback to text
        try:
            data = response.json()
        except json.JSONDecodeError:
            data = response.text

        # Store in cache
        self._store_in_cache(url, data)
        logger.info(f"Stored fresh data in cache for {url}")

        return data

    def _get_from_cache(self, url: str) -> Optional[Any]:
        """Retrieve and validate data from cache if it exists and is not expired."""
        if url not in self.cache:
            logger.debug(f"No cache entry found for {url}")
            return None

        cache_entry = self.cache[url]

        # Check if cache is still valid
        timestamp = cache_entry.get('timestamp', 0)
        time_diff = time.time() - timestamp
        if time_diff <= self.ttl_seconds:
            logger.debug(f"Cache entry valid for {url} (age: {time_diff:.1f}s of {self.ttl_seconds}s TTL)")
            return cache_entry.get('data')

        # Cache is stale, remove it
        logger.debug(f"Cache entry expired for {url} (age: {time_diff:.1f}s > {self.ttl_seconds}s TTL)")
        del self.cache[url]
        return None

    def _store_in_cache(self, url: str, data: Any) -> None:
        """Store data in cache with current timestamp."""
        self.cache[url] = {
            'timestamp': time.time(),
            'data': data
        }

    def clear(self, url: str = None) -> None:
        """
        Clear cache for a specific URL or all cached data.

        Args:
            url: Optional URL to clear. If None, clears entire cache.
        """
        if url:
            if url in self.cache:
                del self.cache[url]
                logger.info(f"Cleared cache for {url}")
        else:
            # Clear all cache
            self.cache = {}
            logger.info("Cleared entire cache")

# Create a global instance with default 10-minute TTL
http_cache = HTTPCache()

# Usage examples:
# Basic usage
# from backpack.cache import http_cache
# data = http_cache.get("https://api.example.com/data")

# Example of using the decorator for custom URL handlers:
"""
from backpack.cache import http_cache

# Custom handler for Wikipedia to use their API instead of scraping HTML
@http_cache.url_handler('wikipedia.org')
def handle_wikipedia(url, headers):
    # Extract article name from URL
    article_name = url.split('/wiki/')[1]
    # Use Wikipedia's API instead of scraping the HTML
    api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{article_name}"
    response = requests.get(api_url, headers=headers)
    return response.json()

# Custom handler for LinkedIn profiles
@http_cache.url_handler('linkedin.com/pub/dir')
def handle_linkedin_directory(url, headers):
    # Custom LinkedIn-specific logic here
    # This could use a specialized scraper or API
    custom_headers = headers.copy()
    custom_headers['Accept'] = 'application/json'
    # Implement your custom retrieval logic
    return {"custom": "data", "source": url}

# Then use normally - custom handlers are used automatically when URLs match
wiki_data = http_cache.get("https://en.wikipedia.org/wiki/Python_(programming_language)")
linkedin_data = http_cache.get("https://www.linkedin.com/pub/dir/Tom/Longfield")
"""