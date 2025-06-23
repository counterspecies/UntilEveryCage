import pandas as pd
import glob
import os

def combine_aphis_data():
    """
    Combines separate APHIS data exports for registrants and reports
    into a single CSV file.
    """
    print("--- APHIS Data Combination Script ---")

    # --- Define the file groups ---
    # The base file is named 'ExportData.csv'
    registrant_files = ['ExportData.csv'] + [f'ExportData({i}).csv' for i in range(1, 11)]
    report_files = [f'ExportData({i}).csv' for i in range(11, 22)]

    # --- Process Registrants Files (0-10) ---
    registrant_dfs = []
    print("\nReading Registrant files (0-10)...")
    for file in registrant_files:
        try:
            print(f"  - Reading {file}")
            # Use dtype=str to prevent pandas from guessing data types incorrectly
            df = pd.read_csv(file, dtype=str)
            registrant_dfs.append(df)
        except FileNotFoundError:
            print(f"  > WARNING: Could not find file '{file}'. Skipping.")
        except Exception as e:
            print(f"  > ERROR reading '{file}': {e}. Skipping.")

    if not registrant_dfs:
        print("\nCRITICAL ERROR: No registrant files could be read. Exiting.")
        return

    # Combine all registrant data into a single DataFrame
    registrants_df = pd.concat(registrant_dfs, ignore_index=True)
    # Remove any duplicate rows just in case of overlap
    registrants_df.drop_duplicates(inplace=True)
    print(f"\nSuccessfully combined {len(registrant_dfs)} registrant files into a single table with {len(registrants_df)} unique rows.")


    # --- Process Reports Files (11-21) ---
    report_dfs = []
    print("\nReading Report files (11-21)...")
    for file in report_files:
        try:
            print(f"  - Reading {file}")
            df = pd.read_csv(file, dtype=str)
            report_dfs.append(df)
        except FileNotFoundError:
            print(f"  > WARNING: Could not find file '{file}'. Skipping.")
        except Exception as e:
            print(f"  > ERROR reading '{file}': {e}. Skipping.")

    if not report_dfs:
        print("\nCRITICAL ERROR: No report files could be read. Exiting.")
        return
        
    reports_df = pd.concat(report_dfs, ignore_index=True)
    reports_df.drop_duplicates(inplace=True)
    print(f"\nSuccessfully combined {len(report_dfs)} report files into a single table with {len(reports_df)} unique rows.")


    # --- Merge the two datasets ---
    # We will merge based on 'Certificate Number', which should be the common key.
    merge_key = 'Certificate Number'
    print(f"\nMerging the two datasets on the '{merge_key}' column...")

    if merge_key not in registrants_df.columns:
        print(f"CRITICAL ERROR: Merge key '{merge_key}' not found in registrant data.")
        return
    if merge_key not in reports_df.columns:
        print(f"CRITICAL ERROR: Merge key '{merge_key}' not found in report data.")
        return

    # A left merge keeps every registrant and adds report data where it matches.
    combined_df = pd.merge(registrants_df, reports_df, on=merge_key, how='left')
    print("Merge complete.")

    # --- Save the final file ---
    output_filename = 'aphis_combined_data.csv'
    try:
        combined_df.to_csv(output_filename, index=False)
        print(f"\nSUCCESS! All data has been combined and saved to '{output_filename}'")
        print(f"The final file contains {len(combined_df)} rows.")
    except Exception as e:
        print(f"\nCRITICAL ERROR: Could not save the final CSV file. Error: {e}")


# --- Run the script ---
if __name__ == "__main__":
    combine_aphis_data()
