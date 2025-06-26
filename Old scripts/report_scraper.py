# --- 1. SETUP ---
#
# Before running, you need to install the necessary Python libraries.
# Open your terminal or command prompt and run these commands:
#
# pip install pandas
# pip install selenium
# pip install webdriver-manager

import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import glob

# --- 2. CONFIGURATION ---

APHIS_URL = 'https://efile.aphis.usda.gov/PublicSearchTool/s/inspection-reports'
DOWNLOAD_FOLDER = os.path.join(os.getcwd(), 'aphis_downloads')
FINAL_OUTPUT_FILE = 'all_aphis_facilities_inspections.csv'

# List of all states and territories to iterate through
STATES_AND_TERRITORIES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
    "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PA", "PR", 
    "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA", "WA", 
    "WV", "WI", "WY"
]

def setup_driver(download_path):
    """Initializes the Selenium WebDriver with custom download settings."""
    print(f"Setting up web driver to download files to: {download_path}")
    if not os.path.exists(download_path):
        os.makedirs(download_path)
    options = webdriver.ChromeOptions()
    prefs = {"download.default_directory": download_path}
    options.add_experimental_option("prefs", prefs)
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    print("Driver setup complete.")
    return driver

def download_pages_for_current_filter(driver, state):
    """Loops through all pages for the current filter, downloading the CSV for each one."""
    page_count = 1
    while True:
        try:
            print(f"  -> Processing page {page_count} for state {state}...")
            wait = WebDriverWait(driver, 20)
            # Wait for the table to be populated
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.slds-table tbody tr')))
            
            # Download the CSV for the current page
            export_button = wait.until(EC.element_to_be_clickable((By.XPATH, '//button[text()="Export to CSV"]')))
            export_button.click()
            time.sleep(3) # Give file time to download

            # Check if the 'Next' button exists and is enabled
            next_buttons = driver.find_elements(By.XPATH, '//button[contains(@class, "nextButton")]')
            if not next_buttons or not next_buttons[0].is_enabled():
                print(f"  -> No more pages for {state}.")
                break
            
            # Click the 'Next' button
            driver.execute_script("arguments[0].click();", next_buttons[0])
            page_count += 1
            time.sleep(2) # Wait for next page to load
        except Exception as e:
            print(f"  -> An error occurred or last page reached for {state}: {e}")
            break

def merge_csv_files(download_path, output_file):
    """Merges all downloaded CSVs into a single file."""
    print("\nStarting the merge process...")
    all_files = glob.glob(os.path.join(download_path, "*.csv"))
    if not all_files:
        print("No CSV files found to merge.")
        return

    print(f"Found {len(all_files)} CSV files to merge.")
    df_list = [pd.read_csv(f) for f in all_files]
    combined_df = pd.concat(df_list, ignore_index=True)
    
    # Remove duplicate rows that might appear from overlapping downloads
    combined_df.drop_duplicates(inplace=True)
    
    combined_df.to_csv(output_file, index=False)
    print(f"\nSuccess! All data has been merged into '{output_file}'.")
    print(f"Total unique records found: {len(combined_df)}")

def main():
    """Main function to run the downloader."""
    driver = setup_driver(DOWNLOAD_FOLDER)
    wait = WebDriverWait(driver, 20)

    try:
        # Loop through each state
        for i, state in enumerate(STATES_AND_TERRITORIES):
            print(f"\n--- Starting State {i+1}/{len(STATES_AND_TERRITORIES)}: {state} ---")
            driver.get(APHIS_URL)

            # Select the state from the dropdown
            try:
                state_dropdown = wait.until(EC.element_to_be_clickable((By.XPATH, '//select[@name="state"]')))
                select = Select(state_dropdown)
                select.select_by_value(state)
                print(f"Selected state: {state}")
            except Exception as e:
                print(f"Could not select state {state}. Skipping. Error: {e}")
                continue

            # Click the main search button
            search_button = wait.until(EC.element_to_be_clickable((By.XPATH, '//button[text()="Search"]')))
            search_button.click()
            print("Search button clicked. Loading results...")

            # Begin the download process for this state
            download_pages_for_current_filter(driver, state)

    finally:
        print("\nAll states processed. Closing the browser.")
        driver.quit()

    # Merge all the downloaded files
    merge_csv_files(DOWNLOAD_FOLDER, FINAL_OUTPUT_FILE)
    
if __name__ == '__main__':
    main()
