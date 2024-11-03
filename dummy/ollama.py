from flask import Flask, request, jsonify

app = Flask(__name__)

# Dummy data for model names
models = ["llama3.2", "codellama:13b", "llava", "mistral:latest"]

# Dummy data for Modelfile contents
modelfiles = {
    "llama3.2": "# Modelfile generated by \"ollama show\"\n# To build a new Modelfile based on this one, replace the FROM line with:\n# FROM llava:latest\n\nFROM /Users/matt/.ollama/models/blobs/sha256:200765e1283640ffbd013184bf496e261032fa75b99498a9613be4e94d63ad52\nTEMPLATE \"\"\"{{ .System }}\nUSER: {{ .Prompt }}\nASSISTANT: \"\"\"\nPARAMETER num_ctx 4096\nPARAMETER stop \"\u003c/s\u003e\"\nPARAMETER stop \"USER:\"\nPARAMETER stop \"ASSISTANT:\"",
    "codellama:13b": "# Modelfile generated by \"ollama show\"\n# To build a new Modelfile based on this one, replace the FROM line with:\n# FROM llava:latest\n\nFROM /Users/matt/.ollama/models/blobs/sha256:200765e1283640ffbd013184bf496e261032fa75b99498a9613be4e94d63ad52\nTEMPLATE \"\"\"{{ .System }}\nUSER: {{ .Prompt }}\nASSISTANT: \"\"\"\nPARAMETER num_ctx 4096\nPARAMETER stop \"\u003c/s\u003e\"\nPARAMETER stop \"USER:\"\nPARAMETER stop \"ASSISTANT:\"",
    "llava": "# Modelfile generated by \"ollama show\"\n# To build a new Modelfile based on this one, replace the FROM line with:\n# FROM llava:latest\n\nFROM /Users/matt/.ollama/models/blobs/sha256:200765e1283640ffbd013184bf496e261032fa75b99498a9613be4e94d63ad52\nTEMPLATE \"\"\"{{ .System }}\nUSER: {{ .Prompt }}\nASSISTANT: \"\"\"\nPARAMETER num_ctx 4096\nPARAMETER stop \"\u003c/s\u003e\"\nPARAMETER stop \"USER:\"\nPARAMETER stop \"ASSISTANT:\"",
    "mistral:latest": "# Modelfile generated by \"ollama show\"\n# To build a new Modelfile based on this one, replace the FROM line with:\n# FROM llava:latest\n\nFROM /Users/matt/.ollama/models/blobs/sha256:200765e1283640ffbd013184bf496e261032fa75b99498a9613be4e94d63ad52\nTEMPLATE \"\"\"{{ .System }}\nUSER: {{ .Prompt }}\nASSISTANT: \"\"\"\nPARAMETER num_ctx 4096\nPARAMETER stop \"\u003c/s\u003e\"\nPARAMETER stop \"USER:\"\nPARAMETER stop \"ASSISTANT:\""
}

# Dummy data for model information
model_info = {
    "llama3.2": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": [
            "llama"
        ],
        "parameter_size": "8.0B",
        "quantization_level": "Q4_0"
    },
    "codellama:13b": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": [
            "llama"
        ],
        "parameter_size": "8.0B",
        "quantization_level": "Q4_0"
    },
    "llava": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": [
            "llama"
        ],
        "parameter_size": "8.0B",
        "quantization_level": "Q4_0"
    },
    "mistral:latest": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": [
            "llama"
        ],
        "parameter_size": "8.0B",
        "quantization_level": "Q4_0"
    }
}

@app.route('/api/generate', methods=['POST'])
def generate_completion():
    model_name = request.json['model']
    prompt = request.json.get('prompt')
    suffix = request.json.get('suffix')
    images = request.json.get('images')

    # Return dummy data
    return jsonify({
        'model': model_name,
        'created_at': random.randint(1, 1000),
        'response': f"Generated response for {prompt} with model {model_name}",
        'done': True,
        'total_duration': random.randint(1, 10000000),
        'load_duration': random.randint(1, 10000000),
        'prompt_eval_count': random.randint(1, 10),
        'prompt_eval_duration': random.randint(1, 10000000)
    })

@app.route('/api/generate', methods=['POST'])
def generate_completion_json():
    model_name = request.json['model']
    prompt = request.json.get('prompt')
    suffix = request.json.get('suffix')
    images = request.json.get('images')

    return jsonify({
        'status': 'success'
    })

@app.route('/api/chat', methods=['POST'])
def generate_chat_completion():
    model_name = request.json['model']
    messages = request.json.get('messages')

    # Return dummy data
    return jsonify({
        'model': model_name,
        'created_at': random.randint(1, 1000),
        'response': f"Generated response for {messages[0]['role']} with model {model_name}",
        'done': True,
        'total_duration': random.randint(1, 10000000),
        'load_duration': random.randint(1, 10000000)
    })

@app.route('/api/embeddings', methods=['POST'])
def generate_embeddings():
    model_name = request.json['model']
    prompt = request.json.get('prompt')

    # Return dummy data
    return jsonify({
        'embedding': [random.random() for _ in range(10)],
        'total_duration': random.randint(1, 10000000),
        'load_duration': random.randint(1, 10000000)
    })

@app.route('/api/embed', methods=['POST'])
def generate_embeddings_endpoint():
    model_name = request.json['model']
    prompt = request.json.get('prompt')

    return jsonify({
        'embedding': [random.random() for _ in range(10)],
        'total_duration': random.randint(1, 10000000),
        'load_duration': random.randint(1, 10000000)
    })

@app.route('/api/show', methods=['POST'])
def show_model_info():
    model_name = request.json['model']

    # Return dummy data
    return jsonify({
        'modelfile': modelfiles[model_name],
        'parameters': model_info[model_name]['parameter_size'],
        'template': model_info[model_name]['format']
    })

@app.route('/api/create', methods=['POST'])
def create_model():
    model_name = request.json['name']

    # Return dummy data
    return jsonify({
        'status': 'success'
    })

@app.route('/api/delete', methods=['DELETE'])
def delete_model():
    model_name = request.json['name']

    # Return dummy data
    return jsonify({
        'status': 'success'
    })

@app.route('/api/push', methods=['POST'])
def push_model():
    model_name = request.json['name']

    # Return dummy data
    return jsonify({
        'status': 'success'
    })

@app.route('/api/list', methods=['GET'])
def list_models():
    return jsonify(models)

if __name__ == '__main__':
    app.run(debug=True)