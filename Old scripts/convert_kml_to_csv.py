#!/usr/bin/env python3
"""
Convert France KML data to CSV format compatible with the backend.
"""

import xml.etree.ElementTree as ET
import csv
import re
from urllib.parse import unquote

def extract_coordinates(coord_string):
    """Extract latitude and longitude from KML coordinates string."""
    # KML coordinates are in format: longitude,latitude,altitude
    coords = coord_string.strip().split(',')
    if len(coords) >= 2:
        longitude = float(coords[0])
        latitude = float(coords[1])
        return latitude, longitude
    return None, None

def clean_description(description):
    """Clean and extract useful info from description."""
    if not description:
        return ""
    
    # Remove HTML tags
    description = re.sub(r'<[^>]+>', '', description)
    # Remove CDATA markers
    description = re.sub(r'\[CDATA\[|\]\]', '', description)
    # Clean up whitespace
    description = ' '.join(description.split())
    return description

def parse_kml_to_csv(kml_file_path, csv_file_path):
    """Parse KML file and convert to CSV format."""
    
    # Parse the KML file
    tree = ET.parse(kml_file_path)
    root = tree.getroot()
    
    # Handle KML namespace
    namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    # Find all Placemark elements
    placemarks = root.findall('.//kml:Placemark', namespace)
    
    print(f"Found {len(placemarks)} placemarks in KML file")
    
    # CSV columns based on the existing format
    csv_columns = [
        'establishment_id', 'establishment_number', 'establishment_name', 'duns_number',
        'street', 'city', 'state', 'zip', 'phone', 'grant_date', 'activities', 'dbas',
        'district', 'circuit', 'size', 'latitude', 'longitude', 'county', 'fips_code',
        'meat_exemption_custom_slaughter', 'poultry_exemption_custom_slaughter', 'slaughter',
        'meat_slaughter', 'beef_cow_slaughter', 'steer_slaughter', 'heifer_slaughter',
        'bull_stag_slaughter', 'dairy_cow_slaughter', 'heavy_calf_slaughter', 'bob_veal_slaughter',
        'formula_fed_veal_slaughter', 'non_formula_fed_veal_slaughter', 'market_swine_slaughter',
        'sow_slaughter', 'roaster_swine_slaughter', 'boar_stag_swine_slaughter', 'stag_swine_slaughter',
        'feral_swine_slaughter', 'goat_slaughter', 'young_goat_slaughter', 'adult_goat_slaughter',
        'sheep_slaughter', 'lamb_slaughter', 'deer_reindeer_slaughter', 'antelope_slaughter',
        'elk_slaughter', 'bison_slaughter', 'buffalo_slaughter', 'water_buffalo_slaughter',
        'cattalo_slaughter', 'yak_slaughter', 'other_voluntary_livestock_slaughter', 'rabbit_slaughter',
        'poultry_slaughter', 'young_chicken_slaughter', 'light_fowl_slaughter', 'heavy_fowl_slaughter',
        'capon_slaughter', 'young_turkey_slaughter', 'young_breeder_turkey_slaughter',
        'old_breeder_turkey_slaughter', 'fryer_roaster_turkey_slaughter', 'duck_slaughter',
        'goose_slaughter', 'pheasant_slaughter', 'quail_slaughter', 'guinea_slaughter',
        'ostrich_slaughter', 'emu_slaughter', 'rhea_slaughter', 'squab_slaughter',
        'other_voluntary_poultry_slaughter', 'slaughter_or_processing_only', 'slaughter_only_class',
        'slaughter_only_species', 'meat_slaughter_only_species', 'poultry_slaughter_only_species',
        'slaughter_volume_category', 'processing_volume_category', 'beef_processing', 'pork_processing',
        'antelope_processing', 'bison_processing', 'buffalo_processing', 'deer_processing',
        'elk_processing', 'goat_processing', 'other_voluntary_livestock_processing', 'rabbit_processing',
        'reindeer_processing', 'sheep_processing', 'yak_processing', 'chicken_processing',
        'duck_processing', 'goose_processing', 'pigeon_processing', 'ratite_processing',
        'turkey_processing', 'exotic_poultry_processing', 'other_voluntary_poultry_processing'
    ]
    
    # Prepare CSV data
    csv_data = []
    
    for i, placemark in enumerate(placemarks, 1):
        # Extract name
        name_elem = placemark.find('kml:name', namespace)
        name = name_elem.text if name_elem is not None else f"Location {i}"
        
        # Clean name of CDATA markers
        name = re.sub(r'\[CDATA\[|\]\]', '', name).strip()
        
        # Extract description
        desc_elem = placemark.find('kml:description', namespace)
        description = clean_description(desc_elem.text) if desc_elem is not None else ""
        
        # Extract coordinates
        coordinates_elem = placemark.find('.//kml:coordinates', namespace)
        latitude, longitude = None, None
        if coordinates_elem is not None:
            latitude, longitude = extract_coordinates(coordinates_elem.text)
        
        # Determine activity type based on description
        activities = "Animal Production"
        if any(word in description.lower() for word in ["abattoir", "slaughter", "abattage"]):
            activities = "Animal Production; Meat Slaughter"
        elif "pédagogique" in description.lower() or "educative" in description.lower():
            activities = "Exhibition"
        
        # Extract location info from description if GPS coordinates are mentioned
        city = ""
        # Try to extract city/location info from the establishment name or description
        if "GPS" in description:
            # Sometimes the description contains location info
            pass
        
        # Create row with default values
        row = {col: "" for col in csv_columns}
        
        # Fill in the known data
        row['establishment_id'] = i
        row['establishment_number'] = i
        row['establishment_name'] = name
        row['street'] = ""  # Not available in KML
        row['city'] = city
        row['state'] = ""  # Could be determined from coordinates, but not in this simple conversion
        row['latitude'] = latitude if latitude else ""
        row['longitude'] = longitude if longitude else ""
        row['activities'] = activities
        row['grant_date'] = "2024-03-01"  # Default date like in Spanish data
        row['size'] = "Unknown"
        
        # Set boolean fields to empty (like in Spanish data)
        boolean_fields = [col for col in csv_columns if 'slaughter' in col or 'processing' in col or 'exemption' in col]
        for field in boolean_fields:
            if field in row:
                row[field] = ""
        
        # Set volume categories to Unknown
        if 'slaughter_volume_category' in row:
            row['slaughter_volume_category'] = "Unknown"
        if 'processing_volume_category' in row:
            row['processing_volume_category'] = "Unknown"
        
        csv_data.append(row)
    
    # Write CSV file
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=csv_columns)
        writer.writeheader()
        writer.writerows(csv_data)
    
    print(f"Successfully converted {len(csv_data)} locations to {csv_file_path}")

if __name__ == "__main__":
    kml_file = "d:/Projects/UntilEveryCage/france-data.kml"
    csv_file = "d:/Projects/UntilEveryCage/static_data/fr/locations.csv"
    
    try:
        parse_kml_to_csv(kml_file, csv_file)
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error during conversion: {e}")
        import traceback
        traceback.print_exc()