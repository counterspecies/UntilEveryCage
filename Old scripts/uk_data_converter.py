#!/usr/bin/env python3
"""
UK Data Converter
Converts UK animal facility data to match the US locations.csv format
"""

import pandas as pd
import re
from typing import Dict, List, Set

def parse_classifications(classifications: str) -> Dict[str, bool]:
    """Parse UK classifications into animal/activity types"""
    if pd.isna(classifications):
        return {}
    
    # Split classifications and normalize
    class_list = [c.strip() for c in classifications.split(',')]
    
    result = {
        # Slaughter categories
        'cow_slaughter': False,
        'pig_slaughter': False,
        'sheep_lamb_slaughter': False,
        'goat_slaughter': False,
        'poultry_slaughter': False,
        'other_mammal_slaughter': False,
        
        # Farm categories
        'dairy_farm': False,
        'intensive_pig_farm': False,
        'intensive_poultry_farm': False,
    }
    
    for classification in class_list:
        # Map UK classifications to our categories
        if 'CowSlaughterhouse' in classification:
            result['cow_slaughter'] = True
        elif 'PigSlaughterhouse' in classification:
            result['pig_slaughter'] = True
        elif 'SheepAndLambSlaughterhouse' in classification:
            result['sheep_lamb_slaughter'] = True
        elif 'GoatSlaughterhouse' in classification:
            result['goat_slaughter'] = True
        elif 'PoultrySlaughterhouse' in classification:
            result['poultry_slaughter'] = True
        elif 'OtherMammalSlaughterhouse' in classification:
            result['other_mammal_slaughter'] = True
        elif 'DairyFarm' in classification:
            result['dairy_farm'] = True
        elif 'IntensivePigFarm' in classification:
            result['intensive_pig_farm'] = True
        elif 'IntensivePoultryFarm' in classification:
            result['intensive_poultry_farm'] = True
    
    return result

def parse_address(address: str) -> Dict[str, str]:
    """Parse UK address into components"""
    if pd.isna(address):
        return {'street': '', 'city': '', 'state': '', 'zip': ''}
    
    # Remove "United Kingdom" from the end
    address = re.sub(r',\s*United Kingdom\s*$', '', address)
    
    # Split by commas
    parts = [part.strip() for part in address.split(',')]
    
    # Try to identify postal code (UK postcodes have specific patterns)
    postcode = ''
    city = ''
    street = ''
    
    # Look for UK postcode pattern in the last few parts
    uk_postcode_pattern = r'\b[A-Z]{1,2}[0-9R][0-9A-Z]?\s*[0-9][A-Z]{2}\b'
    
    for i, part in enumerate(reversed(parts)):
        if re.search(uk_postcode_pattern, part):
            postcode = part
            # City is usually the part before the postcode
            if len(parts) - 1 - i > 0:
                city = parts[len(parts) - 2 - i]
            break
    
    # If no postcode found, assume last part is city
    if not postcode and parts:
        city = parts[-1]
    
    # Street is the first part (or combination of first parts)
    if parts:
        if city and city in parts:
            city_index = parts.index(city)
            street = ', '.join(parts[:city_index])
        else:
            street = ', '.join(parts[:-1]) if len(parts) > 1 else parts[0]
    
    return {
        'street': street,
        'city': city,
        'state': '',  # UK uses counties, but we'll put that in county field
        'zip': postcode
    }

def determine_activities(classifications: Dict[str, bool]) -> str:
    """Determine activities string based on classifications"""
    activities = []
    
    has_slaughter = any([
        classifications.get('cow_slaughter', False),
        classifications.get('pig_slaughter', False), 
        classifications.get('sheep_lamb_slaughter', False),
        classifications.get('goat_slaughter', False),
        classifications.get('poultry_slaughter', False),
        classifications.get('other_mammal_slaughter', False)
    ])
    
    has_farm = any([
        classifications.get('dairy_farm', False),
        classifications.get('intensive_pig_farm', False),
        classifications.get('intensive_poultry_farm', False)
    ])
    
    if has_slaughter:
        activities.append('Meat Slaughter')
    
    if has_farm:
        activities.append('Animal Production')
    
    return '; '.join(activities) if activities else 'Unknown'

