#!/usr/bin/env python3
"""
Script to restore proper facility types to Spain locations data.

This script maps the raw Spanish facility classifications back into
the processed locations CSV file, restoring lost facility type information.
"""

import csv
import os
from typing import Dict, Tuple

# Classification mappings from Spanish to English facility types
CLASSIFICATION_MAP = {
    'GranjaPorcinaIntensiva': 'Pig Farm',
    'GranjaPorcinaIntensivaDeCerdas': 'Pig Breeding Farm', 
    'GranjaAvícolaIntensiva': 'Poultry Farm',
    'Acuicultura': 'Aquaculture'
}

def load_raw_data(raw_csv_path: str) -> Dict[str, str]:
    """Load raw spain-data.csv and extract ID to classification mapping."""
    id_to_classification = {}
    
    print(f"Loading raw data from: {raw_csv_path}")
    
    with open(raw_csv_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)
        
        # Find column indices
        try:
            id_col = header.index('id')
            classification_col = header.index('classifications')
        except ValueError as e:
            raise ValueError(f"Required column not found in raw data: {e}")
        
        for row in reader:
            if len(row) > max(id_col, classification_col):
                facility_id = row[id_col].strip('"')
                classification = row[classification_col].strip('"')
                id_to_classification[facility_id] = classification
    
    print(f"Loaded {len(id_to_classification)} facility classifications")
    return id_to_classification

def update_processed_data(processed_csv_path: str, id_to_classification: Dict[str, str]) -> Tuple[int, int]:
    """Update the processed locations CSV with proper facility types."""
    
    # Read the processed data
    rows = []
    with open(processed_csv_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)
        rows.append(header)
        
        # Find column indices
        try:
            establishment_id_col = header.index('establishment_id')
            type_col = header.index('type')
        except ValueError as e:
            raise ValueError(f"Required column not found in processed data: {e}")
        
        for row in reader:
            rows.append(row)
    
    # Update types
    updated_count = 0
    unchanged_count = 0
    
    for i, row in enumerate(rows[1:], 1):  # Skip header
        if len(row) > max(establishment_id_col, type_col):
            facility_id = row[establishment_id_col].strip()
            
            if facility_id in id_to_classification:
                original_classification = id_to_classification[facility_id]
                
                if original_classification in CLASSIFICATION_MAP:
                    new_type = CLASSIFICATION_MAP[original_classification]
                    old_type = row[type_col]
                    
                    if old_type != new_type:
                        row[type_col] = new_type
                        updated_count += 1
                        
                        if updated_count <= 5:  # Show first 5 updates as examples
                            print(f"  Updated ID {facility_id}: '{old_type}' -> '{new_type}' (was: {original_classification})")
                    else:
                        unchanged_count += 1
                else:
                    print(f"  Warning: Unknown classification '{original_classification}' for ID {facility_id}")
    
    # Write the updated data
    backup_path = processed_csv_path + '.backup'
    print(f"Creating backup: {backup_path}")
    os.rename(processed_csv_path, backup_path)
    
    with open(processed_csv_path, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(rows)
    
    return updated_count, unchanged_count

def main():
    """Main function to update Spain facility types."""
    
    # File paths
    raw_csv_path = r"d:\Projects\UntilEveryCage\Old CSVs\spain-data.csv"
    processed_csv_path = r"d:\Projects\UntilEveryCage\static_data\es\locations.csv"
    
    print("Spain Facility Type Update Script")
    print("=" * 40)
    print()
    
    # Check if files exist
    if not os.path.exists(raw_csv_path):
        print(f"Error: Raw data file not found: {raw_csv_path}")
        return
        
    if not os.path.exists(processed_csv_path):
        print(f"Error: Processed data file not found: {processed_csv_path}")
        return
    
    try:
        # Load the raw data classification mappings
        id_to_classification = load_raw_data(raw_csv_path)
        
        print()
        print("Classification types found:")
        unique_classifications = set(id_to_classification.values())
        for classification in sorted(unique_classifications):
            mapped_type = CLASSIFICATION_MAP.get(classification, "UNMAPPED")
            print(f"  {classification} -> {mapped_type}")
        
        print()
        print("Updating processed data...")
        
        # Update the processed data
        updated_count, unchanged_count = update_processed_data(processed_csv_path, id_to_classification)
        
        print()
        print("Update Summary:")
        print(f"  Updated records: {updated_count}")
        print(f"  Unchanged records: {unchanged_count}")
        print(f"  Total records processed: {updated_count + unchanged_count}")
        
        if updated_count > 0:
            print()
            print(f"✅ Successfully updated {updated_count} facility types!")
            print(f"   Original file backed up as: {processed_csv_path}.backup")
        else:
            print()
            print("ℹ️  No records needed updating.")
            
    except Exception as e:
        print(f"Error: {e}")
        return

if __name__ == "__main__":
    main()