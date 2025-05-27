import json
import ollama


def getKeywords(settings, query):
    system = """
    Based on the following chat queries, create the text of a search engine query that will most lkely return the most relevant search results.
    The most recent user query is the most important.
    Use a "-" prefix before words to indicate negation where applicable.
    Surround words in quotation marks if they are phrases, names, or specific terms.
    Do not invent new information, only use the information provided in the chat messages.
    Do not answer the question in the search query, just create a search query that can be used to find relevant information.
    ONLY USE THE INFORMATION PROVIDED IN THE CHAT MESSAGES. DO NOT EMBELLISH OR ADD ANYTHING THAT IS NOT IN THE MESSAGES.
    """

    message_content = ""

    for message in query['messages']:
        if message['role'] == 'user':
            message_content += f"User: {message['content']}\n---"

    response = ollama.chat(
        model=settings['model'],
        stream=False,
        options={
            'temperature': settings.get('temperature', 0.4),
            'num_ctx': settings.get('num_ctx', 2048),
        },
        messages= [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': message_content}
        ],
        format={
            "type":"object",
            "properties": {
                "search_query": {
                    "type": "string"
                }
            }
        }
    )
    kws = json.loads(response.message.content)
    print("KWS", kws)
    return kws['search_query']