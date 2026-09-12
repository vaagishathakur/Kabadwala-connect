from classifier.model import CATEGORIES

def validate_category(cat: str) -> bool:
    return cat in CATEGORIES

def validate_location(lat: float, lng: float) -> bool:
    # India bounding box roughly:
    # Lat: 8.4 to 37.6
    # Lng: 68.7 to 97.25
    if 8.4 <= lat <= 37.6 and 68.7 <= lng <= 97.25:
        return True
    return False

def validate_price(price: float) -> bool:
    return price > 0.0
