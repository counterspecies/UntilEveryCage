use serde::Serialize;
use serde::Deserialize;


#[derive(Serialize, Deserialize, Debug)]
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
}

pub fn get_slaughtered_animals(location: &Location) -> String {
    let mut killed_animals: Vec<&str> = Vec::new();

    // --- Livestock ---
    if location.beef_cow_slaughter == "Yes" { killed_animals.push("Beef Cow"); }
    if location.steer_slaughter == "Yes" { killed_animals.push("Steer"); }
    if location.heifer_slaughter == "Yes" { killed_animals.push("Heifer"); }
    if location.bull_stag_slaughter == "Yes" { killed_animals.push("Bull/Stag"); }
    if location.dairy_cow_slaughter == "Yes" { killed_animals.push("Dairy Cow"); }
    if location.heavy_calf_slaughter == "Yes" { killed_animals.push("Heavy Calf"); }
    if location.bob_veal_slaughter == "Yes" { killed_animals.push("Bob Veal"); }
    if location.formula_fed_veal_slaughter == "Yes" { killed_animals.push("Formula-Fed Veal"); }
    if location.non_formula_fed_veal_slaughter == "Yes" { killed_animals.push("Non-Formula-Fed Veal"); }
    if location.market_swine_slaughter == "Yes" { killed_animals.push("Market Swine"); }
    if location.sow_slaughter == "Yes" { killed_animals.push("Sow"); }
    if location.roaster_swine_slaughter == "Yes" { killed_animals.push("Roaster Swine"); }
    if location.boar_stag_swine_slaughter == "Yes" { killed_animals.push("Boar/Stag Swine"); }
    if location.stag_swine_slaughter == "Yes" { killed_animals.push("Stag Swine"); }
    if location.feral_swine_slaughter == "Yes" { killed_animals.push("Feral Swine"); }
    if location.goat_slaughter == "Yes" { killed_animals.push("Goat"); }
    if location.young_goat_slaughter == "Yes" { killed_animals.push("Young Goat"); }
    if location.adult_goat_slaughter == "Yes" { killed_animals.push("Adult Goat"); }
    if location.sheep_slaughter == "Yes" { killed_animals.push("Sheep"); }
    if location.lamb_slaughter == "Yes" { killed_animals.push("Lamb"); }
    if location.deer_reindeer_slaughter == "Yes" { killed_animals.push("Deer/Reindeer"); }
    if location.antelope_slaughter == "Yes" { killed_animals.push("Antelope"); }
    if location.elk_slaughter == "Yes" { killed_animals.push("Elk"); }
    if location.bison_slaughter == "Yes" { killed_animals.push("Bison"); }
    if location.buffalo_slaughter == "Yes" { killed_animals.push("Buffalo"); }
    if location.water_buffalo_slaughter == "Yes" { killed_animals.push("Water Buffalo"); }
    if location.cattalo_slaughter == "Yes" { killed_animals.push("Cattalo"); }
    if location.yak_slaughter == "Yes" { killed_animals.push("Yak"); }
    if location.other_voluntary_livestock_slaughter == "Yes" { killed_animals.push("Other Voluntary Livestock"); }
    if location.rabbit_slaughter == "Yes" { killed_animals.push("Rabbit"); }
    
    // --- Poultry ---
    if location.young_chicken_slaughter == "Yes" { killed_animals.push("Young Chicken"); }
    if location.light_fowl_slaughter == "Yes" { killed_animals.push("Light Fowl"); }
    if location.heavy_fowl_slaughter == "Yes" { killed_animals.push("Heavy Fowl"); }
    if location.capon_slaughter == "Yes" { killed_animals.push("Capon"); }
    if location.young_turkey_slaughter == "Yes" { killed_animals.push("Young Turkey"); }
    if location.young_breeder_turkey_slaughter == "Yes" { killed_animals.push("Young Breeder Turkey"); }
    if location.old_breeder_turkey_slaughter == "Yes" { killed_animals.push("Old Breeder Turkey"); }
    if location.fryer_roaster_turkey_slaughter == "Yes" { killed_animals.push("Fryer/Roaster Turkey"); }
    if location.duck_slaughter == "Yes" { killed_animals.push("Duck"); }
    if location.goose_slaughter == "Yes" { killed_animals.push("Goose"); }
    if location.pheasant_slaughter == "Yes" { killed_animals.push("Pheasant"); }
    if location.quail_slaughter == "Yes" { killed_animals.push("Quail"); }
    if location.guinea_slaughter == "Yes" { killed_animals.push("Guinea"); }
    if location.ostrich_slaughter == "Yes" { killed_animals.push("Ostrich"); }
    if location.emu_slaughter == "Yes" { killed_animals.push("Emu"); }
    if location.rhea_slaughter == "Yes" { killed_animals.push("Rhea"); }
    if location.squab_slaughter == "Yes" { killed_animals.push("Squab"); }
    if location.other_voluntary_poultry_slaughter == "Yes" { killed_animals.push("Other Voluntary Poultry"); }

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
// This function takes a reference to an AphisReport and returns the formatted string.
pub fn get_tested_animals(report: &AphisReport) -> String {
    let mut tested_animals: Vec<String> = Vec::new();

    // Helper closure to reduce code repetition.
    // It takes the count string and the animal name, and if valid, adds the formatted string to the list.
    let mut add_if_tested = |count_str: &str, name: &str| {
        // Attempt to parse the string into an integer.
        // If it succeeds and the number is > 0, format it and push to the vector.
        if let Ok(num) = count_str.parse::<i32>() {
            if num > 0 {
                tested_animals.push(format!("{} {}", num, name));
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