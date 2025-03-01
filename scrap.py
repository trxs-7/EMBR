from bs4 import BeautifulSoup
import requests
import os
from groq import Groq
import instructor
from pydantic import BaseModel
import json
client = Groq(
    api_key= os.getenv("GROQ_API_KEY"),
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
'''
# Example usage
url = "https://theonion.com/trump-signs-executive-order-making-official-language-of-u-s-remedial-english/"
data = scrape_website(url)
if data:
    print("Title:", data["title"])
    print("Images:", data["images"])
    print("Text:", data["text"])
'''
def summarise(data,model):
    # Initialize with API key
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Enable instructor patches for Groq client
    client = instructor.from_groq(client)


    class User(BaseModel):
        Title: str
        Text: str
        Images: list[str]

    # Create structured output
    user = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "You are a expert analyser of websites. Get the title, main text and the only relavant images of the maintext" + data['title'] + data['text'] + "".join(data['images']) + "Be as succient as possible and Output in strict Json"},
        ],
        response_model=User,
    )

    #print(user)
    #turn user into json
    json_user = json.dumps(user.dict())
    return json_user

def execute(url,model):
    data = scrape_website(url)
    if data:
        return summarise(data,model)
    else:
        return None
