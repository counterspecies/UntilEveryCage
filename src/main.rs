use axum::{
    http::StatusCode,
    routing::{get, get_service},
    Json, Router,
};
use serde::{Serialize};
use std::error::Error;
use tower_http::{cors::CorsLayer, services::ServeDir};
use location::Location;

use crate::location::{get_slaughtered_animals, get_tested_animals, AphisReport};

mod location;

#[tokio::main]
async fn main() {
    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/locations", get(get_locations_handler))
        .route("/api/aphis-reports", get(get_aphis_reports_handler))
        .nest_service("/", get_service(ServeDir::new("static")))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    println!("listening on http://{}", listener.local_addr().unwrap());
    println!("Local website: http://192.168.0.97:3000");
    axum::serve(listener, app).await.unwrap();
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
    slaughter_volume_category: String,
    processing_volume_category: String,
    dbas: String,
    phone: String,
}

async fn get_locations_handler() -> Result<Json<Vec<LocationResponse>>, (StatusCode, String)> {
    match read_locations_from_csv("USDA_data.csv").await {
        Ok(locations) => {
            let filtered: Vec<LocationResponse> = locations
                .into_iter()
                .map(|loc| {
                    let animals_slaughtered = get_slaughtered_animals(&loc);
                    LocationResponse {
                        establishment_id: loc.establishment_id,
                        establishment_name: loc.establishment_name,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        activities: loc.activities,
                        state: loc.state,
                        slaughter: loc.slaughter,
                        animals_slaughtered,
                        city: loc.city,
                        street: loc.street,
                        zip: loc.zip,
                        slaughter_volume_category: loc.slaughter_volume_category,
                        processing_volume_category: "2.0".to_string(),
                        dbas: loc.dbas,
                        phone: loc.phone,
                    }
                })
                .collect();
            Ok(Json(filtered))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read locations: {}", e),
        )),
    }
}


async fn get_aphis_reports_handler() -> Result<Json<Vec<AphisReport>>, (StatusCode, String)> {
    match read_aphis_reports_from_csv("aphis_geocoded_data.csv").await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read APHIS data: {}", e),
        )),
    }
}


async fn read_locations_from_csv(path: &str) -> Result<Vec<Location>, Box<dyn Error>> {
    let mut locations = Vec::new();
    let mut reader = csv::Reader::from_path(path)?;

    for result in reader.deserialize() {
        let record: Location = result?;
        locations.push(record);
    }

    Ok(locations)
}

pub async fn read_aphis_reports_from_csv(path: &str) -> Result<Vec<AphisReport>, Box<dyn Error>> {
    let mut reports = Vec::new();
    let mut reader = csv::Reader::from_path(path)?;

    for result in reader.deserialize() {
        // This will skip rows that have a parsing error and print a warning,
        // preventing the whole application from crashing.
        match result {
            Ok(mut record) => {
                let animals_tested = get_tested_animals(&record);
                record.animals_tested = Some(animals_tested);
                reports.push(record);
            }
            Err(_e) => {
                eprintln!("Warning: Skipping a row in '{}' due to a parsing error: {}", path, _e);
            }
        }
    }
    Ok(reports)
}
