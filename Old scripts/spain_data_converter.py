#!/usr/bin/env python3
"""
Spain Data Converter
Converts Spain animal facility data to match the US locations.csv format
"""

import pandas as pd
import re
from typing import Dict, List, Set

def parse_classifications(classifications: str) -> Dict[str, bool]:
    """Parse Spain classifications into animal/activity types"""
    if pd.isna(classifications):
        return {}
    
    # Split classifications and normalize
    class_list = [c.strip() for c in classifications.split(',')]
    
    result = {
        # Farm categories - Spain data is all farms/breeding, not slaughter
        'intensive_pig_farm': False,
        'intensive_pig_breeding_farm': False,
        'intensive_poultry_farm': False,
        'aquaculture': False,
    }
    
    for classification in class_list:
        # Map Spain classifications to our categories
        # Note: "Granja" means "Farm" in Spanish - these are farming/breeding operations, NOT slaughter!
        if 'GranjaPorcinaIntensiva' in classification:
            result['intensive_pig_farm'] = True
        elif 'GranjaPorcinaIntensivaDeCerdas' in classification:
            result['intensive_pig_breeding_farm'] = True
        elif 'GranjaAvícolaIntensiva' in classification:
            result['intensive_poultry_farm'] = True
        elif 'Acuicultura' in classification:
            result['aquaculture'] = True
    
    return result

def parse_address(address: str) -> Dict[str, str]:
    """Parse Spain address into components"""
    if pd.isna(address):
        return {'street': '', 'city': '', 'state': '', 'zip': ''}
    
    # Remove "España" from the end
    address = re.sub(r',\s*España\s*$', '', address)
    
    # Split by commas
    parts = [part.strip() for part in address.split(',')]
    
    # Try to identify postal code (Spanish postcodes are 5 digits)
    postcode = ''
    city = ''
    street = ''
    
    # Look for Spanish postcode pattern (5 digits) in the parts
    spanish_postcode_pattern = r'\b\d{5}\b'
    
    for i, part in enumerate(parts):
        if re.search(spanish_postcode_pattern, part):
            # Extract just the postcode
            postcode_match = re.search(spanish_postcode_pattern, part)
            if postcode_match:
                postcode = postcode_match.group()
            
            # City is usually in the same part or the part before
            if ',' in part:
                # City might be in the same part separated by comma
                city_parts = [p.strip() for p in part.split(',')]
                for cp in city_parts:
                    if not re.search(spanish_postcode_pattern, cp) and cp:
                        city = cp
                        break
            elif i > 0:
                city = parts[i-1]
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
        'state': '',  # Spain uses autonomous communities, handled separately
        'zip': postcode
    }

def determine_activities(classifications: Dict[str, bool]) -> str:
    """Determine activities string based on classifications"""
    activities = []
    
    has_farm = any([
        classifications.get('intensive_pig_farm', False),
        classifications.get('intensive_pig_breeding_farm', False),
        classifications.get('intensive_poultry_farm', False)
    ])
    
    has_aquaculture = classifications.get('aquaculture', False)
    
    if has_farm:
        activities.append('Animal Production')
    
    if has_aquaculture:
        activities.append('Aquaculture')
    
    return '; '.join(activities) if activities else 'Unknown'

