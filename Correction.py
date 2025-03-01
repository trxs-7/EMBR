import groq
import json

# Set your API key
GROQ_API_KEY = "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"

# Initialize Groq client
client = groq.Client(api_key=GROQ_API_KEY)

def correct_bias(article: str, biased_sections: list):
    """
    Rewrites biased sections of an article using Groq's LLM.
    
    :param article: The full article text.
    :param biased_sections: List of dictionaries with 'section' (text) and 'reason' (bias explanation).
    :return: The revised article with corrected bias.
    """
    
    revised_article = article
    
    for section_data in biased_sections:
        biased_text = section_data["section"]
        bias_reason = section_data["reason"]
        
        # Constructing the prompt
        prompt = (f"The following text has been identified as biased:\n\n"
                  f"'{biased_text}'\n\n"
                  f"Reason: {bias_reason}\n\n"
                  f"Please rewrite this section to be neutral, factual, and objective.")
        
        # Generate corrected text using Groq's LLM
        response = client.chat.completions.create(
            model="llama3-8b-8192",  # Choose the appropriate model
            messages=[{"role": "user", "content": prompt}]
        )
        
        corrected_text = response.choices[0].message.content.strip()
        
        # Replace biased text with corrected version
        revised_article = revised_article.replace(biased_text, corrected_text)

    return revised_article

if name == "main":
    # Example Usage
    article_text = """The government’s new policy is a complete failure, driven by incompetence and disregard for the public's needs."""
    biased_sections_data = [
        {"section": "The government’s new policy is a complete failure, driven by incompetence and disregard for the public's needs.",
         "reason": "This statement is strongly opinionated and lacks supporting evidence."}
    ]
    
    corrected_article = correct_bias(article_text, biased_sections_data)
    print(corrected_article)