#!/usr/bin/env python3

import os
import csv
import sys

def update_csv_header(filepath):
    """Update CSV file to rename 'activities' column to 'type'"""
    try:
        # Read the file
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        if not rows:
            print(f"Empty file: {filepath}")
            return False
        
        # Check if the header row contains 'activities'
        header = rows[0]
        if 'activities' not in header:
            print(f"'activities' column not found in {filepath}")
            return False
        
        # Replace 'activities' with 'type' in the header
        header_index = header.index('activities')
        header[header_index] = 'type'
        
        # Write the file back
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        
        print(f"Updated {filepath}: renamed 'activities' -> 'type'")
        return True
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    static_data_dir = r"d:\Projects\UntilEveryCage\static_data"
    
    # Find all locations.csv files
    csv_files = []
    for root, dirs, files in os.walk(static_data_dir):
        for file in files:
            if file == 'locations.csv':
                csv_files.append(os.path.join(root, file))
    
    print(f"Found {len(csv_files)} locations.csv files:")
    for csv_file in csv_files:
        print(f"  {csv_file}")
    
    print("\nUpdating CSV headers...")
    updated_count = 0
    for csv_file in csv_files:
        if update_csv_header(csv_file):
            updated_count += 1
    
    print(f"\nCompleted: {updated_count}/{len(csv_files)} files updated")

if __name__ == "__main__":
    main()