def convert_spain_to_us_format(spain_csv_path: str, output_csv_path: str):
    """Convert Spain CSV data to US locations.csv format"""
    
    print(f"Reading Spain data from: {spain_csv_path}")
    df_spain = pd.read_csv(spain_csv_path)
    
    print(f"Found {len(df_spain)} Spain facilities")
    
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
        # Processing fields
        'beef_processing', 'pork_processing', 'antelope_processing', 'bison_processing',
        'buffalo_processing', 'deer_processing', 'elk_processing', 'goat_processing',
        'other_voluntary_livestock_processing', 'rabbit_processing', 'reindeer_processing',
        'sheep_processing', 'yak_processing', 'chicken_processing', 'duck_processing',
        'goose_processing', 'pigeon_processing', 'ratite_processing', 'turkey_processing',
        'exotic_poultry_processing', 'other_voluntary_poultry_processing'
    ]
    
    df_us = pd.DataFrame(columns=us_columns)
    
    # Process each Spain facility
    for idx, spain_row in df_spain.iterrows():
        print(f"Processing facility {idx + 1}/{len(df_spain)}: {spain_row['name']}")
        
        # Parse classifications
        classifications = parse_classifications(spain_row['classifications'])
        
        # Parse address
        address_parts = parse_address(spain_row['address'])
        
        # Create US format row
        us_row = {}
        
        # Basic identification
        us_row['establishment_id'] = str(spain_row['id'])
        us_row['establishment_number'] = str(spain_row['id'])  # Use same as ID
        us_row['establishment_name'] = spain_row['name']
        us_row['duns_number'] = ''  # Not available in Spain data
        
        # Address fields
        us_row['street'] = address_parts['street']
        us_row['city'] = address_parts['city']
        us_row['state'] = spain_row['country'] if pd.notna(spain_row['country']) else spain_row['county']  # Use Spanish autonomous community as state
        us_row['zip'] = address_parts['zip']
        us_row['phone'] = ''  # Not available in Spain data
        
        # Dates and classification
        us_row['grant_date'] = spain_row['firstImportedAt'][:10] if pd.notna(spain_row['firstImportedAt']) else ''
        us_row['activities'] = determine_activities(classifications)
        us_row['dbas'] = spain_row['operator'] if spain_row['operator'] != spain_row['name'] else ''
        
        # Geographic data - handle missing coordinates
        try:
            us_row['latitude'] = float(spain_row['latitude']) if pd.notna(spain_row['latitude']) and spain_row['latitude'] != '' else 0.0
            if us_row['latitude'] == 0.0:
                print(f"Warning: Missing latitude for facility {spain_row['name']} (ID: {spain_row['id']})")
        except (ValueError, TypeError):
            us_row['latitude'] = 0.0
            print(f"Warning: Invalid latitude for facility {spain_row['name']} (ID: {spain_row['id']}): {spain_row['latitude']}")
            
        try:
            us_row['longitude'] = float(spain_row['longitude']) if pd.notna(spain_row['longitude']) and spain_row['longitude'] != '' else 0.0
            if us_row['longitude'] == 0.0:
                print(f"Warning: Missing longitude for facility {spain_row['name']} (ID: {spain_row['id']})")
        except (ValueError, TypeError):
            us_row['longitude'] = 0.0
            print(f"Warning: Invalid longitude for facility {spain_row['name']} (ID: {spain_row['id']}): {spain_row['longitude']}")
            
        us_row['county'] = spain_row['county'] if pd.notna(spain_row['county']) else ''
        
        # Default values for fields not available in Spain data
        us_row['district'] = ''
        us_row['circuit'] = ''
        us_row['size'] = 'Unknown'
        us_row['fips_code'] = ''
        
        # Set slaughter fields - Spain data is all farms/breeding, NOT slaughter facilities
        us_row['slaughter'] = ''  # No slaughter facilities in Spain data
        us_row['meat_slaughter'] = ''
        
        # All slaughter fields should be empty for Spain data
        us_row['market_swine_slaughter'] = ''
        us_row['sow_slaughter'] = ''
        us_row['poultry_slaughter'] = ''
        us_row['young_chicken_slaughter'] = ''
        
        # Volume categories
        us_row['slaughter_volume_category'] = 'Unknown'
        us_row['processing_volume_category'] = 'Unknown'
        
        # Set all other slaughter fields to empty by default
        slaughter_fields = [
            'beef_cow_slaughter', 'steer_slaughter', 'heifer_slaughter', 'bull_stag_slaughter', 
            'dairy_cow_slaughter', 'heavy_calf_slaughter', 'bob_veal_slaughter', 'formula_fed_veal_slaughter',
            'non_formula_fed_veal_slaughter', 'roaster_swine_slaughter', 'boar_stag_swine_slaughter',
            'stag_swine_slaughter', 'feral_swine_slaughter', 'goat_slaughter', 'young_goat_slaughter',
            'adult_goat_slaughter', 'sheep_slaughter', 'lamb_slaughter', 'deer_reindeer_slaughter',
            'antelope_slaughter', 'elk_slaughter', 'bison_slaughter', 'buffalo_slaughter',
            'water_buffalo_slaughter', 'cattalo_slaughter', 'yak_slaughter', 'rabbit_slaughter',
            'light_fowl_slaughter', 'heavy_fowl_slaughter', 'capon_slaughter',
            'young_turkey_slaughter', 'young_breeder_turkey_slaughter', 'old_breeder_turkey_slaughter',
            'fryer_roaster_turkey_slaughter', 'duck_slaughter', 'goose_slaughter',
            'pheasant_slaughter', 'quail_slaughter', 'guinea_slaughter', 'ostrich_slaughter',
            'emu_slaughter', 'rhea_slaughter', 'squab_slaughter', 'other_voluntary_poultry_slaughter',
            'other_voluntary_livestock_slaughter'
        ]
        
        for field in slaughter_fields:
            us_row[field] = us_row.get(field, '')
        
        # Set exemption and processing fields to empty
        exemption_fields = ['meat_exemption_custom_slaughter', 'poultry_exemption_custom_slaughter']
        for field in exemption_fields:
            us_row[field] = ''
            
        # Set processing fields to empty (Spain data doesn't distinguish between slaughter and processing)
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
    print(f"- Pig farms: {len(df_us[df_us['activities'].str.contains('Animal Production', na=False) & df_us['establishment_name'].str.contains('porcin|cerda|pig', case=False, na=False)])}")
    print(f"- Poultry farms: {len(df_us[df_us['activities'].str.contains('Animal Production', na=False) & df_us['establishment_name'].str.contains('avícol|poultry|chicken', case=False, na=False)])}")
    print(f"- Aquaculture facilities: {len(df_us[df_us['activities'].str.contains('Aquaculture', na=False)])}")
    print(f"- Animal production facilities: {len(df_us[df_us['activities'].str.contains('Animal Production', na=False)])}")
    print("\nNOTE: Spain data contains NO slaughter facilities - only farms/breeding operations!")

if __name__ == "__main__":
    spain_csv = "d:\\Projects\\heatmap-backend\\spain-data.csv"
    output_csv = "d:\\Projects\\heatmap-backend\\static_data\\es\\locations.csv"
    
    # Create es directory if it doesn't exist
    import os
    os.makedirs("d:\\Projects\\heatmap-backend\\static_data\\es", exist_ok=True)
    
    convert_spain_to_us_format(spain_csv, output_csv)