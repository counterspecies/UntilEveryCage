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



        // Build the new, detailed HTML content for the popup
        const popupContent = `
            <div class="info-popup">
                <h3>${location.establishment_name || 'Unknown Name'}</h3>
                <hr>
                <p><strong>State:</strong> ${location.state || 'N/A'}</p>
                <p><strong>Main Activities:</strong> ${location.activities || 'N/A'}</p>
                <p><strong>Performs Slaughter:</strong> ${location.slaughter + " " + "()" || 'No'}</p>
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

// --- Setup functions (unchanged) ---
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