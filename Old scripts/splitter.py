# APHIS Data File Splitter
#
# This script reads a large CSV file and splits it into smaller, numbered
# chunks to accommodate tools with file size or row limits.
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
import math

# --- 2. CONFIGURATION ---

# The name of your geocoding-ready input file.
# This should be in the same folder as this script.
INPUT_FILE = 'geocoding_ready_aphis_data.csv'

# The maximum number of rows you want in each smaller file.
CHUNK_SIZE = 2000

# The folder where the smaller chunk files will be saved.
# This folder will be created if it doesn't exist.
OUTPUT_DIRECTORY = 'geocoding_chunks'

# The prefix for the output file names (e.g., "chunk_1.csv", "chunk_2.csv").
OUTPUT_FILENAME_PREFIX = 'chunk'


def split_csv():
    """Reads a large CSV and splits it into smaller, numbered files."""

    # Check if the input file exists
    if not os.path.exists(INPUT_FILE):
        print(f"\nERROR: Input file '{INPUT_FILE}' not found!")
        print(f"Please make sure the prepared data file is in the same folder as this script.")
        return

    # Create the output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIRECTORY):
        print(f"Creating output directory: '{OUTPUT_DIRECTORY}'")
        os.makedirs(OUTPUT_DIRECTORY)

    print(f"Reading data from '{INPUT_FILE}'...")
    try:
        df = pd.read_csv(INPUT_FILE, dtype=str)
    except Exception as e:
        print(f"Could not read the CSV file. Error: {e}")
        return
        
    total_rows = len(df)
    print(f"Total records found: {total_rows}")

    # Calculate the number of chunks to create
    num_chunks = math.ceil(total_rows / CHUNK_SIZE)
    print(f"Splitting into {num_chunks} files of up to {CHUNK_SIZE} rows each.")

    # Loop through the DataFrame in chunks
    for i in range(num_chunks):
        start_row = i * CHUNK_SIZE
        end_row = start_row + CHUNK_SIZE
        
        # Slice the dataframe to get the current chunk
        chunk_df = df.iloc[start_row:end_row]
        
        # Define the output filename for this chunk
        output_filename = f"{OUTPUT_FILENAME_PREFIX}_{i + 1}.csv"
        output_path = os.path.join(OUTPUT_DIRECTORY, output_filename)
        
        print(f"  -> Saving chunk {i + 1}/{num_chunks} to '{output_path}' ({len(chunk_df)} rows)")
        
        # Save the chunk to a new CSV file
        chunk_df.to_csv(output_path, index=False)

    print("\n--- Success! ---")
    print(f"Your data has been split into {num_chunks} files inside the '{OUTPUT_DIRECTORY}' folder.")


if __name__ == '__main__':
    split_csv()
