import json
from flask import request, jsonify
from rich import print
import ollama
from backpack.tools.keywords import getKeywords
from backpack.utils.cache import http_cache
from backpack.tools.scraper import url_to_markdown

TOOLS = {
    'wikipedia': {
        'description': 'Fetches a Wikipedia page and converts it to Markdown format.',
        'param': {
            'search_term': 'search term'
        },
    },
    'searchtop': {
        'description': 'Fetches the top search results for a given search query.',
        'param': {
            'search_query': 'query to search with'
        },
    },
    'aircraft_registry_lookup': {
        'description': 'Fetches information about a plane based on its registration number. It can ONLY lookup registration numbers.',
        'param': {
            'registry_number': 'Plane registration number'
        },
    },
    'flight_lookup': {
        'description': 'Fetches information about a flight based on its flight number. It can ONLY lookup flight numbers, not other identifiers.',
        'param': {
            'flight_number': 'Flight number to look up'
        },
    }
}

TOOLSETS = {
    'search': [
        'wikipedia',
        'searchtop',
        'aircraft_registry_lookup',
        'flight_lookup'
    ],
    'geolocation': [
        #
    ]
}
def getAllUserMessages(query):
    message_content = ""

    for message in query['messages']:
        if message['role'] == 'user':
            message_content += f"{message['content']}\n---"

    return message_content


def queryForTools(query, settings, mode=None):
    system = """
    Based on the following chat queries, suggest tools that can be used to answer the user's question.
    The most recent user query is the most important.
    Only provide one parameter for each tool.
    Strictly obey the description of each tool and its parameters. DO NOT PASS ANYTHING ELSE THAN THE PARAMETERS DESCRIBED IN THE TOOL DESCRIPTION.
    Do not invent new information, only use the information provided in the chat messages.
    """
    # Select tools from the following list:
    # """
    # for tool in TOOLSETS[mode]:
    #     tool_id = tool
    #     tool_param = TOOLS[tool]['param']
    #     system += f"\n- `{tool_id}({', '.join(tool_param.keys())})`: {TOOLS[tool]['description']}"


    # system += "\n\nOnly suggest tools that are directly relevant to the user's query. Do not suggest tools that are not in the list."
    # system += "\n\nIf no tools are relevant, return an empty list."

    print("System prompt:", system)

    message_content = getAllUserMessages(query)

    print("---")
    print("User messages:", message_content)

    print("---")
    print("mode:", mode)

    if mode:
        tools = []
        for tool in TOOLSETS[mode]:
            tools.append({
                'type': 'function',
                'function': {
                    'name': tool,
                    'description': TOOLS[tool]['description'],
                    'parameters': {
                        'type': 'object',
                        'properties': {
                            'param': {
                                'type': 'string'
                            }
                        },
                        'required': ['param']
                    }
                }
            })

        response = ollama.chat(
            model=settings['model'],
            stream=False,
            options={
                'temperature': settings.get('temperature', 0.4),
                'num_ctx': settings.get('num_ctx', 2048),
            },
            messages=[
                {'role': 'system', 'content': "You are a helpful assistant that suggests tools based on user queries."},
                {'role': 'user', 'content': message_content}
            ],
            tools=tools if mode else None,
            format={
                "type": "object",
                "properties": {
                    "tools": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "toolId": {
                                    "type": "enum",
                                    "enum": list(TOOLSETS[mode]),
                                },
                                "param": {
                                    "type": "string",
                                },
                                "why": {
                                    "type": "string",
                                    "description": "Why this tool was selected."
                                }
                            }
                        }
                    }
                }
            }
        )

    return json.loads(response.message.content)

def findValidURLs(query:str) -> set:
    """
    finds valid urls in a query string but does not require http(s):// prefix.
    """

    import re
    # Regular expression to match URLs without http(s):// prefix
    url_pattern = r'\b(?:www\.|[a-zA-Z0-9._%+-]+)\.[a-zA-Z]{2,}(?:/[^\s]*)?\b'

    # Find all matches in the query string
    urls = re.findall(url_pattern, query)

    # Return unique URLs as a set
    return set(urls)

def getSiteContents(query):
    """
    Extracts URLs from the query and returns them.
    Fetches the content of each URL and returns it as markdown.
    """
    site_data = list()  # Use a list instead of a set since dictionaries are unhashable
    message_content = getAllUserMessages(query)
    urls = findValidURLs(message_content)

    if not urls:
        return None

    print("Found URLs:", urls)

    for url in urls:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        site_data.append({
            'url': url,
            'content': url_to_markdown(url)
        })

    # Return the list of site data
    return site_data

def register_routes(app):
    @app.route('/query', methods=['POST'])
    def query():
        """
        Endpoint to handle queries.
        """
        query = request.get_json()
        if not query or 'messages' not in query:
            return jsonify({'error': 'Invalid request, proper query is required'}), 400

        settings = query['settings'] # temperature, num_ctx
        settings['model'] = query['model_name']

        mode = query.get('backpackMode', None)

        references = []

        if (mode):
            tools = queryForTools(query, settings, mode)

            print("Tools to use:", tools)

            # kw = getKeywords(settings, query)

            # print("KW=", kw)


            # top_searches = backpack.tools.searchtop.searchTop(kw, 5)

            # print("Top searches:", top_searches)

            # references.append({
            #     "toolId": 'keywords',
            #     "referenceUrl": None,
            #     "referenceContent": kw
            # })

            # for result in top_searches:
            #     references.append({
            #         "toolId": 'search',
            #         "referenceUrl": result['url'],
            #         'referenceContent': result['content']
            #     })

        # general query handling

        sites = getSiteContents(query)

        if sites:
            for site in sites:
                print(f"- Fetched site content for {site['url']}")
                references.append({
                    "toolId": 'html',
                    "referenceUrl": site['url'],
                    "referenceContent": site['content']
                })


        return jsonify({
            'response': references
        }), 200