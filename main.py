import pandas as pd

# Define the filenames
directory_file = 'mpi_locations.csv'
demographics_file = 'Dataset_Establishment_Demographic_Data(1).csv'
output_file = 'slaughter_data_combined.csv'

try:
    # Load the two CSV files into pandas DataFrames
    print("Loading datasets...")
    directory_df = pd.read_csv(directory_file)
    demographics_df = pd.read_csv(demographics_file)
    print("Files loaded successfully.")

    # --- Filtering Logic ---
    # Find all columns in the demographic data related to slaughter
    slaughter_columns = [col for col in demographics_df.columns if 'slaughter' in col.lower()]
    
    # Define the final list of columns to keep from the demographic data.
    # We must include the 'establishment_number' to join the files.
    columns_to_keep = ['establishment_number'] + slaughter_columns
    
    print(f"\nFound {len(slaughter_columns)} slaughter-related columns to keep.")

    # Create a new, filtered DataFrame with only the desired columns
    filtered_demographics_df = demographics_df[columns_to_keep]

    # --- Merging Logic ---
    # Perform a left merge.
    print(f"Merging the files on 'establishment_number'...")
    combined_df = pd.merge(directory_df, filtered_demographics_df, on='establishment_number', how='left')

    # Save the new, focused DataFrame to a new CSV file
    print(f"Saving the merged data to '{output_file}'...")
    combined_df.to_csv(output_file, index=False)

    print("\nSuccessfully created the focused, combined file!")
    print(f"The new file '{output_file}' has {combined_df.shape[0]} rows and {combined_df.shape[1]} columns.")

except FileNotFoundError as e:
    print(f"\nError: {e}")
    print("Please make sure both input CSV files are in the same directory as the script.")
except Exception as e:
    print(f"\nAn error occurred: {e}")