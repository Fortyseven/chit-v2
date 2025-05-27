from flask import jsonify
from rich import print
from backpack.tools.keywords import getKeywords




def register_routes(app):
    @app.route('/api/help', methods=['GET'])
    def help():
        return jsonify({
            'endpoints': {
                '/query': {
                    'method': 'POST',
                    'description': 'Handles user queries and returns references based on the query.',
                    'params': {
                        'messages': 'List of messages in the conversation',
                        'settings': {
                            'model_name': 'Name of the model to use',
                            'temperature': 'Temperature for the model (default: 0.4)',
                            'num_ctx': 'Number of context tokens (default: 2048)'
                        }
                    }
                },
                '/api/health': {
                    'method': 'GET',
                    'description': 'Health check endpoint.'
                }
            }
        })