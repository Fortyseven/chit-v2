# Web Content API Server

This is a simple Flask server that provides API endpoints for web content retrieval and conversion to Markdown.

## Setup

1. Create a virtual environment (recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python server.py
   ```

The server will start on http://localhost:5000

## API Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: `{"status": "ok"}`

### Fetch Page as Markdown
- **URL**: `/api/fetch-page`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "url": "https://example.com/some-article"
  }
  ```
- **Response**:
  ```json
  {
    "markdown": "# Article Title\n\nArticle content in markdown format..."
  }
  ```

## Example Usage

Using curl:
```
curl -X POST http://localhost:5000/api/fetch-page \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some-article"}'
```

Using JavaScript:
```javascript
fetch('http://localhost:5000/api/fetch-page', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/some-article'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data.markdown);
})
.catch(error => console.error('Error:', error));
```