const map = L.map('map').setView([39.8283, -98.5795], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

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
        if (selectedState === 'all') {
            return true;
        }
        return location.state === selectedState;
    });

    locationsToShow.forEach(location => {
        if (!location.type) return;

        if (location.type.toLowerCase().includes('slaughter')) {
            const marker = L.marker([location.lat, location.lon], { icon: slaughterhouseIcon });
            marker.bindPopup(`<b>${location.name}</b><br>${location.type}`);
            marker.addTo(slaughterhouseLayer);
        } else if (location.type.toLowerCase().includes('processing')) {
            const marker = L.marker([location.lat, location.lon], { icon: processingIcon });
            marker.bindPopup(`<b>${location.name}</b><br>${location.type}`);
            marker.addTo(processingLayer);
        }
    });

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

slaughterhouseCheckbox.addEventListener('change', applyFilters);
meatProcessingCheckbox.addEventListener('change', applyFilters);
stateSelector.addEventListener('change', applyFilters);

async function initializeApp() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/locations');
        allLocations = await response.json();

        // --- NEW LOGIC TO POPULATE DROPDOWN ---
        // 1. Get all state values from the data
        const stateValues = allLocations.map(location => location.state);
        // 2. Filter out any null/undefined values and get only the unique states
        const uniqueStates = [...new Set(stateValues.filter(state => state != null))];
        // 3. Sort the states alphabetically
        uniqueStates.sort();
        // 4. Create and add an <option> element for each state
        uniqueStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelector.appendChild(option);
        });
        // --- END OF NEW LOGIC ---

        // After populating the dropdown, apply the initial filters
        applyFilters();

    } catch (error) {
        console.error('Failed to fetch locations:', error);
    }
}

initializeApp();