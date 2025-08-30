#!/usr/bin/env python3
import csv
import os
import re
import sys
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# Data can be sourced from here: https://bltu.bvl.bund.de/bltu/app/process/bvl-btl_p_veroeffentlichung?execution=e6s1
# Download the CSVs, merge them (csvstack) and run the script.
# Querying the geodata takes a considerable amount of time. To speed up the process, you can create a lookup file first:
# $ csvcut -c street,city,zip,latitude,longitude locations.csv > geodata.csv

geolocator = Nominatim(user_agent="until-every-cage-is-empty_germany-import")

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} input.csv output.csv", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    cache_dict = load_geodata_cache("geodata.csv")

    # define all header fields
    headers = [
        "establishment_id", "establishment_number", "establishment_name", "duns_number",
        "street", "city", "state", "zip", "phone", "grant_date", "activities", "dbas",
        "district", "circuit", "size", "latitude", "longitude", "county", "fips_code",
        "meat_exemption_custom_slaughter", "poultry_exemption_custom_slaughter", "slaughter",
        "meat_slaughter", "beef_cow_slaughter", "steer_slaughter", "heifer_slaughter",
        "bull_stag_slaughter", "dairy_cow_slaughter", "heavy_calf_slaughter", "bob_veal_slaughter",
        "formula_fed_veal_slaughter", "non_formula_fed_veal_slaughter", "market_swine_slaughter",
        "sow_slaughter", "roaster_swine_slaughter", "boar_stag_swine_slaughter", "stag_swine_slaughter",
        "feral_swine_slaughter", "goat_slaughter", "young_goat_slaughter", "adult_goat_slaughter",
        "sheep_slaughter", "lamb_slaughter", "deer_reindeer_slaughter", "antelope_slaughter",
        "elk_slaughter", "bison_slaughter", "buffalo_slaughter", "water_buffalo_slaughter",
        "cattalo_slaughter", "yak_slaughter", "other_voluntary_livestock_slaughter", "rabbit_slaughter",
        "poultry_slaughter", "young_chicken_slaughter", "light_fowl_slaughter", "heavy_fowl_slaughter",
        "capon_slaughter", "young_turkey_slaughter", "young_breeder_turkey_slaughter",
        "old_breeder_turkey_slaughter", "fryer_roaster_turkey_slaughter", "duck_slaughter",
        "goose_slaughter", "pheasant_slaughter", "quail_slaughter", "guinea_slaughter",
        "ostrich_slaughter", "emu_slaughter", "rhea_slaughter", "squab_slaughter",
        "other_voluntary_poultry_slaughter", "slaughter_or_processing_only", "slaughter_only_class",
        "slaughter_only_species", "meat_slaughter_only_species", "poultry_slaughter_only_species",
        "slaughter_volume_category", "goat_processing", "nrte_ratite_processing", "processing",
        "raw_intact_processing", "yak_processing", "raw_non_intact_ratite_processing",
        "active_egg_grant", "rte_yak_processing", "rte_processing", "unspecified_poultry_processing",
        "raw_non_intact_bison_processing", "raw_non_intact_duck_processing", "chicken_processing",
        "rte_elk_processing", "rabbit_processing", "raw_non_intact_poultry_processing",
        "meat_processing", "rte_other_voluntary_livestock_processing", "deer_processing",
        "raw_non_intact_egg_processing", "other_voluntary_livestock_processing",
        "rte_rabbit_processing", "last_meat_grant_edit_date", "rte_unspecified_meat_processing",
        "nrte_sheep_processing", "raw_non_intact_turkey_processing", "sheep_processing",
        "rte_egg_processing", "meat_exemption_religious_other", "rte_pork_processing",
        "poultry_processing", "nrte_goose_processing", "inspection_system_nsis",
        "rte_buffalo_processing", "poultry_harvest_cell_cultured", "beef_processing",
        "rte_beef_processing", "inspection_system_sis", "raw_intact_sheep_processing",
        "rte_pigeon_processing", "raw_intact_chicken_processing", "nrte_deer_processing",
        "inspection_system_viscera_table_tongue_out", "processing_volume_category",
        "raw_intact_beef_processing", "rte_deer_processing", "raw_intact_turkey_processing",
        "raw_non_intact_exotic_poultry_processing", "processing_only_species",
        "nrte_chicken_processing", "raw_intact_goose_processing", "active_meat_grant",
        "nrte_bison_processing", "nrte_beef_processing", "last_egg_grant_edit_date",
        "raw_non_intact_pork_processing", "raw_intact_unspecified_processing",
        "meat_exemption_retail", "rte_exotic_poultry_processing", "poultry_exemption_retail",
        "active_poultry_grant", "raw_intact_bison_processing", "rte_siluriformes_processing",
        "raw_non_intact_unspecified_poultry_processing", "raw_non_intact_pigeon_processing",
        "poultry_exemption_religious_islamic", "nrte_other_voluntary_livestock_processing",
        "raw_non_intact_other_voluntary_livestock_processing", "rte_meat_processing",
        "nrte_reindeer_processing", "nrte_exotic_poultry_processing", "poultry_exemption_religious",
        "meat_exemption_custom_processing", "raw_intact_other_voluntary_livestock_processing",
        "inspection_system_nti1", "nrte_unspecified_poultry_processing", "nrte_pigeon_processing",
        "rte_unspecified_processing", "poultry_further_process_cell_cultured",
        "nrte_buffalo_processing", "raw_intact_elk_processing", "goose_processing",
        "active_voluntary_grant", "raw_intact_antelope_processing",
        "inspection_system_viscera_table_tongue_in", "rte_turkey_processing",
        "raw_non_intact_processing", "nrte_processing", "nrte_rabbit_processing",
        "poultry_exemption_religious_buddhist", "raw_intact_pigeon_processing",
        "inspection_system_head_attached", "last_voluntary_grant_edit_date",
        "meat_exemption_religious_kosher", "raw_intact_meat_processing",
        "inspection_system_nti2_modified", "inspection_system_nti2", "inspection_system_npis",
        "nrte_turkey_processing", "nrte_goat_processing", "inspection_system_not_specified",
        "rte_sheep_processing", "exotic_poultry_processing", "inspection_system_npis_waiver",
        "raw_non_intact_unspecified_meat_processing", "rte_unspecified_poultry_processing",
        "meat_processing_only_species", "rte_goose_processing", "rte_duck_processing",
        "meat_harvest_cell_cultured", "nrte_siluriformes_processing", "rte_ratite_processing",
        "nrte_pork_processing", "raw_non_intact_deer_processing", "meat_exemption_religious",
        "raw_intact_pork_processing", "raw_non_intact_rabbit_processing",
        "nrte_duck_processing", "raw_non_intact_other_voluntary_poultry_processing",
        "raw_non_intact_goose_processing", "listeria_alternative", "raw_intact_rabbit_processing",
        "rte_goat_processing", "raw_non_intact_reindeer_processing", "nrte_meat_processing",
        "raw_intact_unspecified_poultry_processing", "rte_other_voluntary_poultry_processing",
        "nrte_unspecified_processing", "other_voluntary_poultry_processing",
        "nrte_yak_processing", "raw_intact_other_voluntary_poultry_processing",
        "nrte_other_voluntary_poultry_processing", "raw_non_intact_beef_processing",
        "raw_non_intact_antelope_processing", "rte_bison_processing",
        "raw_non_intact_unspecified_processing", "nrte_elk_processing", "reindeer_processing",
        "duck_processing", "raw_intact_duck_processing", "raw_intact_buffalo_processing",
        "inspection_system_nti1_modified", "unspecified_meat_processing",
        "raw_intact_unspecified_meat_processing", "raw_non_intact_buffalo_processing",
        "raw_non_intact_goat_processing", "rte_poultry_processing", "egg_processing",
        "meat_exemption_religious_halal", "raw_intact_goat_processing",
        "inspection_system_traditional", "ratite_processing", "raw_intact_exotic_poultry_processing",
        "raw_non_intact_elk_processing", "raw_non_intact_siluriformes_processing",
        "raw_intact_deer_processing", "pigeon_processing", "raw_non_intact_yak_processing",
        "raw_intact_ratite_processing", "nrte_poultry_processing", "unspecified_processing",
        "elk_processing", "last_poultry_grant_edit_date", "poultry_exemption_custom_processing",
        "siluriformes_processing", "raw_non_intact_chicken_processing", "processing_only_class",
        "bison_processing", "raw_intact_siluriformes_processing", "buffalo_processing",
        "inspection_system_nels", "inspection_system_head_detached",
        "poultry_exemption_religious_confucian", "raw_non_intact_meat_processing",
        "antelope_processing", "turkey_processing", "poultry_processing_only_species",
        "rte_antelope_processing", "raw_intact_yak_processing", "poultry_exemption_religious_kosher",
        "nrte_unspecified_meat_processing", "inspection_system_viscera_truck",
        "raw_intact_poultry_processing", "rte_chicken_processing", "meat_further_process_cell_cultured",
        "nrte_antelope_processing", "processing_only_category", "raw_non_intact_sheep_processing",
        "rte_reindeer_processing", "raw_intact_reindeer_processing", "pork_processing"
    ]

    with open(input_file, 'r') as infile, open(output_file, 'w', newline='') as outfile:
        reader = csv.reader(infile, delimiter=',')
        writer = csv.writer(outfile, delimiter=',')

        # process header row
        writer.writerow(headers)

        # process data rows
        for row in reader:
            if not row:
                continue

            # merge fields for establishment id
            establishment_id = row[0].strip() if row[0].strip() else row[1].strip()
            establishment_name = row[2].strip()

            # extract address components
            street, city, zip_code = "", "", ""
            if row[3].strip():
                match = re.search(r'[0-9]{5}', row[3])
                if match:
                    street = row[3][:match.start()].strip()
                    zip_code = match.group()
                    city = row[3][match.end():].strip()

            latitude, longitude = 0.0, 0.0
            cache_key = (street, city, zip_code)
            if cache_key in cache_dict:
                latitude, longitude = cache_dict[cache_key]
            else:
                latitude, longitude = geocode_address(street, city, zip_code)

            activities = []
            slaughter = False
            processing = False
            if row[4].strip():
                if "CP" or "GME" in row[4]:  # cutting plant, game handling establishment
                    activities.append("Meat Processing")
                    processing = True
                if "SH" in row[4]:  # slaughter house
                    activities.append("Meat Slaughter")
                    slaughter = True

            bovine = True if "B" in row[6] else False  # cows
            caprine = True if "C" in row[6] else False  # goats
            ovine = True if "O" in row[6] else False  # sheep
            porcine = True if "P" in row[6] else False  # pigs
            solipeds = True if "S" in row[6] else False  # horses
            poultry = True if "A" in row[6] else False  # poultry
            lagomorphs = True if "L" in row[6] else False  # rabbits
            farmed_game = True if "fG" in row[6] else False  # farmed game
            ratites = True if "R" in row[6] else False  # ostrich, rhea, ...
            wild_ungulates = True if "wU" in row[6] else False
            wild_avians = True if "wA" in row[6] else False  # wild birds
            wild_lagomorphs = True if "wL" in row[6] else False  # wild rabbits
            wild_g = True if "wG" in row[6] else False  # other wild animals

            slaughter_or_processing_only = slaughter != processing
            slaughter_only_class = False
            slaughter_only_species = False
            meat_slaughter_only_species = False
            poultry_slaughter_only_species = False
            slaughter_volume_category = False
            processing_volume_category = False
            
            meat_slaughter = slaughter
            beef_cow_slaughter = slaughter and bovine
            steer_slaughter = slaughter and bovine
            heifer_slaughter = slaughter and bovine
            bull_stag_slaughter = slaughter and bovine
            dairy_cow_slaughter = slaughter and bovine
            heavy_calf_slaughter = slaughter and bovine
            bob_veal_slaughter = slaughter and bovine
            formula_fed_veal_slaughter = slaughter and bovine
            non_formula_fed_veal_slaughter = slaughter and bovine
            market_swine_slaughter = slaughter and porcine
            sow_slaughter = slaughter and porcine
            roaster_swine_slaughter = slaughter and porcine
            boar_stag_swine_slaughter = slaughter and wild_ungulates
            stag_swine_slaughter = slaughter and wild_ungulates
            feral_swine_slaughter = slaughter and wild_ungulates
            goat_slaughter = slaughter and caprine
            young_goat_slaughter = slaughter and caprine
            adult_goat_slaughter = slaughter and caprine
            sheep_slaughter = slaughter and ovine
            lamb_slaughter = slaughter and ovine
            deer_reindeer_slaughter = False
            antelope_slaughter = False
            elk_slaughter = False
            bison_slaughter = False
            buffalo_slaughter = False
            water_buffalo_slaughter = False
            cattalo_slaughter = False
            yak_slaughter = False
            other_voluntary_livestock_slaughter = False
            rabbit_slaughter = slaughter and lagomorphs
            poultry_slaughter = slaughter and poultry
            young_chicken_slaughter = slaughter and poultry
            light_fowl_slaughter = slaughter and poultry
            heavy_fowl_slaughter = slaughter and poultry
            capon_slaughter = slaughter and poultry
            young_turkey_slaughter = slaughter and poultry
            young_breeder_turkey_slaughter = slaughter and poultry
            old_breeder_turkey_slaughter = slaughter and poultry
            fryer_roaster_turkey_slaughter = slaughter and poultry
            duck_slaughter = slaughter and poultry
            goose_slaughter = slaughter and poultry
            pheasant_slaughter = False
            quail_slaughter = False
            guinea_slaughter = False
            ostrich_slaughter = slaughter and ratites
            emu_slaughter = slaughter and ratites
            rhea_slaughter = slaughter and ratites
            squab_slaughter = False
            other_voluntary_poultry_slaughter = False

            meat_processing = processing
            poultry_processing = processing and poultry
            beef_processing = processing and bovine
            pork_processing = processing and porcine
            antelope_processing = False
            bison_processing = False
            buffalo_processing = False
            deer_processing = processing and wild_ungulates
            elk_processing = processing and wild_ungulates
            goat_processing = processing and caprine
            other_voluntary_livestock_processing = processing and False
            rabbit_processing = processing and lagomorphs
            reindeer_processing = False
            sheep_processing = processing and ovine
            yak_processing = False
            chicken_processing = processing and poultry
            duck_processing = processing and poultry
            goose_processing = processing and poultry
            pigeon_processing = False
            ratite_processing = processing and ratites
            turkey_processing = processing and poultry
            exotic_poultry_processing = False
            other_voluntary_poultry_processing = False

            # prepare output row
            output_row = [
                establishment_id,
                None,  # establishment_number
                establishment_name,
                None,  # duns_number
                street,
                city,
                None,  # state
                zip_code,
                None,  # phone
                None,  # grant_date
                "; ".join(activities),
                None,  # dbas
                None,  # district
                None,  # circuit
                None,  # size
                latitude,
                longitude,
                None,  # county
                None,  # fips_code
                None,  # meat_exemption_custom_slaughter
                None,  # poultry_exemption_custom_slaughter
                "Yes" if slaughter else None,
                "Yes" if meat_slaughter else None,
                "Yes" if beef_cow_slaughter else None,
                "Yes" if steer_slaughter else None,
                "Yes" if heifer_slaughter else None,
                "Yes" if bull_stag_slaughter else None,
                "Yes" if dairy_cow_slaughter else None,
                "Yes" if heavy_calf_slaughter else None,
                "Yes" if bob_veal_slaughter else None,
                "Yes" if formula_fed_veal_slaughter else None,
                "Yes" if non_formula_fed_veal_slaughter else None,
                "Yes" if market_swine_slaughter else None,
                "Yes" if sow_slaughter else None,
                "Yes" if roaster_swine_slaughter else None,
                "Yes" if boar_stag_swine_slaughter else None,
                "Yes" if stag_swine_slaughter else None,
                "Yes" if feral_swine_slaughter else None,
                "Yes" if goat_slaughter else None,
                "Yes" if young_goat_slaughter else None,
                "Yes" if adult_goat_slaughter else None,
                "Yes" if sheep_slaughter else None,
                "Yes" if lamb_slaughter else None,
                "Yes" if deer_reindeer_slaughter else None,
                "Yes" if antelope_slaughter else None,
                "Yes" if elk_slaughter else None,
                "Yes" if bison_slaughter else None,
                "Yes" if buffalo_slaughter else None,
                "Yes" if water_buffalo_slaughter else None,
                "Yes" if cattalo_slaughter else None,
                "Yes" if yak_slaughter else None,
                "Yes" if other_voluntary_livestock_slaughter else None,
                "Yes" if rabbit_slaughter else None,
                "Yes" if poultry_slaughter else None,
                "Yes" if young_chicken_slaughter else None,
                "Yes" if light_fowl_slaughter else None,
                "Yes" if heavy_fowl_slaughter else None,
                "Yes" if capon_slaughter else None,
                "Yes" if young_turkey_slaughter else None,
                "Yes" if young_breeder_turkey_slaughter else None,
                "Yes" if old_breeder_turkey_slaughter else None,
                "Yes" if fryer_roaster_turkey_slaughter else None,
                "Yes" if duck_slaughter else None,
                "Yes" if goose_slaughter else None,
                "Yes" if pheasant_slaughter else None,
                "Yes" if quail_slaughter else None,
                "Yes" if guinea_slaughter else None,
                "Yes" if ostrich_slaughter else None,
                "Yes" if emu_slaughter else None,
                "Yes" if rhea_slaughter else None,
                "Yes" if squab_slaughter else None,
                "Yes" if other_voluntary_poultry_slaughter else None,
                "Yes" if slaughter_or_processing_only else None,
                "Yes" if slaughter_only_class else None,
                "Yes" if slaughter_only_species else None,
                "Yes" if meat_slaughter_only_species else None,
                "Yes" if poultry_slaughter_only_species else None,
                "Yes" if slaughter_volume_category else None,
                "Yes" if goat_processing else None,
                None,  # nrte_ratite_processing
                "Yes" if processing else None,
                None,  # raw_intact_processing
                "Yes" if yak_processing else None,
                None,  # raw_non_intact_ratite_processing
                None,  # active_egg_grant
                None,  # rte_yak_processing
                None,  # rte_processing
                None,  # unspecified_poultry_processing
                None,  # raw_non_intact_bison_processing
                None,  # raw_non_intact_duck_processing
                "Yes" if chicken_processing else None,
                None,  # rte_elk_processing
                "Yes" if rabbit_processing else None,
                None,  # raw_non_intact_poultry_processing
                "Yes" if meat_processing else None,
                None,  # rte_other_voluntary_livestock_processing
                "Yes" if deer_processing else None,
                None,  # raw_non_intact_egg_processing
                "Yes" if other_voluntary_livestock_processing else None,
                None,  # rte_rabbit_processing
                None,  # last_meat_grant_edit_date
                None,  # rte_unspecified_meat_processing
                None,  # nrte_sheep_processing
                None,  # raw_non_intact_turkey_processing
                "Yes" if sheep_processing else None,
                None,  # rte_egg_processing
                None,  # meat_exemption_religious_other
                None,  # rte_pork_processing
                "Yes" if poultry_processing else None,
                None,  # nrte_goose_processing
                None,  # inspection_system_nsis
                None,  # rte_buffalo_processing
                None,  # poultry_harvest_cell_cultured
                "Yes" if beef_processing else None,
                None,  # rte_beef_processing
                None,  # inspection_system_sis
                None,  # raw_intact_sheep_processing
                None,  # rte_pigeon_processing
                None,  # raw_intact_chicken_processing
                None,  # nrte_deer_processing
                None,  # inspection_system_viscera_table_tongue_out
                "Yes" if processing_volume_category else None,
                None,  # raw_intact_beef_processing
                None,  # rte_deer_processing
                None,  # raw_intact_turkey_processing
                None,  # raw_non_intact_exotic_poultry_processing
                None,  # processing_only_species
                None,  # nrte_chicken_processing
                None,  # raw_intact_goose_processing
                None,  # active_meat_grant
                None,  # nrte_bison_processing
                None,  # nrte_beef_processing
                None,  # last_egg_grant_edit_date
                None,  # raw_non_intact_pork_processing
                None,  # raw_intact_unspecified_processing
                None,  # meat_exemption_retail
                None,  # rte_exotic_poultry_processing
                None,  # poultry_exemption_retail
                None,  # active_poultry_grant
                None,  # raw_intact_bison_processing
                None,  # rte_siluriformes_processing
                None,  # raw_non_intact_unspecified_poultry_processing
                None,  # raw_non_intact_pigeon_processing
                None,  # poultry_exemption_religious_islamic
                None,  # nrte_other_voluntary_livestock_processing
                None,  # raw_non_intact_other_voluntary_livestock_processing
                None,  # rte_meat_processing
                None,  # nrte_reindeer_processing
                None,  # nrte_exotic_poultry_processing
                None,  # poultry_exemption_religious
                None,  # meat_exemption_custom_processing
                None,  # raw_intact_other_voluntary_livestock_processing
                None,  # inspection_system_nti1
                None,  # nrte_unspecified_poultry_processing
                None,  # nrte_pigeon_processing
                None,  # rte_unspecified_processing
                None,  # poultry_further_process_cell_cultured
                None,  # nrte_buffalo_processing
                None,  # raw_intact_elk_processing
                "Yes" if goose_processing else None,
                None,  # active_voluntary_grant
                None,  # raw_intact_antelope_processing
                None,  # inspection_system_viscera_table_tongue_in
                None,  # rte_turkey_processing
                None,  # raw_non_intact_processing
                None,  # nrte_processing
                None,  # nrte_rabbit_processing
                None,  # poultry_exemption_religious_buddhist
                None,  # raw_intact_pigeon_processing
                None,  # inspection_system_head_attached
                None,  # last_voluntary_grant_edit_date
                None,  # meat_exemption_religious_kosher
                None,  # raw_intact_meat_processing
                None,  # inspection_system_nti2_modified
                None,  # inspection_system_nti2
                None,  # inspection_system_npis
                None,  # nrte_turkey_processing
                None,  # nrte_goat_processing
                None,  # inspection_system_not_specified
                None,  # rte_sheep_processing
                "Yes" if exotic_poultry_processing else None,
                None,  # inspection_system_npis_waiver
                None,  # raw_non_intact_unspecified_meat_processing
                None,  # rte_unspecified_poultry_processing
                None,  # meat_processing_only_species
                None,  # rte_goose_processing
                None,  # rte_duck_processing
                None,  # meat_harvest_cell_cultured
                None,  # nrte_siluriformes_processing
                None,  # rte_ratite_processing
                None,  # nrte_pork_processing
                None,  # raw_non_intact_deer_processing
                None,  # meat_exemption_religious
                None,  # raw_intact_pork_processing
                None,  # raw_non_intact_rabbit_processing
                None,  # nrte_duck_processing
                None,  # raw_non_intact_other_voluntary_poultry_processing
                None,  # raw_non_intact_goose_processing
                None,  # listeria_alternative
                None,  # raw_intact_rabbit_processing
                None,  # rte_goat_processing
                None,  # raw_non_intact_reindeer_processing
                None,  # nrte_meat_processing
                None,  # raw_intact_unspecified_poultry_processing
                None,  # rte_other_voluntary_poultry_processing
                None,  # nrte_unspecified_processing
                "Yes" if other_voluntary_poultry_processing else None,
                None,  # nrte_yak_processing
                None,  # raw_intact_other_voluntary_poultry_processing
                None,  # nrte_other_voluntary_poultry_processing
                None,  # raw_non_intact_beef_processing
                None,  # raw_non_intact_antelope_processing
                None,  # rte_bison_processing
                None,  # raw_non_intact_unspecified_processing
                None,  # nrte_elk_processing
                "Yes" if reindeer_processing else None,
                "Yes" if duck_processing else None,
                None,  # raw_intact_duck_processing
                None,  # raw_intact_buffalo_processing
                None,  # inspection_system_nti1_modified
                None,  # unspecified_meat_processing
                None,  # raw_intact_unspecified_meat_processing
                None,  # raw_non_intact_buffalo_processing
                None,  # raw_non_intact_goat_processing
                None,  # rte_poultry_processing
                None,  # egg_processing
                None,  # meat_exemption_religious_halal
                None,  # raw_intact_goat_processing
                None,  # inspection_system_traditional
                "Yes" if ratite_processing else None,
                None,  # raw_intact_exotic_poultry_processing
                None,  # raw_non_intact_elk_processing
                None,  # raw_non_intact_siluriformes_processing
                None,  # raw_intact_deer_processing
                "Yes" if pigeon_processing else None,
                None,  # raw_non_intact_yak_processing
                None,  # raw_intact_ratite_processing
                None,  # nrte_poultry_processing
                None,  # unspecified_processing
                "Yes" if elk_processing else None,
                None,  # last_poultry_grant_edit_dateduck_processing
                None,  # poultry_exemption_custom_processing
                None,  # siluriformes_processing
                None,  # raw_non_intact_chicken_processing
                None,  # processing_only_class
                "Yes" if bison_processing else None,
                None,  # raw_intact_siluriformes_processing
                "Yes" if buffalo_processing else None,
                None,  # inspection_system_nels
                None,  # inspection_system_head_detached
                None,  # poultry_exemption_religious_confucian
                None,  # raw_non_intact_meat_processing
                "Yes" if antelope_processing else None,
                "Yes" if turkey_processing else None,
                None,  # poultry_processing_only_species
                None,  # rte_antelope_processing
                None,  # raw_intact_yak_processing
                None,  # poultry_exemption_religious_kosher
                None,  # nrte_unspecified_meat_processing
                None,  # inspection_system_viscera_truck
                None,  # raw_intact_poultry_processing
                None,  # rte_chicken_processing
                None,  # meat_further_process_cell_cultured
                None,  # nrte_antelope_processing
                None,  # processing_only_category
                None,  # raw_non_intact_sheep_processing
                None,  # rte_reindeer_processing
                None,  # raw_intact_reindeer_processing
                "Yes" if pork_processing else None
            ]

            writer.writerow(output_row)

    print(f"Transformation complete: {input_file} → {output_file}")


def geocode_address(address, city, zip_code):
    """Query OpenStreetMap for coordinates"""
    time.sleep(1)  # respect Nominatim usage policy (max 1req/s)
    
    query = f"{address}, {city}, {zip_code}"
    try:
        location = geolocator.geocode(query)
        if location:
            return location.latitude, location.longitude
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Geocoding error for '{query}': {e}")
    return 0.0, 0.0


def load_geodata_cache(cache_file):
    """Load cached coordinates from a csv into a dictionary"""
    cache_dict = {}
    if not os.path.exists(cache_file):
        return cache_dict

    with open(cache_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['street'], row['city'], row['zip'])
            try:
                lat = float(row['latitude'])
                lon = float(row['longitude'])
                cache_dict[key] = (lat, lon)
            except (ValueError, KeyError):
                continue
    return cache_dict

if __name__ == "__main__":
    main()

