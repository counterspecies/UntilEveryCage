# --- 1. SETUP ---
#
# Before running, you need to install the pandas library.
# Open your terminal or command prompt and run this command:
#
# pip install pandas

import pandas as pd
import os

# --- 2. CONFIGURATION ---

# The name of your compiled, uncleaned input file.
# This should be in the same folder as this script.
INPUT_FILE = 'all_aphis_data_compiled.csv'

# The name of the final, cleaned output file.
OUTPUT_FILE = 'active_aphis_facilities.csv'

def clean_data():
    """Reads the compiled data and filters it for active facilities."""

    # Check if the input file exists
    if not os.path.exists(INPUT_FILE):
        print(f"\nERROR: Input file '{INPUT_FILE}' not found!")
        print(f"Please make sure the compiled data file is in the same folder as this script.")
        return

    print(f"Reading compiled data from '{INPUT_FILE}'...")
    try:
        df = pd.read_csv(INPUT_FILE)
    except Exception as e:
        print(f"Could not read the CSV file. Error: {e}")
        return
        
    print(f"Total records found: {len(df)}")

    # Check if the required column exists
    if 'Certificate Status' not in df.columns:
        print("\nERROR: The CSV file does not have a 'Certificate Status' column.")
        print("Cannot perform cleaning. Please check the compiled file.")
        return

    # Filter the DataFrame to keep only rows where 'Certificate Status' is 'Active'
    print("Filtering for 'Active' certificate statuses...")
    active_df = df[df['Certificate Status'] == 'Active'].copy()

    print(f"Found {len(active_df)} active facilities.")

    # Save the cleaned DataFrame to a new CSV file
    print(f"\nSaving cleaned data to '{OUTPUT_FILE}'...")
    active_df.to_csv(OUTPUT_FILE, index=False)

    print("\n--- Success! ---")
    print("Your data has been cleaned and saved.")

if __name__ == '__main__':
    clean_data()
