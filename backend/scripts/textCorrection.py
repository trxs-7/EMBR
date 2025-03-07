from groq import Groq
import os
import sys

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

text = sys.argv[1]

def rewrite_article_with_analysis(article: str):
    """
    Rewrites an entire article to be factual and objective, with an explanation of detected misinformation.
    
    :param article: The full article text (confirmed to be fake/misleading).
    :return: The revised article with explanations after each section.
    """
    
    # Constructing the prompt
    prompt = ("You are an expert in fact-checking and journalism. The following article is confirmed to contain misinformation. "
              "Your task is to rewrite each section to be fully factual and objective. "
              "After each rewritten section, explain what was misleading in the original content and how it was corrected. Explain in third-person perspective. "
              "If fed the same section multiple times, ignore the section and do not refine it. s"
              "Use clear section breaks for readability.\n\n"
              "### Original Article:\n"
              f"{article}\n\n"
              "### Rewritten Article with Explanations:")
    
    # Generate corrected text using Groq's LLM
    response = client.chat.completions.create(
        model="llama3-8b-8192",  # Choose the appropriate model
        messages=[{"role": "user", "content": prompt}]
    )
    
    corrected_article = response.choices[0].message.content.strip()
    return corrected_article

if __name__ == "__main__":
    corrected_article = rewrite_article_with_analysis(text)
    print(corrected_article)
    sys.stdout.flush()