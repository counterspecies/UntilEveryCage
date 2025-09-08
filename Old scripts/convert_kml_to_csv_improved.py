#!/usr/bin/env python3
"""
Improved KML to CSV converter that preserves facility type information from KML folder structure.
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

def get_facility_type_from_folder(folder_name):
    """Map KML folder names to facility types compatible with the backend."""
    folder_mappings = {
        "Elevages divers": "Animal Production",
        "Elevages et Accessoires de chasse et pêche": "Animal Production; Hunting/Game",
        "Elevages de Chasse (AUTRES)": "Animal Production; Hunting/Game",
        "Abattoirs": "Meat Slaughter",
        "Liste des Abattoirs ALIM' CONFIANCE": "Meat Slaughter",
        "Abattoirs Personnes Aquatiques ALIM' CONFIANCE": "Aquatic Processing",
        "Vivier - Personnes aquatiques vivantes ALIM' CONFIANCE": "Aquatic Production",
        "Points reçus": "Other"
    }
    
    return folder_mappings.get(folder_name, "Animal Production")

def extract_detailed_activity_from_description(description, folder_name):
    """Extract more detailed activity information from description."""
    if not description:
        return get_facility_type_from_folder(folder_name)
    
    description_lower = description.lower()
    
    # Start with folder type
    base_activity = get_facility_type_from_folder(folder_name)
    
    # Add specific details based on description
    activities = []
    
    # Check for slaughter/abattoir activities
    if any(word in description_lower for word in ["abattoir", "slaughter", "abattage", "salle d'abattage"]):
        if "Animal Production" in base_activity:
            activities.append("Animal Production")
        activities.append("Meat Slaughter")
    # Check for educational/exhibition activities  
    elif any(word in description_lower for word in ["pédagogique", "educative", "ferme pédagogique"]):
        activities.append("Exhibition")
    # Check for hunting/game activities
    elif any(word in description_lower for word in ["faisan", "perdrix", "sanglier", "chasse", "gibier"]):
        activities.append("Animal Production")
        activities.append("Hunting/Game")
    else:
        # Default to folder type
        if ";" in base_activity:
            activities.extend(base_activity.split("; "))
        else:
            activities.append(base_activity)
    
    # Remove duplicates while preserving order
    unique_activities = []
    for activity in activities:
        if activity not in unique_activities:
            unique_activities.append(activity)
    
    return "; ".join(unique_activities)

def parse_kml_to_csv(kml_file_path, csv_file_path):
    """Parse KML file and convert to CSV format, preserving folder structure information."""
    
    # Parse the KML file
    tree = ET.parse(kml_file_path)
    root = tree.getroot()
    
    # Handle KML namespace
    namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    # Find all folders and their placemarks
    folders = root.findall('.//kml:Folder', namespace)
    
    print(f"Found {len(folders)} folders in KML file")
    
    # CSV columns based on the existing format
    csv_columns = [
        'establishment_id', 'establishment_number', 'establishment_name', 'duns_number',
        'street', 'city', 'state', 'zip', 'phone', 'grant_date', 'type', 'dbas',
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
    establishment_id = 1
    
    # Process each folder
    for folder in folders:
        # Get folder name
        folder_name_elem = folder.find('kml:name', namespace)
        folder_name = folder_name_elem.text if folder_name_elem is not None else "Unknown"
        
        # Clean folder name of CDATA markers
        folder_name = re.sub(r'\[CDATA\[|\]\]', '', folder_name).strip()
        
        print(f"Processing folder: {folder_name}")
        
        # Find all placemarks in this folder
        placemarks = folder.findall('.//kml:Placemark', namespace)
        
        for placemark in placemarks:
            # Extract name
            name_elem = placemark.find('kml:name', namespace)
            name = name_elem.text if name_elem is not None else f"Location {establishment_id}"
            
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
            
            # Determine activity type based on folder and description
            activities = extract_detailed_activity_from_description(description, folder_name)
            
            # Extract any location info
            city = ""
            # You could add more sophisticated location extraction here
            
            # Create row with default values
            row = {col: "" for col in csv_columns}
            
            # Fill in the known data
            row['establishment_id'] = establishment_id
            row['establishment_number'] = establishment_id
            row['establishment_name'] = name
            row['street'] = ""  # Not available in KML
            row['city'] = city
            row['state'] = ""  # Could be determined from coordinates, but not in this simple conversion
            row['latitude'] = latitude if latitude else ""
            row['longitude'] = longitude if longitude else ""
            row['type'] = activities
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
            establishment_id += 1
    
    # Also process any placemarks not in folders (if any)
    # First, collect all placemarks that are inside folders
    folder_placemarks = set()
    for folder in folders:
        for placemark in folder.findall('.//kml:Placemark', namespace):
            folder_placemarks.add(placemark)
    
    # Find placemarks that are not in any folder
    all_placemarks = root.findall('.//kml:Placemark', namespace)
    orphan_placemarks = [p for p in all_placemarks if p not in folder_placemarks]
    
    if orphan_placemarks:
        print(f"Processing {len(orphan_placemarks)} placemarks not in folders")
        
        for placemark in orphan_placemarks:
            # Extract name
            name_elem = placemark.find('kml:name', namespace)
            name = name_elem.text if name_elem is not None else f"Location {establishment_id}"
            name = re.sub(r'\[CDATA\[|\]\]', '', name).strip()
            
            # Extract description
            desc_elem = placemark.find('kml:description', namespace)
            description = clean_description(desc_elem.text) if desc_elem is not None else ""
            
            # Extract coordinates
            coordinates_elem = placemark.find('.//kml:coordinates', namespace)
            latitude, longitude = None, None
            if coordinates_elem is not None:
                latitude, longitude = extract_coordinates(coordinates_elem.text)
            
            # Default activity type for orphan placemarks
            activities = extract_detailed_activity_from_description(description, "Unknown")
            
            # Create row
            row = {col: "" for col in csv_columns}
            row['establishment_id'] = establishment_id
            row['establishment_number'] = establishment_id
            row['establishment_name'] = name
            row['latitude'] = latitude if latitude else ""
            row['longitude'] = longitude if longitude else ""
            row['type'] = activities
            row['grant_date'] = "2024-03-01"
            row['size'] = "Unknown"
            
            # Set boolean fields and volume categories as before
            boolean_fields = [col for col in csv_columns if 'slaughter' in col or 'processing' in col or 'exemption' in col]
            for field in boolean_fields:
                if field in row:
                    row[field] = ""
            
            if 'slaughter_volume_category' in row:
                row['slaughter_volume_category'] = "Unknown"
            if 'processing_volume_category' in row:
                row['processing_volume_category'] = "Unknown"
            
            csv_data.append(row)
            establishment_id += 1
    
    # Write CSV file
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=csv_columns)
        writer.writeheader()
        writer.writerows(csv_data)
    
    print(f"Successfully converted {len(csv_data)} locations to {csv_file_path}")
    
    # Print summary of facility types found
    facility_types = {}
    for row in csv_data:
        facility_type = row['type']
        facility_types[facility_type] = facility_types.get(facility_type, 0) + 1
    
    print("\nFacility types summary:")
    for activity, count in sorted(facility_types.items()):
        print(f"  {activity}: {count} facilities")

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