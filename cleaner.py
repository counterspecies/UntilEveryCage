# APHIS Final Data Trimmer
#
# This script reads the fully compiled and geocoded APHIS data and
# trims it down to only the essential columns needed for the map,
# removing all extra geocoding metadata.
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

# The name of your final, geocoded input file.
# This should be in the same folder as this script.
INPUT_FILE = 'final_geocoded_data.csv'

# The list of columns you want to KEEP. All other columns will be removed.
# These are based on the list you provided.
COLUMNS_TO_KEEP = [
    'Account Name',
    'Customer Number',
    'Certificate Number',
    'License Type',
    'Certificate Status',
    'Status Date',
    'Address Line 1',
    'Address Line 2',
    'City-State-Zip',
    'County',
    'City',
    'State',
    'Zip',
    'Geocodio Latitude',
    'Geocodio Longitude'
]

# The name of the final, map-ready output file.
OUTPUT_FILE = 'final_map_ready_data.csv'


def trim_final_data():
    """Reads the geocoded data and trims it to only the required columns."""

    # Check if the input file exists
    if not os.path.exists(INPUT_FILE):
        print(f"\nERROR: Input file '{INPUT_FILE}' not found!")
        print(f"Please make sure the compiled geocoded file is in the same folder as this script.")
        return

    print(f"Reading final geocoded data from '{INPUT_FILE}'...")
    try:
        # Read as string to preserve data integrity, especially for numbers
        df = pd.read_csv(INPUT_FILE, dtype=str)
    except Exception as e:
        print(f"Could not read the CSV file. Error: {e}")
        return
        
    print(f"Total records found: {len(df)}")
    print(f"Original number of columns: {len(df.columns)}")

    # Check if all the columns we want to keep actually exist in the file
    missing_columns = [col for col in COLUMNS_TO_KEEP if col not in df.columns]
    if missing_columns:
        print("\nERROR: The following required columns were not found in the input file:")
        for col in missing_columns:
            print(f" - {col}")
        print("Please check the column names in the COLUMNS_TO_KEEP list.")
        return

    # Create a new DataFrame containing only the columns we want to keep
    print(f"\nTrimming data to {len(COLUMNS_TO_KEEP)} columns...")
    trimmed_df = df[COLUMNS_TO_KEEP]

    # Save the trimmed DataFrame to the final output file
    print(f"Saving final map-ready data to '{OUTPUT_FILE}'...")
    trimmed_df.to_csv(OUTPUT_FILE, index=False)

    print("\n--- Success! ---")
    print("Your final data has been trimmed and is ready for use in your application.")


if __name__ == '__main__':
    trim_final_data()
