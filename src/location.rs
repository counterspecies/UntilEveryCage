// Until Every Cage is Empty
// Copyright (C) 2025 Eli Perez
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

// Contact the developer directly at untileverycageproject@protonmail.com
use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Location {
    pub establishment_id: String,
    pub establishment_number: String,
    pub establishment_name: String,
    pub duns_number: String,
    pub street: String,
    pub city: String,
    pub state: String,
    pub zip: String,
    pub phone: String,
    pub grant_date: String,
    #[serde(rename = "type")]
    pub activities: String,
    pub dbas: String,
    pub district: String,
    pub circuit: String,
    pub size: String,
    pub latitude: f64,
    pub longitude: f64,
    pub county: String,
    pub fips_code: String,
    pub meat_exemption_custom_slaughter: String,
    pub poultry_exemption_custom_slaughter: String,
    pub slaughter: String,
    pub meat_slaughter: String,
    pub beef_cow_slaughter: String,
    pub steer_slaughter: String,
    pub heifer_slaughter: String,
    pub bull_stag_slaughter: String,
    pub dairy_cow_slaughter: String,
    pub heavy_calf_slaughter: String,
    pub bob_veal_slaughter: String,
    pub formula_fed_veal_slaughter: String,
    pub non_formula_fed_veal_slaughter: String,
    pub market_swine_slaughter: String,
    pub sow_slaughter: String,
    pub roaster_swine_slaughter: String,
    pub boar_stag_swine_slaughter: String,
    pub stag_swine_slaughter: String,
    pub feral_swine_slaughter: String,
    pub goat_slaughter: String,
    pub young_goat_slaughter: String,
    pub adult_goat_slaughter: String,
    pub sheep_slaughter: String,
    pub lamb_slaughter: String,
    pub deer_reindeer_slaughter: String,
    pub antelope_slaughter: String,
    pub elk_slaughter: String,
    pub bison_slaughter: String,
    pub buffalo_slaughter: String,
    pub water_buffalo_slaughter: String,
    pub cattalo_slaughter: String,
    pub yak_slaughter: String,
    pub other_voluntary_livestock_slaughter: String,
    pub rabbit_slaughter: String,
    pub poultry_slaughter: String,
    pub young_chicken_slaughter: String,
    pub light_fowl_slaughter: String,
    pub heavy_fowl_slaughter: String,
    pub capon_slaughter: String,
    pub young_turkey_slaughter: String,
    pub young_breeder_turkey_slaughter: String,
    pub old_breeder_turkey_slaughter: String,
    pub fryer_roaster_turkey_slaughter: String,
    pub duck_slaughter: String,
    pub goose_slaughter: String,
    pub pheasant_slaughter: String,
    pub quail_slaughter: String,
    pub guinea_slaughter: String,
    pub ostrich_slaughter: String,
    pub emu_slaughter: String,
    pub rhea_slaughter: String,
    pub squab_slaughter: String,
    pub other_voluntary_poultry_slaughter: String,
    pub slaughter_or_processing_only: String,
    pub slaughter_only_class: String,
    pub slaughter_only_species: String,
    pub meat_slaughter_only_species: String,
    pub poultry_slaughter_only_species: String,
    pub slaughter_volume_category: String,
    pub processing_volume_category: String,

    // --- PROCESSING FIELDS ---
    pub beef_processing: String,
    pub pork_processing: String,
    pub antelope_processing: String,
    pub bison_processing: String,
    pub buffalo_processing: String,
    pub deer_processing: String,
    pub elk_processing: String,
    pub goat_processing: String,
    pub other_voluntary_livestock_processing: String,
    pub rabbit_processing: String,
    pub reindeer_processing: String,
    pub sheep_processing: String,
    pub yak_processing: String,
    pub chicken_processing: String,
    pub duck_processing: String,
    pub goose_processing: String,
    pub pigeon_processing: String,
    pub ratite_processing: String,
    pub turkey_processing: String,
    pub exotic_poultry_processing: String,
    pub other_voluntary_poultry_processing: String,
}

