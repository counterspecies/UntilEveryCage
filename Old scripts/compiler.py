# APHIS Geocoded Data Compiler
#
# This script finds all geocoded chunk files (e.g., "chunk_1_geocoded.csv"),
# merges them into a single file, and saves the final, complete dataset.
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
import glob

# --- 2. CONFIGURATION ---

# The directory where your geocoded chunk files are located.
# This should be the same folder you used for the splitter output.
INPUT_DIRECTORY = 'geocoding_chunks'

# The pattern to find the geocoded files.
# This will find "chunk_1_geocoded.csv", "chunk_2_geocoded.csv", etc.
FILE_PATTERN = 'chunk_*_geocoded.csv'

# The name of the final, merged output file.
FINAL_OUTPUT_FILE = 'final_geocoded_data.csv'


def combine_geocoded_files():
    """Finds and merges all geocoded chunk files."""

    # Check if the input directory exists
    if not os.path.isdir(INPUT_DIRECTORY):
        print(f"\nERROR: Input directory '{INPUT_DIRECTORY}' not found!")
        print(f"Please make sure your geocoded chunks are inside this folder.")
        return
        
    # Create the full search path
    search_path = os.path.join(INPUT_DIRECTORY, FILE_PATTERN)
    
    # Find all files in the directory matching the pattern
    print(f"Searching for files in '{INPUT_DIRECTORY}' matching '{FILE_PATTERN}'...")
    geocoded_files = glob.glob(search_path)

    if not geocoded_files:
        print("\nERROR: No geocoded files found matching the pattern.")
        print(f"Please check the file names and the INPUT_DIRECTORY setting.")
        return

    print(f"Found {len(geocoded_files)} geocoded files to merge.")

    # Create a list to hold all the individual DataFrames
    dataframe_list = []

    # Loop through the list of found files and read each one
    for i, filename in enumerate(geocoded_files):
        print(f"  -> Reading file {i + 1}/{len(geocoded_files)}: {filename}")
        try:
            df = pd.read_csv(filename, dtype=str) # Read as string to preserve all data formats
            dataframe_list.append(df)
        except Exception as e:
            print(f"     Could not read or process file {filename}. Error: {e}")

    if not dataframe_list:
        print("\nERROR: No data could be read from the found files.")
        return

    # Concatenate all the DataFrames in the list into a single DataFrame
    print("\nAll files read. Merging into a single dataset...")
    combined_df = pd.concat(dataframe_list, ignore_index=True)
    
    print(f"Total records in final dataset: {len(combined_df)}")

    # Save the final, compiled DataFrame to a new CSV file
    print(f"\nSaving final geocoded data to '{FINAL_OUTPUT_FILE}'...")
    combined_df.to_csv(FINAL_OUTPUT_FILE, index=False)
    
    print("\n--- Success! ---")
    print("Your geocoded data has been compiled into a single file.")


if __name__ == '__main__':
    combine_geocoded_files()
