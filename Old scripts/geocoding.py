import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import time
import re

def clean_address(address_line_1, city_state_zip):
    """
    Cleans up common non-address patterns from address strings to improve geocoding accuracy.
    """
    # Remove common non-geographical terms using regular expressions, case-insensitive
    patterns_to_remove = [
        r'V\.P\. FOR RESEARCH[ /]*',
        r'OFFICE OF COMPARATIVE MEDICINE[ /]*',
        r'OFFICE OF RESEARCH ADMIN[ /]*',
        r'DIR\., PRECLINICAL RES\. DEPT[ ,]*',
        r'P O BOX \d+[ ,]*',
        r'PO Box \d+[ ,]*',
        r'ROOM \w+[ ,]*',
        r'DEPT \w+[ ,]*',
        r'Unit \d+[ ,]*'
    ]
    
    cleaned_address = address_line_1
    for pattern in patterns_to_remove:
        cleaned_address = re.sub(pattern, '', cleaned_address, flags=re.IGNORECASE)

    # Combine the cleaned address line with the city/state/zip
    # The strip() removes any leading/trailing whitespace left after cleaning
    return f"{cleaned_address.strip()}, {city_state_zip}"


def geocode_aphis_data(input_filename="aphis_combined_data.csv", output_filename="aphis_geocoded_data.csv"):
    """
    Reads an APHIS data CSV, geocodes the addresses to find latitude and longitude,
    and saves a new, enriched CSV file.
    """
    print("--- Starting Geocoding Process for APHIS Data ---")
    
    try:
        df = pd.read_csv(input_filename, dtype=str)
        print(f"Successfully loaded {len(df)} records from '{input_filename}'.")
    except FileNotFoundError:
        print(f"ERROR: The input file '{input_filename}' was not found. Please make sure it's in the same folder.")
        return

    # Initialize the Nominatim geocoder with a longer timeout
    # This is the key fix for the TimeoutError
    geolocator = Nominatim(user_agent="aphis_map_project/1.0", timeout=10)
    
    # Create a rate-limited geocoding function that respects the API's usage policy
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1, error_wait_seconds=10.0)

    latitudes = []
    longitudes = []

    print("\nStarting to geocode addresses. This will take several minutes...")
    # Loop through each row in the DataFrame with a progress indicator
    for index, row in df.iterrows():
        # Clean the address before geocoding
        address_str = clean_address(str(row['Address Line 1']), str(row['City-State-Zip']))
        
        print(f"  ({index + 1}/{len(df)}) Geocoding: {row['Account Name']}...")

        try:
            location = geocode(address_str)
            if location:
                latitudes.append(location.latitude)
                longitudes.append(location.longitude)
            else:
                # If the address still can't be found, append empty values
                latitudes.append(None)
                longitudes.append(None)
                print(f"    > WARNING: Could not find coordinates for cleaned address: {address_str}")

        except Exception as e:
            print(f"    > ERROR during geocoding: {e}. Appending empty values.")
            latitudes.append(None)
            longitudes.append(None)

    # Add the new latitude and longitude columns to the DataFrame
    df['latitude'] = latitudes
    df['longitude'] = longitudes
    print("\nGeocoding process complete.")

    # Save the new DataFrame to a new file
    df.to_csv(output_filename, index=False)
    print(f"\nSUCCESS! Enriched data with coordinates has been saved to '{output_filename}'")


# --- Main script execution ---
if __name__ == "__main__":
    geocode_aphis_data()