// --- NEW HELPER FUNCTION FOR PROCESSED ANIMALS ---
pub fn get_processed_animals(location: &Location) -> String {
    let mut processed_animals: Vec<&str> = Vec::new();

    // Helper closure to check the Option<String> fields safely
    let mut add_if_processed = |field: &str, name: &'static str| {
        if field == "Yes" {
            processed_animals.push(name);
        }
    };

    // --- Livestock Processing ---
    add_if_processed(&location.beef_processing, "Beef");
    add_if_processed(&location.pork_processing, "Pork");
    add_if_processed(&location.antelope_processing, "Antelope");
    add_if_processed(&location.bison_processing, "Bison");
    add_if_processed(&location.buffalo_processing, "Buffalo");
    add_if_processed(&location.deer_processing, "Deer");
    add_if_processed(&location.elk_processing, "Elk");
    add_if_processed(&location.goat_processing, "Goat");
    add_if_processed(
        &location.other_voluntary_livestock_processing,
        "Other Voluntary Livestock",
    );
    add_if_processed(&location.rabbit_processing, "Rabbit");
    add_if_processed(&location.reindeer_processing, "Reindeer");
    add_if_processed(&location.sheep_processing, "Sheep");
    add_if_processed(&location.yak_processing, "Yak");

    // --- Poultry Processing ---
    add_if_processed(&location.chicken_processing, "Chicken");
    add_if_processed(&location.duck_processing, "Duck");
    add_if_processed(&location.goose_processing, "Goose");
    add_if_processed(&location.pigeon_processing, "Pigeon");
    add_if_processed(&location.ratite_processing, "Ratite (Ostrich/Emu)");
    add_if_processed(&location.turkey_processing, "Turkey");
    add_if_processed(&location.exotic_poultry_processing, "Exotic Poultry");
    add_if_processed(
        &location.other_voluntary_poultry_processing,
        "Other Voluntary Poultry",
    );

    if processed_animals.is_empty() {
        "N/A".to_string()
    } else {
        processed_animals.join(", ")
    }
}

