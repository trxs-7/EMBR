from bs4 import BeautifulSoup
import requests
import os
from groq import Groq
import instructor
from pydantic import BaseModel
import json
import sys

url = sys.argv[1]

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

def scrape_website(url):
    # Fetch the webpage
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch {url} (Status Code: {response.status_code})")
        return None

    # Parse the HTML
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract title
    title = soup.title.string if soup.title else "No Title Found"

    # Extract images
    images = [img['src'] for img in soup.find_all('img') if img.get('src')]

    # Extract text (remove scripts, styles, and excessive whitespace)
    for script in soup(["script", "style"]):
        script.extract()
    text = ' '.join(soup.get_text().split())

    return {
        "title": title,
        "images": images,
        "text": text  # Limit text output for readability
    }

def summarise(data, model):
    # Initialize with API key and enable instructor patches for Groq client
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    client = instructor.from_groq(client)

    class User(BaseModel):
        Title: str
        Text: str
        Images: list[str]

    # Create structured output
    user = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": (
                    "You are an expert analyser of websites. Get the title, main text and the only relevant images of the main text: "
                    + data['title']
                    + data['text']
                    + "".join(data['images'])
                    + " Be as succinct as possible and output in strict JSON"
                ),
            },
        ],
        response_model=User,
    )

    # Turn user output into JSON using model_dump() instead of dict()
    json_user = json.dumps(user.model_dump())
    return json_user

def execute(url, model):
    data = scrape_website(url)
    if data:
        return summarise(data, model)
    else:
        return None

out = execute(url, "llama-3.3-70b-versatile")
print(out)
sys.stdout.flush()