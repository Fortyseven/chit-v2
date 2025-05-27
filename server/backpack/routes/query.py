from flask import request, jsonify
from rich import print
import backpack.tools.searchtop
from backpack.tools.keywords import getKeywords

TOOLS = {
    'wikipedia': {
        'name': 'Wikipedia',
        'description': 'Fetches a Wikipedia page and converts it to Markdown format.',
        'params': {
            'search_term': 'search term'
        },
    },
    'searchtop': {
        'name': 'SearchTop',
        'description': 'Fetches the top search results for a given search query.',
        'params': {
            'search_query': 'query to search with'
        },
    }
}

TOOLSETS = {
    'search': [
        'wikipedia',
        'searchtop',
    ],
    'geolocation': [
        #
    ]
}



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

        kw = getKeywords(settings, query)

        print("KW=", kw)

        references = []

        top_searches = backpack.tools.searchtop.searchTop(kw, 5)

        print("Top searches:", top_searches)

        references.append({
            "toolId": 'keywords',
            "referenceUrl": None,
            "referenceContent": kw
        })

        for result in top_searches:
            references.append({
                "toolId": 'search',
                "referenceUrl": result['url'],
                'referenceContent': result['content']
            })

        return jsonify({
            'response': references
        }), 200