// --- UPDATED to use more common names ---
pub fn get_slaughtered_animals(location: &Location) -> String {
    let mut killed_animals: Vec<&str> = Vec::new();

    if location.beef_cow_slaughter == "Yes"
        || location.steer_slaughter == "Yes"
        || location.heifer_slaughter == "Yes"
        || location.bull_stag_slaughter == "Yes"
        || location.dairy_cow_slaughter == "Yes"
    {
        killed_animals.push("Cattle (Cows, Bulls)");
    }
    if location.heavy_calf_slaughter == "Yes"
        || location.bob_veal_slaughter == "Yes"
        || location.formula_fed_veal_slaughter == "Yes"
        || location.non_formula_fed_veal_slaughter == "Yes"
    {
        killed_animals.push("Calves (Veal)");
    }
    if location.market_swine_slaughter == "Yes"
        || location.sow_slaughter == "Yes"
        || location.roaster_swine_slaughter == "Yes"
        || location.boar_stag_swine_slaughter == "Yes"
        || location.stag_swine_slaughter == "Yes"
        || location.feral_swine_slaughter == "Yes"
    {
        killed_animals.push("Pigs");
    }
    if location.goat_slaughter == "Yes"
        || location.young_goat_slaughter == "Yes"
        || location.adult_goat_slaughter == "Yes"
    {
        killed_animals.push("Goats");
    }
    if location.sheep_slaughter == "Yes" || location.lamb_slaughter == "Yes" {
        killed_animals.push("Sheep & Lambs");
    }
    if location.deer_reindeer_slaughter == "Yes" {
        killed_animals.push("Deer & Reindeer");
    }
    if location.antelope_slaughter == "Yes" {
        killed_animals.push("Antelope");
    }
    if location.elk_slaughter == "Yes" {
        killed_animals.push("Elk");
    }
    if location.bison_slaughter == "Yes"
        || location.buffalo_slaughter == "Yes"
        || location.water_buffalo_slaughter == "Yes"
        || location.cattalo_slaughter == "Yes"
    {
        killed_animals.push("Bison & Buffalo");
    }
    if location.yak_slaughter == "Yes" {
        killed_animals.push("Yak");
    }
    if location.other_voluntary_livestock_slaughter == "Yes" {
        killed_animals.push("Other Livestock");
    }
    if location.rabbit_slaughter == "Yes" {
        killed_animals.push("Rabbits");
    }

    // --- Poultry ---
    if location.young_chicken_slaughter == "Yes"
        || location.light_fowl_slaughter == "Yes"
        || location.heavy_fowl_slaughter == "Yes"
        || location.capon_slaughter == "Yes"
    {
        killed_animals.push("Chickens");
    }
    if location.young_turkey_slaughter == "Yes"
        || location.young_breeder_turkey_slaughter == "Yes"
        || location.old_breeder_turkey_slaughter == "Yes"
        || location.fryer_roaster_turkey_slaughter == "Yes"
    {
        killed_animals.push("Turkeys");
    }
    if location.duck_slaughter == "Yes" {
        killed_animals.push("Ducks");
    }
    if location.goose_slaughter == "Yes" {
        killed_animals.push("Geese");
    }
    if location.pheasant_slaughter == "Yes" {
        killed_animals.push("Pheasants");
    }
    if location.quail_slaughter == "Yes" {
        killed_animals.push("Quail");
    }
    if location.guinea_slaughter == "Yes" {
        killed_animals.push("Guinea Fowl");
    }
    if location.ostrich_slaughter == "Yes"
        || location.emu_slaughter == "Yes"
        || location.rhea_slaughter == "Yes"
    {
        killed_animals.push("Ratites (Ostrich, Emu, etc.)");
    }
    if location.squab_slaughter == "Yes" {
        killed_animals.push("Pigeons (Squab)");
    }
    if location.other_voluntary_poultry_slaughter == "Yes" {
        killed_animals.push("Other Poultry");
    }

    // Join the collected names with a comma and space
    killed_animals.join(", ")
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AphisReport {
    #[serde(rename = "Account Name")]
    pub account_name: String,
    #[serde(rename = "Customer Number_x")]
    pub customer_number_x: String,
    #[serde(rename = "Certificate Number")]
    pub certificate_number: String,
    #[serde(rename = "Registration Type")]
    pub registration_type: String,
    #[serde(rename = "Certificate Status")]
    pub certificate_status: String,
    #[serde(rename = "Status Date")]
    pub status_date: String,
    #[serde(rename = "Address Line 1")]
    pub address_line_1: String,
    #[serde(rename = "Address Line 2")]
    pub address_line_2: String,
    #[serde(rename = "City-State-Zip")]
    pub city_state_zip: String,
    #[serde(rename = "County")]
    pub county: String,
    #[serde(rename = "Customer Number_y")]
    pub customer_number_y: String,
    #[serde(rename = "Year")]
    pub year: String,
    #[serde(rename = "Dogs")]
    pub dogs: String,
    #[serde(rename = "Cats")]
    pub cats: String,
    #[serde(rename = "Guinea Pigs")]
    pub guinea_pigs: String,
    #[serde(rename = "Hamsters")]
    pub hamsters: String,
    #[serde(rename = "Rabbits")]
    pub rabbits: String,
    #[serde(rename = "Non-Human Primates")]
    pub non_human_primates: String,
    #[serde(rename = "Sheep")]
    pub sheep: String,
    #[serde(rename = "Pigs")]
    pub pigs: String,
    #[serde(rename = "Other Farm Animals")]
    pub other_farm_animals: String,
    #[serde(rename = "All Other Animals")]
    pub all_other_animals: String,
    pub latitude: f64,
    pub longitude: f64,
    #[serde(rename = "Animals Tested On")]
    pub animals_tested: Option<String>,
}

// This function takes a reference to an AphisReport and returns the formatted string.
pub fn get_tested_animals(report: &AphisReport) -> String {
    let mut tested_animals: Vec<String> = Vec::new();

    // Helper closure to reduce code repetition.
    // It takes the count string and the animal name, and if valid, adds the formatted string to the list.
    let mut add_if_tested = |count_str: &str, name: &str| {
        // Attempt to parse the string into an integer.
        // If it succeeds and the number is > 0, format it and push to the vector.
        if let Ok(num) = count_str.parse::<f32>() {
            if num > 0.0 {
                tested_animals.push(format!("{} {}", num as i32, name));
            }
        }
    };

    // Call the helper for each animal type
    add_if_tested(&report.dogs, "Dogs");
    add_if_tested(&report.cats, "Cats");
    add_if_tested(&report.guinea_pigs, "Guinea Pigs");
    add_if_tested(&report.hamsters, "Hamsters");
    add_if_tested(&report.rabbits, "Rabbits");
    add_if_tested(&report.non_human_primates, "Non-Human Primates");
    add_if_tested(&report.sheep, "Sheep");
    add_if_tested(&report.pigs, "Pigs");
    add_if_tested(&report.other_farm_animals, "Other Farm Animals");
    add_if_tested(&report.all_other_animals, "All Other Animals");

    // If no animals were found, return "N/A". Otherwise, join the list.
    if tested_animals.is_empty() {
        "Unknown".to_string()
    } else {
        tested_animals.join(", ")
    }
}

// --- NEW STRUCT for Inspection Reports ---
#[derive(Debug, Serialize, Deserialize)]
pub struct InspectionReport {
    #[serde(rename = "Account Name")]
    pub account_name: String,
    #[serde(rename = "Customer Number")]
    pub customer_number: String,
    #[serde(rename = "Certificate Number")]
    pub certificate_number: String,
    #[serde(rename = "License Type")]
    pub license_type: String,
    #[serde(rename = "Certificate Status")]
    pub certificate_status: String,
    #[serde(rename = "Status Date")]
    pub status_date: String,
    #[serde(rename = "Address Line 1")]
    pub address_line_1: String,
    #[serde(rename = "Address Line 2")]
    pub address_line_2: String,
    #[serde(rename = "City-State-Zip")]
    pub city_state_zip: String,
    #[serde(rename = "County")]
    pub county: String,
    #[serde(rename = "City")]
    pub city: String,
    #[serde(rename = "State")]
    pub state: String,
    #[serde(rename = "Zip")]
    pub zip: String,
    #[serde(rename = "Geocodio Latitude")]
    pub latitude: f64,
    #[serde(rename = "Geocodio Longitude")]
    pub longitude: f64,
}
