from openai import OpenAI
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=""
)

response = client.chat.completions.create(
    model="openai/gpt-4o-mini",  # You can change this
    messages=[
        {"role": "user", "content": "Explain Python simply"}
    ]
)

print(response.choices[0].message.content)
