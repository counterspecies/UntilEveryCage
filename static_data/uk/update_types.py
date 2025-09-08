#!/usr/bin/env python3
"""
Script to update UK locations.csv with more descriptive type field based on original classifications.
Maps from the raw uk-data.csv classifications to human-readable facility types.
"""

import csv
import os

# Mapping from original classification codes to human-readable types
CLASSIFICATION_TO_TYPE = {
    # Farm types
    'DairyFarm': 'Dairy Farm',
    'IntensivePigFarm': 'Intensive Pig Farm',
    'IntensivePoultryFarm': 'Intensive Poultry Farm', 
    'IntensiveSowPigFarm': 'Intensive Sow Pig Farm',
    'FinishingUnit': 'Finishing Unit',
    
    # Slaughterhouse types
    'CowSlaughterhouse': 'Cattle Slaughterhouse',
    'PigSlaughterhouse': 'Pig Slaughterhouse',
    'PoultrySlaughterhouse': 'Poultry Slaughterhouse',
    'SheepAndLambSlaughterhouse': 'Sheep & Lamb Slaughterhouse',
    'GoatSlaughterhouse': 'Goat Slaughterhouse',
    'HorseSlaughterhouse': 'Horse Slaughterhouse',
    'LargeBirdSlaughterhouse': 'Large Bird Slaughterhouse',
    'WildBirdSlaughterhouse': 'Wild Bird Slaughterhouse',
    'WildRabbitSlaughterhouse': 'Wild Rabbit Slaughterhouse',
    'OtherMammalSlaughterhouse': 'Other Mammal Slaughterhouse'
}

def determine_primary_type(classifications_str):
    """
    Determine the primary facility type based on classifications.
    For facilities with multiple classifications, prioritize farms over slaughterhouses,
    then use the first classification found.
    """
    if not classifications_str or classifications_str.strip() == '':
        return 'Unknown Facility'
    
    # Split classifications by comma and clean them
    classifications = [c.strip() for c in classifications_str.split(',')]
    
    # First, check for any farm types (prioritize farms)
    farm_types = []
    slaughter_types = []
    
    for classification in classifications:
        if classification in CLASSIFICATION_TO_TYPE:
            mapped_type = CLASSIFICATION_TO_TYPE[classification]
            if 'Farm' in mapped_type or 'Unit' in mapped_type:
                farm_types.append(mapped_type)
            else:
                slaughter_types.append(mapped_type)
    
    # Return farm type if found, otherwise slaughterhouse type
    if farm_types:
        if len(farm_types) > 1:
            return f"Mixed Farm ({', '.join(farm_types)})"
        return farm_types[0]
    elif slaughter_types:
        if len(slaughter_types) > 1:
            return f"Mixed Slaughterhouse ({', '.join(slaughter_types)})"
        return slaughter_types[0]
    else:
        # Fallback for unknown classifications
        return f"Unknown ({classifications_str})"

def load_original_data():
    """Load the original UK data with classifications"""
    original_data = {}
    
    uk_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Old CSVs', 'uk-data.csv')
    
    with open(uk_data_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            establishment_id = row['id'].strip('"')
            classifications = row['classifications'].strip('"')
            original_data[establishment_id] = classifications
    
    return original_data

def update_locations_csv():
    """Update the UK locations.csv with better type descriptions"""
    
    # Load original classifications
    print("Loading original UK data...")
    original_data = load_original_data()
    print(f"Loaded {len(original_data)} original records")
    
    locations_path = os.path.join(os.path.dirname(__file__), 'locations.csv')
    backup_path = locations_path + '.backup'
    
    # Create backup
    os.rename(locations_path, backup_path)
    print(f"Created backup at {backup_path}")
    
    # Read and update the locations file
    updated_rows = []
    with open(backup_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            establishment_id = row['establishment_id']
            
            # Get classifications from original data
            if establishment_id in original_data:
                classifications = original_data[establishment_id]
                new_type = determine_primary_type(classifications)
                row['type'] = new_type
                print(f"Updated {establishment_id}: {row['establishment_name']} -> {new_type}")
            else:
                print(f"Warning: No original data found for {establishment_id}: {row['establishment_name']}")
            
            updated_rows.append(row)
    
    # Write updated file
    with open(locations_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
    
    print(f"Updated {len(updated_rows)} records in locations.csv")
    
    # Print summary of types
    type_counts = {}
    for row in updated_rows:
        facility_type = row['type']
        type_counts[facility_type] = type_counts.get(facility_type, 0) + 1
    
    print("\nFacility type summary:")
    for facility_type, count in sorted(type_counts.items()):
        print(f"  {facility_type}: {count}")

if __name__ == '__main__':
    update_locations_csv()