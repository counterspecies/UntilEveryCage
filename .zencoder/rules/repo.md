---
description: Repository Information Overview
alwaysApply: true
---

# Until Every Cage is Empty - Project Information

## Summary
An interactive, data-driven map exposing the infrastructure of animal exploitation in the United States. The project provides a comprehensive visualization of thousands of facilities across the US, including slaughterhouses, processing plants, animal research laboratories, breeders, dealers, and exhibitors.

## Structure
- **src/**: Rust backend source code
- **static/**: Frontend HTML, CSS, and JavaScript files
- **static_data/**: CSV data files used by the application
- **Old scripts/**: Python scripts used for data processing and collection
- **Old CSVs/**: Previous versions of the data files

## Language & Runtime
**Backend Language**: Rust
**Edition**: 2024
**Frontend**: HTML, CSS, JavaScript
**Data Processing**: Python

## Dependencies
**Backend Dependencies**:
- axum: 0.8.4 (Web framework)
- tokio: 1.37.0 (Async runtime)
- tower-http: 0.6.6 (HTTP middleware)
- serde: 1.0 (Serialization/deserialization)
- csv: 1.3.0 (CSV parsing)
- shuttle-runtime: 0.55.0 (Deployment platform)
- shuttle-axum: 0.55.0 (Shuttle integration)

**Frontend Dependencies**:
- Leaflet.js (Mapping library)
- Leaflet.markercluster (Marker clustering plugin)

**Development Dependencies**:
- @types/leaflet: 1.9.18 (TypeScript definitions)

## Build & Installation
```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Shuttle CLI
cargo install cargo-shuttle

# Run the backend server locally
cargo shuttle run
```

## Docker
No Docker configuration found in the repository.

## Main Files & Resources
**Backend Entry Point**: src/main.rs
**Data Models**: src/location.rs
**Frontend Entry Point**: static/index.html
**Map Application**: static/app.js
**Data Files**:
- static_data/usda_locations.csv
- static_data/aphis_data_final.csv
- static_data/inspection_reports.csv

## API Endpoints
- **/api/locations**: Provides USDA location data
- **/api/aphis-reports**: Provides APHIS report data
- **/api/inspection-reports**: Provides inspection report data

## Deployment
The application is designed to be deployed using Shuttle, a Rust-focused deployment platform. The Shuttle.toml file configures the deployment, specifying that files in the static_data directory should be included as assets.