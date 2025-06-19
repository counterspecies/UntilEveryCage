import pandas as pd
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def scrape_aphis_with_selenium(year: int):
    """
    Scrapes the APHIS database using browser automation with Selenium.

    Args:
        year: The year to search for (e.g., 2024).

    Returns:
        A pandas DataFrame containing all the facility data, or None if an error occurs.
    """
    print("--- INITIATING SELENIUM SCRAPER ---")
    
    # --- Setup Selenium Webdriver ---
    # This automatically downloads and manages the correct driver for your Chrome version.
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless') # Optional: Run Chrome in the background without opening a window
    try:
        driver = webdriver.Chrome(options=options)
        print("Successfully launched Chrome browser.")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not launch Chrome. Please ensure Google Chrome is installed.")
        print("You may also need to install the Selenium driver.")
        print(f"Error details: {e}")
        return None

    all_facilities_data = []
    
    try:
        # 1. Navigate to the page
        url = "https://aphis.my.site.com/PublicSearchTool/s/annual-reports"
        print(f"Navigating to {url}...")
        driver.get(url)

        # 2. Input the search year
        # Wait until the year input field is present on the page
        wait = WebDriverWait(driver, 20) # Wait up to 20 seconds
        year_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='reportYear']")))
        year_input.send_keys(str(year))
        print(f"Entered year: {year}")

        # 3. Click the search button
        search_button = driver.find_element(By.CSS_SELECTOR, "button[title='Search Annual Reports']")
        search_button.click()
        print("Clicked search button. Waiting for results...")

        # 4. Loop through all pages of the results
        page_number = 1
        while True:
            print(f"Scraping page {page_number}...")
            
            # Wait for the table to load on the current page
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.slds-table")))
            
            # Use pandas to directly read the HTML table into a DataFrame
            # This is a very efficient way to grab table data.
            table_html = driver.find_element(By.CSS_SELECTOR, "table.slds-table").get_attribute('outerHTML')
            df_list = pd.read_html(table_html)
            if df_list:
                all_facilities_data.append(df_list[0])
                print(f"  > Scraped {len(df_list[0])} records.")

            # 5. Find the 'Next' button and check if it's disabled
            try:
                next_button = driver.find_element(By.CSS_SELECTOR, "button[title='Next']")
                if not next_button.is_enabled():
                    print("'Next' button is disabled. Reached the last page.")
                    break
                
                # Click the 'Next' button to go to the next page
                next_button.click()
                page_number += 1
                time.sleep(2) # Wait a moment for the next page to load
            except NoSuchElementException:
                print("Could not find 'Next' button. Assuming single page of results.")
                break

    except TimeoutException:
        print("Error: Timed out waiting for page elements to load. The website may be slow or has changed.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during scraping: {e}")
        return None
    finally:
        # Important: always close the browser window when finished or if an error occurs
        print("Closing browser...")
        driver.quit()

    if not all_facilities_data:
        return None

    # Combine all the DataFrames from each page into one
    final_df = pd.concat(all_facilities_data, ignore_index=True)
    return final_df


# --- Main script execution ---
if __name__ == "__main__":
    target_year = 2024
    
    facilities_df = scrape_aphis_with_selenium(target_year)

    if facilities_df is not None and not facilities_df.empty:
        # Rename columns to be more script-friendly
        facilities_df.rename(columns={
            'Legal Name': 'facility_name',
            'Certificate Number': 'certificate_number',
            'City': 'city',
            'State': 'state',
            'Zip Code': 'zip_code'
        }, inplace=True)

        output_filename = f'aphis_research_facilities_{target_year}.csv'
        facilities_df.to_csv(output_filename, index=False)
        
        print(f"\nSUCCESS! Scraped {len(facilities_df)} total records and saved to '{output_filename}'")
    else:
        print("\nNo data was collected.")
