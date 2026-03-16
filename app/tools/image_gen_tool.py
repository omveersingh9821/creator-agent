"""
Image Generation Tool — generates AI images using OpenAI DALL-E or Google Imagen.

Selects the provider based on available API keys in settings.
Returns a base64-encoded PNG image string.
"""

import base64


from app.config.settings import OPENAI_API_KEY, GOOGLE_API_KEY  # pyre-ignore[21]


def generate_image(prompt: str) -> str:
    """Generate an image from a text prompt.

    Tries OpenAI DALL-E first (if OPENAI_API_KEY is set), then falls back
    to Google Imagen. Returns a base64-encoded PNG string.

    Args:
        prompt: The text description of the image to generate.

    Returns:
        A base64-encoded PNG image string.

    Raises:
        ValueError: If no image generation API key is available.
        RuntimeError: If the image generation request fails.
    """
    if OPENAI_API_KEY:
        return _generate_with_openai(prompt)
    elif GOOGLE_API_KEY:
        return _generate_with_google(prompt)
    else:
        raise ValueError(
            "No image generation API key found. "
            "Set OPENAI_API_KEY or GOOGLE_API_KEY in your .env file."
        )


def _generate_with_openai(prompt: str) -> str:
    """Generate an image using OpenAI DALL-E 3."""
    from openai import OpenAI  # pyre-ignore[21]

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        response_format="b64_json",
        n=1,
    )

    image_b64 = response.data[0].b64_json
    if not image_b64:
        raise RuntimeError("OpenAI returned empty image data.")
    return image_b64


def _generate_with_google(prompt: str) -> str:
    """Generate an image using Google Imagen via the google-genai SDK."""
    from google import genai  # pyre-ignore[21]

    client = genai.Client(api_key=GOOGLE_API_KEY)

    response = client.models.generate_images(
        model="imagen-3.0-generate-002",
        prompt=prompt,
        config=genai.types.GenerateImagesConfig(
            number_of_images=1,
            output_mime_type="image/png",
        ),
    )

    if not response.generated_images:
        raise RuntimeError("Google Imagen returned no images.")

    image_bytes = response.generated_images[0].image.image_bytes
    return base64.b64encode(image_bytes).decode("utf-8")
