import pandas as pd
import requests
import json
import time
import re

# The SEC requires a custom User-Agent for all automated requests.
# Please replace the sample info with your own.
HEADERS = {'User-Agent': 'Your Name or Company your.email@example.com'}

def get_company_filings(company_name: str, filing_types: list = ['10-K', 'DEF 14A']) -> dict:
    """
    Finds direct links to the latest SEC filings for a given company.

    Args:
        company_name: The name of the company to search for.
        filing_types: A list of form types to search for.
    
    Returns:
        A dictionary containing links to the requested filings, or an empty dict if not found.
    """
    print(f"  -> Searching SEC for '{company_name}'...")
    
    # --- Step 1: Get all company CIKs from the SEC ---
    try:
        tickers_res = requests.get("https://www.sec.gov/files/company_tickers.json", headers=HEADERS)
        tickers_res.raise_for_status()
        company_data = tickers_res.json()
    except requests.exceptions.RequestException as e:
        print(f"     ERROR: Could not fetch the SEC company list. {e}")
        return {}

    # --- Step 2: Find the CIK for our target company ---
    cik = None
    matched_title = None
    for key, value in company_data.items():
        if company_name.lower() in value['title'].lower():
            cik = str(value['cik_str']).zfill(10)
            matched_title = value['title']
            print(f"     Found match: '{matched_title}' with CIK: {cik}")
            break
    
    if not cik:
        print(f"     INFO: Could not find a public company matching '{company_name}'.")
        return {}
        
    # --- Step 3: Get the list of all filings for that CIK ---
    try:
        filings_res = requests.get(f"https://data.sec.gov/submissions/CIK{cik}.json", headers=HEADERS)
        filings_res.raise_for_status()
        filings_data = filings_res.json()
    except requests.exceptions.RequestException as e:
        print(f"     ERROR: Could not fetch filings for CIK {cik}. {e}")
        return {}
        
    # --- Step 4: Find and store links for the requested filings ---
    filing_links = {'parent_company': matched_title}
    
    for i, form_type in enumerate(filings_data['filings']['recent']['form']):
        if form_type in filing_types:
            # We only want the *first* (most recent) of each type we find
            if form_type not in filing_links:
                accession_number = filings_data['filings']['recent']['accessionNumber'][i].replace('-', '')
                primary_document = filings_data['filings']['recent']['primaryDocument'][i]
                filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession_number}/{primary_document}"
                filing_links[form_type] = filing_url

    return filing_links

def get_base_company_name(establishment_name):
    """A helper function to guess the parent company name."""
    if not isinstance(establishment_name, str):
        return None
    # Use regex to find the first one or two words, which is often the parent company.
    match = re.match(r'^([\w\s,&.-]+)', establishment_name)
    if match:
        # Simplify common endings like Inc, LLC, etc.
        name = match.group(1).strip()
        name = re.sub(r',? (Inc|LLC|Corp|Co)\.?$', '', name, flags=re.IGNORECASE)
        return name.strip()
    return establishment_name

# --- Main Script Logic ---
if __name__ == "__main__":
    try:
        # 1. Load your primary dataset
        print("Loading USDA_data.csv...")
        df = pd.read_csv("USDA_data.csv", dtype=str) # Read all as string to avoid type errors
        print(f"Loaded {len(df)} records.")

        # 2. Identify unique potential parent companies to research
        df['parent_company_guess'] = df['establishment_name'].apply(get_base_company_name)
        unique_companies = df['parent_company_guess'].dropna().unique()
        print(f"\nFound {len(unique_companies)} unique potential parent companies to research.")

        # 3. Loop through unique companies and scrape their data from the SEC
        all_scraped_data = []
        for company in unique_companies:
            # Skip very short or generic names that won't give good results
            if len(company) < 4 or company.lower() in ['meat', 'usda']:
                continue

            company_info = get_company_filings(company)
            if company_info:
                # Add the original guessed name so we can merge on it later
                company_info['parent_company_guess'] = company
                all_scraped_data.append(company_info)

            # IMPORTANT: Be polite to the SEC servers to avoid getting blocked.
            time.sleep(1) 

        # 4. Create a new DataFrame with the scraped SEC data
        print("\n--- Scraping complete ---")
        if not all_scraped_data:
            print("Could not find any SEC data for the companies listed. Exiting.")
        else:
            sec_df = pd.DataFrame(all_scraped_data)
            print(f"Successfully retrieved SEC data for {len(sec_df)} companies.")

            # 5. Merge the SEC data back into your original DataFrame
            print("\nMerging SEC data with original USDA data...")
            enriched_df = pd.merge(df, sec_df, on='parent_company_guess', how='left')

            # 6. Save the final, enriched file
            output_filename = 'enriched_usda_data.csv'
            enriched_df.to_csv(output_filename, index=False)
            print(f"\nSUCCESS! Enriched data saved to '{output_filename}'")
            print("The new file contains all original columns plus 'parent_company', '10-K', and 'DEF 14A'.")

    except FileNotFoundError:
        print("\nERROR: Make sure 'USDA_data.csv' is in the same directory as this script.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
