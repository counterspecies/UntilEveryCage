# APHIS Data Compiler
#
# This script finds all CSV files named like "ExportData(X).csv" in its
# current directory, merges them into a single file, removes any duplicate
# records, and saves the final result.
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

# The pattern to search for. This will find "ExportData.csv", "ExportData(1).csv", etc.
FILE_PATTERN = 'ExportData*.csv'

# The name of the final, merged CSV file.
FINAL_OUTPUT_FILE = 'all_aphis_data_compiled.csv'

def compile_csv_files():
    """Finds, merges, and cleans all APHIS data files in the current folder."""
    
    # Find all files in the current directory matching the pattern
    print(f"Searching for files matching '{FILE_PATTERN}'...")
    csv_files = glob.glob(FILE_PATTERN)

    if not csv_files:
        print("\nERROR: No files found matching the pattern.")
        print(f"Please make sure your downloaded files (e.g., ExportData(15).csv) are in the same folder as this script.")
        return

    print(f"Found {len(csv_files)} files to merge.")

    # Create a list to hold all the individual DataFrames
    dataframe_list = []

    # Loop through the list of found files and read each one
    for i, filename in enumerate(csv_files):
        print(f"  -> Reading file {i+1}/{len(csv_files)}: {filename}")
        try:
            df = pd.read_csv(filename)
            dataframe_list.append(df)
        except Exception as e:
            print(f"     Could not read or process file {filename}. Error: {e}")

    if not dataframe_list:
        print("\nERROR: No data could be read from the found files.")
        return

    # Concatenate all the DataFrames in the list into a single DataFrame
    print("\nAll files read. Merging into a single dataset...")
    combined_df = pd.concat(dataframe_list, ignore_index=True)
    print(f"Total records before cleaning: {len(combined_df)}")

    # Remove any duplicate rows to ensure the data is clean
    initial_rows = len(combined_df)
    combined_df.drop_duplicates(inplace=True)
    final_rows = len(combined_df)
    print(f"Removed {initial_rows - final_rows} duplicate records.")
    print(f"Total unique records: {final_rows}")

    # Save the final, compiled DataFrame to a new CSV file
    print(f"\nSaving compiled data to '{FINAL_OUTPUT_FILE}'...")
    combined_df.to_csv(FINAL_OUTPUT_FILE, index=False)
    
    print("\n--- Success! ---")
    print("Your data has been compiled and saved.")

if __name__ == '__main__':
    compile_csv_files()
