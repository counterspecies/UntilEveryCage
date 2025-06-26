# APHIS Geocoding Data Preparer
#
# This script reads the cleaned APHIS data and splits the combined
# 'City, State, Zip' column into three separate columns for easy geocoding.
#
# Author: Gemini
# Date: June 25, 2025

# --- 1. SETUP ---
#
# Before running, you need to install the pandas library.
# Open your terminal or command prompt and run this command:
#
# pip install pandas

import pandas as pd
import os

# --- 2. CONFIGURATION ---

# The name of your cleaned, active facilities file.
# This should be in the same folder as this script.
INPUT_FILE = 'active_aphis_facilities.csv'

# The name of the column that contains the location string (e.g., "LOS ANGELES, CA 90023")
# This is case-sensitive. Check your CSV to make sure this is correct.
LOCATION_COLUMN_NAME = 'City-State-Zip'

# The name of the final, geocoding-ready output file.
OUTPUT_FILE = 'geocoding_ready_aphis_data.csv'

def prepare_for_geocoding():
    """Reads the cleaned data and splits the location column."""

    # Check if the input file exists
    if not os.path.exists(INPUT_FILE):
        print(f"\nERROR: Input file '{INPUT_FILE}' not found!")
        print(f"Please run the data cleaner script first or place the file in this folder.")
        return

    print(f"Reading cleaned data from '{INPUT_FILE}'...")
    try:
        df = pd.read_csv(INPUT_FILE, dtype=str) # Read all as string to preserve ZIP codes
    except Exception as e:
        print(f"Could not read the CSV file. Error: {e}")
        return
        
    print(f"Total records found: {len(df)}")

    # Check if the required column exists
    if LOCATION_COLUMN_NAME not in df.columns:
        print(f"\nERROR: The CSV file does not have a '{LOCATION_COLUMN_NAME}' column.")
        print("Cannot perform splitting. Please check the column name in the CONFIGURATION section.")
        return

    # This regular expression is designed to parse "CITY, ST ZIP" formats.
    # It captures three groups:
    # 1. The City (everything before the last comma)
    # 2. The State (two capital letters)
    # 3. The Zip Code (5 digits, plus optional -4)
    regex = r'^(.*),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$'

    print(f"Splitting the '{LOCATION_COLUMN_NAME}' column...")
    
    # Use str.extract to apply the regex and create new columns directly
    # It will place NaN in columns for rows that don't match the pattern
    extracted_data = df[LOCATION_COLUMN_NAME].str.extract(regex)

    # Assign the captured groups to new columns in the main DataFrame
    df['City'] = extracted_data[0].str.strip()
    df['State'] = extracted_data[1].str.strip()
    df['Zip'] = extracted_data[2].str.strip()

    # Create a report on how many rows were successfully parsed
    successful_parses = df['City'].notna().sum()
    print(f"Successfully parsed {successful_parses} out of {len(df)} records.")
    
    if successful_parses < len(df):
        print("Some rows could not be parsed. They will have blank City/State/Zip values.")
        # You could uncomment the line below to see which rows failed
        # print(df[df['City'].isna()][LOCATION_COLUMN_NAME])

    # Save the processed DataFrame to a new CSV file
    print(f"\nSaving geocoding-ready data to '{OUTPUT_FILE}'...")
    df.to_csv(OUTPUT_FILE, index=False)

    print("\n--- Success! ---")
    print("Your data has been processed and is ready for geocoding.")

if __name__ == '__main__':
    prepare_for_geocoding()
