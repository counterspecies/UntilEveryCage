use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use std::error::Error;
use tower_http::cors::CorsLayer;

mod location;
use crate::location::{get_tested_animals, AphisReport, Location};

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
async fn read_locations_from_csv() -> Result<Vec<Location>, Box<dyn Error>> {
    // The include_str! macro reads the file at COMPILE TIME and embeds it in the program.
    // The path is relative to this source file (main.rs is in src/, so we go up one level with ..)
    let csv_data = include_str!("../static_data/usda_locations.csv");
    
    // The csv crate reads directly from the string data
    let mut reader = csv::Reader::from_reader(csv_data.as_bytes());
    
    let mut locations = Vec::new();
    for result in reader.deserialize() {
        let record: Location = result?;
        locations.push(record);
    }
    Ok(locations)
}

// MODIFIED: This function no longer takes a path argument
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