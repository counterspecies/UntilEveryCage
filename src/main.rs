use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::error::Error;
use tower_http::cors::CorsLayer;

mod location;
use crate::location::*;

#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/locations", get(get_locations_handler))
        .route("/api/aphis-reports", get(get_aphis_reports_handler))
        .layer(cors);

    Ok(app.into())
}

async fn get_locations_handler() -> impl IntoResponse {
     match read_locations_from_csv().await {
        Ok(locations) => Json(locations).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read location data: {}", e),
        ).into_response(),
    }
}

async fn get_aphis_reports_handler() -> impl IntoResponse {
    match read_aphis_reports_from_csv().await {
        Ok(reports) => Json(reports).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read APHIS data: {}", e),
        ).into_response(),
    }
}

// MODIFIED: This function no longer takes a path argument
async fn read_locations_from_csv() -> Result<Vec<LocationResponse>, Box<dyn Error>> {
    let csv_data = include_str!("../static_data/usda_locations.csv");
    
    // The csv crate reads directly from the string data
    let mut reader = csv::Reader::from_reader(csv_data.as_bytes());
    
    let mut locations = Vec::new();
    for result in reader.deserialize() {
        let record: Location = result?;
        let animals_slaughtered = get_slaughtered_animals(&record);
        let animals_processed = dbg!(get_processed_animals(&record));
        locations.push(LocationResponse {
            establishment_id: record.establishment_id,
            establishment_name: record.establishment_name,
            latitude: record.latitude,
            longitude: record.longitude,
            activities: record.activities,
            state: record.state,
            city: record.city,
            street: record.street,
            zip: record.zip,
            slaughter: record.slaughter,
            animals_slaughtered,
            dbas: record.dbas,
            phone: record.phone,
            slaughter_volume_category: record.slaughter_volume_category,
            processing_volume_category: record.processing_volume_category,
            animals_processed,
        });
    }
    Ok(locations)
}


pub async fn read_aphis_reports_from_csv() -> Result<Vec<AphisReport>, Box<dyn Error>> {
    // Embed the APHIS data at compile time
    let csv_data = include_str!("../static_data/aphis_data_final.csv");
    
    // Read directly from the string data
    let mut reader = csv::Reader::from_reader(csv_data.as_bytes());

    let mut reports = Vec::new();
    for mut record in reader.deserialize::<AphisReport>().flatten() {
        record.animals_tested = Some(get_tested_animals(&record));
        reports.push(record);
    }
    Ok(reports)
}


#[derive(Serialize, Debug)]
struct LocationResponse {
    establishment_id: String,
    establishment_name: String,
    latitude: f64,
    longitude: f64,
    activities: String,
    state: String,
    city: String,
    street: String,
    zip: String,
    slaughter: String,
    animals_slaughtered: String,
    animals_processed: String,
    slaughter_volume_category: String,
    processing_volume_category: String,
    dbas: String,
    phone: String,
}