def convert_uk_to_us_format(uk_csv_path: str, output_csv_path: str):
    """Convert UK CSV data to US locations.csv format"""
    
    print(f"Reading UK data from: {uk_csv_path}")
    df_uk = pd.read_csv(uk_csv_path)
    
    print(f"Found {len(df_uk)} UK facilities")
    
    # Create empty DataFrame with US format columns
    us_columns = [
        'establishment_id', 'establishment_number', 'establishment_name', 'duns_number',
        'street', 'city', 'state', 'zip', 'phone', 'grant_date', 'activities', 'dbas',
        'district', 'circuit', 'size', 'latitude', 'longitude', 'county', 'fips_code',
        'meat_exemption_custom_slaughter', 'poultry_exemption_custom_slaughter', 'slaughter',
        'meat_slaughter', 'beef_cow_slaughter', 'steer_slaughter', 'heifer_slaughter',
        'bull_stag_slaughter', 'dairy_cow_slaughter', 'heavy_calf_slaughter', 'bob_veal_slaughter',
        'formula_fed_veal_slaughter', 'non_formula_fed_veal_slaughter', 'market_swine_slaughter',
        'sow_slaughter', 'roaster_swine_slaughter', 'boar_stag_swine_slaughter', 
        'stag_swine_slaughter', 'feral_swine_slaughter', 'goat_slaughter', 'young_goat_slaughter',
        'adult_goat_slaughter', 'sheep_slaughter', 'lamb_slaughter', 'deer_reindeer_slaughter',
        'antelope_slaughter', 'elk_slaughter', 'bison_slaughter', 'buffalo_slaughter',
        'water_buffalo_slaughter', 'cattalo_slaughter', 'yak_slaughter', 
        'other_voluntary_livestock_slaughter', 'rabbit_slaughter', 'poultry_slaughter',
        'young_chicken_slaughter', 'light_fowl_slaughter', 'heavy_fowl_slaughter',
        'capon_slaughter', 'young_turkey_slaughter', 'young_breeder_turkey_slaughter',
        'old_breeder_turkey_slaughter', 'fryer_roaster_turkey_slaughter', 'duck_slaughter',
        'goose_slaughter', 'pheasant_slaughter', 'quail_slaughter', 'guinea_slaughter',
        'ostrich_slaughter', 'emu_slaughter', 'rhea_slaughter', 'squab_slaughter',
        'other_voluntary_poultry_slaughter', 'slaughter_or_processing_only', 'slaughter_only_class',
        'slaughter_only_species', 'meat_slaughter_only_species', 'poultry_slaughter_only_species',
        'slaughter_volume_category', 'processing_volume_category',
        # Processing fields (shortened list - there are many more in the actual format)
        'beef_processing', 'pork_processing', 'antelope_processing', 'bison_processing',
        'buffalo_processing', 'deer_processing', 'elk_processing', 'goat_processing',
        'other_voluntary_livestock_processing', 'rabbit_processing', 'reindeer_processing',
        'sheep_processing', 'yak_processing', 'chicken_processing', 'duck_processing',
        'goose_processing', 'pigeon_processing', 'ratite_processing', 'turkey_processing',
        'exotic_poultry_processing', 'other_voluntary_poultry_processing'
    ]
    
    df_us = pd.DataFrame(columns=us_columns)
    
    # Process each UK facility
    for idx, uk_row in df_uk.iterrows():
        print(f"Processing facility {idx + 1}/{len(df_uk)}: {uk_row['name']}") # type: ignore
        
        # Parse classifications
        classifications = parse_classifications(uk_row['classifications'])
        
        # Parse address
        address_parts = parse_address(uk_row['address'])
        
        # Create US format row
        us_row = {}
        
        # Basic identification
        us_row['establishment_id'] = str(uk_row['id'])
        us_row['establishment_number'] = str(uk_row['id'])  # Use same as ID
        us_row['establishment_name'] = uk_row['name']
        us_row['duns_number'] = ''  # Not available in UK data
        
        # Address fields
        us_row['street'] = address_parts['street']
        us_row['city'] = address_parts['city']
        us_row['state'] = uk_row['county']  # Use UK county as state
        us_row['zip'] = address_parts['zip']
        us_row['phone'] = ''  # Not available in UK data
        
        # Dates and classification
        us_row['grant_date'] = uk_row['firstImportedAt'][:10] if pd.notna(uk_row['firstImportedAt']) else ''
        us_row['activities'] = determine_activities(classifications)
        us_row['dbas'] = uk_row['operator'] if uk_row['operator'] != uk_row['name'] else ''
        
        # Geographic data - handle missing coordinates
        try:
            us_row['latitude'] = float(uk_row['latitude']) if pd.notna(uk_row['latitude']) and uk_row['latitude'] != '' else 0.0
            if us_row['latitude'] == 0.0:
                print(f"Warning: Missing latitude for facility {uk_row['name']} (ID: {uk_row['id']})")
        except (ValueError, TypeError):
            us_row['latitude'] = 0.0
            print(f"Warning: Invalid latitude for facility {uk_row['name']} (ID: {uk_row['id']}): {uk_row['latitude']}")
            
        try:
            us_row['longitude'] = float(uk_row['longitude']) if pd.notna(uk_row['longitude']) and uk_row['longitude'] != '' else 0.0
            if us_row['longitude'] == 0.0:
                print(f"Warning: Missing longitude for facility {uk_row['name']} (ID: {uk_row['id']})")
        except (ValueError, TypeError):
            us_row['longitude'] = 0.0
            print(f"Warning: Invalid longitude for facility {uk_row['name']} (ID: {uk_row['id']}): {uk_row['longitude']}")
            
        us_row['county'] = uk_row['county']
        
        # Default values for fields not available in UK data
        us_row['district'] = ''
        us_row['circuit'] = ''
        us_row['size'] = 'Unknown'
        us_row['fips_code'] = ''
        
        # Set slaughter fields based on classifications
        us_row['slaughter'] = 'Yes' if any([
            classifications.get('cow_slaughter', False),
            classifications.get('pig_slaughter', False),
            classifications.get('sheep_lamb_slaughter', False),
            classifications.get('goat_slaughter', False),
            classifications.get('poultry_slaughter', False)
        ]) else ''
        
        us_row['meat_slaughter'] = 'Yes' if us_row['slaughter'] == 'Yes' else ''
        
        # Specific animal slaughter fields
        us_row['beef_cow_slaughter'] = 'Yes' if classifications.get('cow_slaughter', False) else ''
        us_row['steer_slaughter'] = 'Yes' if classifications.get('cow_slaughter', False) else ''
        us_row['heifer_slaughter'] = 'Yes' if classifications.get('cow_slaughter', False) else ''
        us_row['bull_stag_slaughter'] = 'Yes' if classifications.get('cow_slaughter', False) else ''
        us_row['dairy_cow_slaughter'] = 'Yes' if classifications.get('cow_slaughter', False) else ''
        
        us_row['market_swine_slaughter'] = 'Yes' if classifications.get('pig_slaughter', False) else ''
        us_row['sow_slaughter'] = 'Yes' if classifications.get('pig_slaughter', False) else ''
        
        us_row['goat_slaughter'] = 'Yes' if classifications.get('goat_slaughter', False) else ''
        us_row['young_goat_slaughter'] = 'Yes' if classifications.get('goat_slaughter', False) else ''
        us_row['adult_goat_slaughter'] = 'Yes' if classifications.get('goat_slaughter', False) else ''
        
        us_row['sheep_slaughter'] = 'Yes' if classifications.get('sheep_lamb_slaughter', False) else ''
        us_row['lamb_slaughter'] = 'Yes' if classifications.get('sheep_lamb_slaughter', False) else ''
        
        us_row['poultry_slaughter'] = 'Yes' if classifications.get('poultry_slaughter', False) else ''
        us_row['young_chicken_slaughter'] = 'Yes' if classifications.get('poultry_slaughter', False) else ''
        
        us_row['other_voluntary_livestock_slaughter'] = 'Yes' if classifications.get('other_mammal_slaughter', False) else ''
        
        # Volume categories
        us_row['slaughter_volume_category'] = 'Unknown'
        us_row['processing_volume_category'] = 'Unknown'
        
        # Set all other slaughter fields to empty by default
        slaughter_fields = [
            'heavy_calf_slaughter', 'bob_veal_slaughter', 'formula_fed_veal_slaughter',
            'non_formula_fed_veal_slaughter', 'roaster_swine_slaughter', 'boar_stag_swine_slaughter',
            'stag_swine_slaughter', 'feral_swine_slaughter', 'deer_reindeer_slaughter',
            'antelope_slaughter', 'elk_slaughter', 'bison_slaughter', 'buffalo_slaughter',
            'water_buffalo_slaughter', 'cattalo_slaughter', 'yak_slaughter', 'rabbit_slaughter',
            'light_fowl_slaughter', 'heavy_fowl_slaughter', 'capon_slaughter',
            'young_turkey_slaughter', 'young_breeder_turkey_slaughter', 'old_breeder_turkey_slaughter',
            'fryer_roaster_turkey_slaughter', 'duck_slaughter', 'goose_slaughter',
            'pheasant_slaughter', 'quail_slaughter', 'guinea_slaughter', 'ostrich_slaughter',
            'emu_slaughter', 'rhea_slaughter', 'squab_slaughter', 'other_voluntary_poultry_slaughter'
        ]
        
        for field in slaughter_fields:
            us_row[field] = us_row.get(field, '')
        
        # Set exemption and processing fields to empty
        exemption_fields = ['meat_exemption_custom_slaughter', 'poultry_exemption_custom_slaughter']
        for field in exemption_fields:
            us_row[field] = ''
            
        # Set processing fields to empty (UK data doesn't distinguish between slaughter and processing)
        processing_fields = [
            'beef_processing', 'pork_processing', 'antelope_processing', 'bison_processing',
            'buffalo_processing', 'deer_processing', 'elk_processing', 'goat_processing',
            'other_voluntary_livestock_processing', 'rabbit_processing', 'reindeer_processing',
            'sheep_processing', 'yak_processing', 'chicken_processing', 'duck_processing',
            'goose_processing', 'pigeon_processing', 'ratite_processing', 'turkey_processing',
            'exotic_poultry_processing', 'other_voluntary_poultry_processing'
        ]
        
        for field in processing_fields:
            us_row[field] = ''
        
        # Set remaining classification fields
        other_fields = [
            'slaughter_or_processing_only', 'slaughter_only_class', 'slaughter_only_species',
            'meat_slaughter_only_species', 'poultry_slaughter_only_species'
        ]
        
        for field in other_fields:
            us_row[field] = ''
        
        # Add row to dataframe
        df_us = pd.concat([df_us, pd.DataFrame([us_row])], ignore_index=True)
    
    # Save converted data
    print(f"Saving converted data to: {output_csv_path}")
    df_us.to_csv(output_csv_path, index=False)
    print(f"Conversion complete! Processed {len(df_us)} facilities.")
    
    # Print summary statistics
    print("\nConversion Summary:")
    print(f"- Total facilities: {len(df_us)}")
    print(f"- Facilities with slaughter: {len(df_us[df_us['slaughter'] == 'Yes'])}")
    print(f"- Cow slaughter facilities: {len(df_us[df_us['beef_cow_slaughter'] == 'Yes'])}")
    print(f"- Pig slaughter facilities: {len(df_us[df_us['market_swine_slaughter'] == 'Yes'])}")
    print(f"- Sheep/Lamb slaughter facilities: {len(df_us[df_us['sheep_slaughter'] == 'Yes'])}")
    print(f"- Goat slaughter facilities: {len(df_us[df_us['goat_slaughter'] == 'Yes'])}")
    print(f"- Poultry slaughter facilities: {len(df_us[df_us['poultry_slaughter'] == 'Yes'])}")

if __name__ == "__main__":
    uk_csv = "d:\\Projects\\heatmap-backend\\Extra Data\\uk-data.csv"
    output_csv = "d:\\Projects\\heatmap-backend\\static_data\\uk\\locations.csv"
    
    # Create uk directory if it doesn't exist
    import os
    os.makedirs("d:\\Projects\\heatmap-backend\\static_data\\uk", exist_ok=True)
    
    convert_uk_to_us_format(uk_csv, output_csv)