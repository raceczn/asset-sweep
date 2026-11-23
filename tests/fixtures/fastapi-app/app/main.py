def url_for(endpoint: str, filename: str) -> str:
    return f"/{endpoint}/{filename}"


def get_banner() -> str:
    return url_for('static', filename='banner.webp')

def get_card(card: str):
    return f"static/cards/{card}.jpg"
