// @ts-nocheck


const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const worldBounds = L.latLngBounds(southWest, northEast);

// 2. Add the maxBounds options when creating the map.
const map = L.map('map', {
    maxBounds: worldBounds,        // Restricts the view to our defined bounds
    maxBoundsViscosity: 0.1    // Makes the bounds solid like a wall (no bouncing)
}).setView([38.438847, -99.579560], 4).setMinZoom(2).setZoom(4);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Icon definitions needed for the filters
const slaughterhouseIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const processingIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Setup from your working filter version ---
let allLocations = [];
const slaughterhouseLayer = L.layerGroup();
const processingLayer = L.layerGroup();
const slaughterhouseCheckbox = document.getElementById('slaughterhousesCheckbox');
const meatProcessingCheckbox = document.getElementById('meatProcessingPlantsCheckbox');
const stateSelector = document.getElementById('state-selector');

function applyFilters() {
    slaughterhouseLayer.clearLayers();
    processingLayer.clearLayers();
    const selectedState = stateSelector.value;

    const locationsToShow = allLocations.filter(location => {
        if (selectedState === 'all') return true;
        return location.state === selectedState;
    });

    locationsToShow.forEach(location => {

        const isSlaughterhouse = location.slaughter && location.slaughter.toLowerCase() === 'yes';
        const markerIcon = isSlaughterhouse ? slaughterhouseIcon : processingIcon;

        // Create the marker with the correct icon
        const marker = L.marker([location.latitude, location.longitude], { icon: markerIcon });

        let address = location.street.trim() ? `${location.street.trim()}, ${location.city.trim()}, ${location.state.trim()} ${location.zip}` : 'Address not available';

        let animals_slaughtered_yearly_text = "0";
        if (location.slaughter_volume_category === "1.0") {
            animals_slaughtered_yearly_text = "Less than 1,000 animals killed per year.";
        } else if (location.slaughter_volume_category === "2.0") {
            animals_slaughtered_yearly_text = "1,000 to 10,000 animals killed per year.";
        } else if (location.slaughter_volume_category === "3.0") {
            animals_slaughtered_yearly_text = "10,000 to 100,000 animals killed per year.";
        } else if (location.slaughter_volume_category === "4.0") {
            animals_slaughtered_yearly_text = "100,000 to 10,000,000 animals killed per year.";
        } else if (location.slaughter_volume_category === "5.0") {
            animals_slaughtered_yearly_text = "Over 10,000,000 animals killed per year.";
        }

        // let animals_slaughtered_yearly = 0;
        // if (location.slaughter_volume_category === "1.0") {
        //     animals_slaughtered_yearly = 500; 
        // } else if (location.slaughter_volume_category === "2.0") {
        //     animals_slaughtered_yearly = 10000; 
        // } else if (location.slaughter_volume_category === "3.0") {
        //     animals_slaughtered_yearly = 50000; 
        // } else if (location.slaughter_volume_category === "4.0") {
        //     animals_slaughtered_yearly = 5000000; 
        // } else if (location.slaughter_volume_category === "5.0") {
        //     animals_slaughtered_yearly = 10000000;
        // }


        // let estimatedAnimalsKilledToday = (getHoursSinceMidnight() / 24 * animals_slaughtered_yearly / 365).toFixed(0).toLocaleString();

        let slaughterText = "";
        if (location.slaughter == "Yes") {
            slaughterText = `<hr>
            <p><strong>Types of Animals Killed:</strong> ${location.animals_slaughtered || 'N/A'}</p>
            <p><strong>Yearly Slaughter Count:</strong> ${animals_slaughtered_yearly_text || 'N/A'}</p>
            `
        }

        let animals_processed_monthly_text = "N/A";
        if (location.processing_volume_category === "1.0") {
            animals_processed_monthly_text = "Less than 10,000 pounds of products processed per month.";
        } else if (location.processing_volume_category === "2.0") {
            animals_processed_monthly_text = "10,000 to 100,000 pounds of products processed per month.";
        } else if (location.processing_volume_category === "3.0") {
            animals_processed_monthly_text = "100,000 to 1,000,000 pounds of products processed per month.";
        } else if (location.processing_volume_category === "4.0") {
            animals_processed_monthly_text = "1,000,000 to 10,000,000 pounds of products processed per month.";
        } else if (location.processing_volume_category === "5.0") {
            animals_processed_monthly_text = "Over 10,000,000 pounds of products processed per month.";
        }
        

        let otherNamesText = "";
        if (location.dbas.length !== 0) {
            otherNamesText = `<p><strong>Doing Business As:</strong> ${location.dbas}</p>`;
        }
        
        
        console.log(location.dbas);
        // Build the new, detailed HTML content for the popup
        const popupContent = `
            <div class="info-popup">
                <h2>${location.establishment_name || 'Unknown Name'} </h2>
                <hr>
                <p><strong>Address:</strong> ${address || 'N/A'}</p>
                <p><strong>Phone Number:</strong> ${location.phone || 'N/A'}</p>
                ${otherNamesText}
                <hr>
                <p><strong>Main Activities:</strong> ${location.activities || 'N/A'}</p>
                <p><strong>Product Volume:</strong> ${animals_processed_monthly_text || 'N/A'}</p>
                ${slaughterText}
            </div>
        `;

        // Bind the new popup content to the marker
        marker.bindPopup(popupContent);

        // Add the marker to the correct layer based on our logic
        if (isSlaughterhouse) {
            marker.addTo(slaughterhouseLayer);
        } else {
            // Add all non-slaughterhouses to the processing layer
            marker.addTo(processingLayer);
        }
    });

    // Sync layer visibility with checkboxes
    if (slaughterhouseCheckbox.checked) {
        slaughterhouseLayer.addTo(map);
    } else {
        slaughterhouseLayer.removeFrom(map);
    }
    if (meatProcessingCheckbox.checked) {
        processingLayer.addTo(map);
    } else {
        processingLayer.removeFrom(map);
    }
}

function getHoursSinceMidnight() {
    // 1. Get the current date and time.
    const now = new Date();

    // 2. Create a new date object representing midnight of the same day.
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to zero.

    // 3. Calculate the difference between the two dates in milliseconds.
    const diffInMilliseconds = now.getTime() - midnight.getTime();

    // 4. Convert the difference from milliseconds to hours.
    // (1000 milliseconds per second * 60 seconds per minute * 60 minutes per hour)
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    return diffInHours;
}

// --- Setup functions ---
slaughterhouseCheckbox.addEventListener('change', applyFilters);
meatProcessingCheckbox.addEventListener('change', applyFilters);
stateSelector.addEventListener('change', applyFilters);

async function initializeApp() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/locations');
        allLocations = await response.json();
        
        const stateValues = allLocations.map(location => location.state);
        const uniqueStates = [...new Set(stateValues.filter(state => state != null))];
        uniqueStates.sort();
        uniqueStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelector.appendChild(option);
        });
        
        applyFilters();
    } catch (error) {
        console.error('Failed to fetch locations:', error);
    }
}

initializeApp();