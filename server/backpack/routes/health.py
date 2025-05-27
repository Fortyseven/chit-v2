from flask import jsonify
from rich import print
from backpack.tools.keywords import getKeywords




def register_routes(app):
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok'})
