# Until Every Cage is Empty

An interactive, data-driven map exposing the infrastructure of animal exploitation in the United States.

### Their Power is Secrecy. Our Power is Information.

The animal agriculture industry's power is built on a foundation of propaganda and secrecy. This project is a tool designed to shatter that secrecy. It is not a directory; it is a blueprint of an industrial atrocity. By consolidating publicly available data into a single, accessible map, we aim to provide a resource for activists, journalists, and researchers to investigate, document, and ultimately dismantle this system of violence.

This is an explicitly abolitionist project. We are not asking for reform. We are working towards total obsolescence.

## Key Features

* **Multi-Layer Interactive Map:** Visualizes thousands of facilities (12,000+) across the United States on distinct, toggleable layers.
* **Comprehensive Data:** Integrates multiple public datasets from the USDA and APHIS, including:
  * **Slaughterhouses & Processing Plants** (USDA)
  * **Animal Research Laboratories** (APHIS)
  * **Breeders, Dealers, & Exhibitors** (APHIS)
* **Detailed Facility Information:** Click on any pin to view detailed information, including names, addresses, certificate numbers, operational data, and license types.
* **Powerful Filtering:** Filter the entire dataset by state to focus on local and regional infrastructure.
* **Performance Optimized:** The map uses marker clustering to handle thousands of data points smoothly, and the backend utilizes compression for fast initial load times.
* **Shareable Views:** The URL automatically updates as you pan, zoom, and filter, allowing you to share a link to a specific view for collaboration or reporting.

## Technology Stack

This project is built with a focus on performance, transparency, and open-source principles.

* **Backend:** A high-performance web server written in **Rust** using the **Axum** framework and deployed with **Shuttle**. It serves the static frontend files and provides a JSON API for the map data.
* **Frontend:** A client-side application built with vanilla **HTML, CSS, and JavaScript**.
* **Mapping Library:** **Leaflet.js** is used for all mapping functionalities, with the **Leaflet.markercluster** plugin for performance.
* **Data Processing:** A series of **Python** scripts using `pandas` and `selenium` were used to download, clean, geocode, and compile the source data.

## Getting Started

To run this project locally for development or research, follow these steps.

### Prerequisites

* **Rust:** You must have the Rust programming language toolchain installed. You can install it from [rust-lang.org](https://www.rust-lang.org/tools/install).
* **Shuttle:** The backend is designed for deployment with Shuttle. You will need to install the `cargo-shuttle` command-line tool.
  ```bash
  cargo install cargo-shuttle
  ```
* **Git:** You will need Git to clone the repository.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/eliPerez12/UntilEveryCage.git](https://github.com/eliPerez12/UntilEveryCage.git)
    cd UntilEveryCage
    ```

2.  **Place Data Files:** The backend expects the data files to be present in the `/static_data/` directory before it can run. Ensure the following CSV files are placed in that folder:
    * `usda_locations.csv`
    * `aphis_data_final.csv`
    * `inspection_reports.csv`

3.  **Run the Backend Server:** Use Shuttle to run the project locally.
    ```bash
    cargo shuttle run
    ```
    The server will start, typically on port `8000`.

4.  **View the Application:** Open your web browser and navigate to the address shown in your terminal (e.g., `http://127.0.0.1:8000`). The map should load with all the data.

## How to Contribute

This is a living project, and collaboration is vital to its success. We welcome contributions of all kinds, from data verification to feature development.

* **Reporting Bugs or Data Errors:** If you find a bug on the website or see data that seems incorrect, please open an "Issue" on our GitHub repository. Provide as much detail as possible.
* **Suggesting Features:** Have an idea for a new feature? We'd love to hear it. Open an "Issue" and label it as an "enhancement."
* **Contributing Code:** If you are a developer, feel free to fork the repository and submit a pull request with your changes. Please try to adhere to the existing code style.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

This is a "copyleft" license, which means that any derivative work (e.g., if you run a modified version of this code on your own public-facing website) must also be open-sourced under the same AGPLv3 license. This ensures the project and its derivatives remain free and open for the entire community, preventing corporate co-opting. You can read the full license text in the `LICENSE` file.

## Acknowledgements

This project stands on the shoulders of giants and is inspired by the vital work of other activist projects, including:

* [FinalNail.com](https://finalnail.com/)
* [ADAPTT](https://www.adaptt.org/)
* The countless activists and undercover investigators who risk their safety to expose the truth.

## Contact

For questions, suggestions, or to contribute directly, please send a secure email to: **untileverycageproject@protonmail.com**
