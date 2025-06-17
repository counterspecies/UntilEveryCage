use axum::{
    http::StatusCode,
    routing::{get, get_service},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tower_http::{cors::CorsLayer, services::ServeDir};



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

// The handler that serves our locations
async fn get_locations_handler() -> Result<Json<Vec<Location>>, (StatusCode, String)> {
    match read_locations_from_csv("locations.csv").await {
        Ok(locations) => Ok(Json(locations)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read locations: {}", e),
        )),
    }
}

// A simple struct that matches our test locations.csv
#[derive(Serialize, Deserialize, Debug)]
struct Location {
    name: String,
    lat: f64,
    lon: f64,
    r#type: String,
}

// The function that reads and parses the CSV file
async fn read_locations_from_csv(path: &str) -> Result<Vec<Location>, Box<dyn Error>> {
    let mut locations = Vec::new();
    let mut reader = csv::Reader::from_path(path)?;


    for result in reader.deserialize() {
        let record: Location = result?;
        locations.push(record);
    }

    Ok(locations)
}