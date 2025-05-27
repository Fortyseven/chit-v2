from flask import Flask, jsonify
from flask_cors import CORS
from rich import print

import backpack.routes

PORT = 12434

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

backpack.routes.query.register_routes(app)
backpack.routes.health.register_routes(app)
backpack.routes.help.register_routes(app)

# if __name__ == '__main__':
app.run(debug=True, host='0.0.0.0', port=PORT)
