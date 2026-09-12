from fastapi import APIRouter, UploadFile, File, HTTPException
from classifier.model import get_classifier, CATEGORIES

router = APIRouter()

@router.post("")
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    contents = await file.read()
    classifier = get_classifier()
    result = classifier.predict(contents)
    
    return result

@router.get("/categories")
async def get_categories():
    descriptions = {
        'CRT': 'Cathode Ray Tube Monitors and TVs',
        'LCD': 'Liquid Crystal Display Screens',
        'PCB': 'Printed Circuit Boards',
        'Cable': 'Insulated electrical cables and wires',
        'Battery': 'Lead-acid and Lithium-ion batteries',
        'Motor': 'Electric motors and compressors',
        'Plastic': 'Hard plastics from e-waste casing',
        'Mixed': 'Unsorted mixed electronic waste',
        'Other': 'Other materials'
    }
    
    return [{"category": cat, "description": descriptions.get(cat, "")} for cat in CATEGORIES]
