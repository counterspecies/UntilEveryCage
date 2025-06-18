use axum::{
    http::StatusCode,
    routing::{get, get_service},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tower_http::{cors::CorsLayer, services::ServeDir};
use location::Location;

use crate::location::get_slaughtered_animals;

mod location;

#[tokio::main]
async fn main() {
    let cors = CorsLayer::very_permissive();

    let app = Router::new()
        .route("/api/locations", get(get_locations_handler))
        .nest_service("/", get_service(ServeDir::new("static")))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}




#[derive(Serialize, Debug)]
struct LocationResponse {
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
}

async fn get_locations_handler() -> Result<Json<Vec<LocationResponse>>, (StatusCode, String)> {
    match read_locations_from_csv("USDA_data.csv").await {
        Ok(locations) => {
            let filtered: Vec<LocationResponse> = locations
                .into_iter()
                .map(|loc| {
                    let animals_slaughtered = get_slaughtered_animals(&loc);
                    LocationResponse {
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

async fn read_locations_from_csv(path: &str) -> Result<Vec<Location>, Box<dyn Error>> {
    let mut locations = Vec::new();
    let mut reader = csv::Reader::from_path(path)?;

    for result in reader.deserialize() {
        let record: Location = result?;
        locations.push(record);
    }

    Ok(locations)
}