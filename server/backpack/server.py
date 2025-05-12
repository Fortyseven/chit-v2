from flask import Flask, request, jsonify
from flask_cors import CORS
import backpack.scraper
import backpack.searchtop
import base64

PORT = 12434


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/api/get-page-markdown', methods=['GET'])
def fetch_page():
    # get 'url'; decode base 64 if needed
    if 'url' in request.args:
        url = request.args['url']
    elif 'url64' in request.args:
        url = base64.b64decode(request.args['url64']).decode('utf-8')
    else:
        url = None

    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400

    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        markdown_content = backpack.scraper.url_to_markdown(url)
        return jsonify({'markdown': markdown_content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search-top-3', methods=['GET'])
def search_top_3():
    # get 'search term'
    if 'search' in request.args:
        search = request.args['search']
    else:
        search = None
    if not search:
        return jsonify({'error': 'Search term parameter is required'}), 400

    try:
        result = backpack.searchtop.searchTop(search, 3)

        return jsonify({'search': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})


@app.route('/api/help', methods=['GET'])
def help():
    return jsonify({
        'endpoints': {
            '/api/get-page-markdown': {
                'method': 'GET',
                'description': 'Fetches a web page and converts it to Markdown format.',
                'params': {
                    'url': 'The URL of the web page to fetch'
                }
            },
            '/api/health': {
                'method': 'GET',
                'description': 'Health check endpoint.'
            }
        }
    })

# if __name__ == '__main__':
app.run(debug=True, host='0.0.0.0', port=PORT)
