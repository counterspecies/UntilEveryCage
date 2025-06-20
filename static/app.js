// @ts-nocheck

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const worldBounds = L.latLngBounds(southWest, northEast);

// 2. Add the maxBounds options when creating the map.
const map = L.map('map', {
    maxBounds: worldBounds,         // Restricts the view to our defined bounds
    maxBoundsViscosity: 0.1         // Makes the bounds solid like a wall (no bouncing)
}).setView([38.438847, -99.579560], 4).setMinZoom(2).setZoom(4);



// 1. Define multiple map layers (tile providers)
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// 2. Add one of the layers to the map by default (this will be the initial view)
streetMap.addTo(map);

// 3. Create a 'baseMaps' object to hold our different map backgrounds.
const baseMaps = {
    "Street View": streetMap,
    "Satellite View": satelliteMap
};

// 4. Add the layers control to the map, passing in our baseMaps object.
L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);


// --- SVG Icon Definitions ---

// A helper function to generate the SVG string with a dynamic color
function createSVGIcon(color) {
    const svgTemplate = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker">
            <path fill-opacity=".25" d="M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-2.298 10.999S16 32 16 32z"/>
            <path fill="${color}" stroke="#000" stroke-width="0.5" d="M16 0C9.37 0 4 5.37 4 12c0 8.754 11.834 20 12 20s12-11.246 12-20C28 5.37 22.63 0 16 0zm0 16a4 4 0 110-8 4 4 0 010 8z"/>
        </svg>`;
    return svgTemplate;
}

// Create the icons using L.divIcon and our SVG helper function
const slaughterhouseIcon = L.divIcon({
    html: createSVGIcon('#d90429'), // A strong red
    className: 'svg-icon', // This class removes the default white box
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const processingIcon = L.divIcon({
    html: createSVGIcon('#6c757d'), // A neutral grey
    className: 'svg-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const labIcon = L.divIcon({
    html: createSVGIcon('#8a2be2'), // A distinct violet
    className: 'svg-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});


// --- Setup ---
let allLocations = [];
let allLabLocations = [];

// This is the optimized version
// This is the updated version
const slaughterhouseLayer = L.markerClusterGroup({ disableClusteringAtZoom: 9 });
const processingLayer = L.markerClusterGroup({ disableClusteringAtZoom: 9 });
const labLayer = L.markerClusterGroup({ disableClusteringAtZoom: 9 });

const slaughterhouseCheckbox = document.getElementById('slaughterhousesCheckbox');
const meatProcessingCheckbox = document.getElementById('meatProcessingPlantsCheckbox');
const testingLabsCheckbox = document.getElementById('testingLabsCheckbox');
const stateSelector = document.getElementById('state-selector');

function applyFilters() {
    // Clear all layers before redrawing
    slaughterhouseLayer.clearLayers();
    processingLayer.clearLayers();
    labLayer.clearLayers();

    const selectedState = stateSelector.value;

    const markerBounds = [];


    // --- Filter and plot USDA Slaughter/Processing Locations ---
    const locationsToShow = allLocations.filter(location => selectedState === 'all' || location.state === selectedState);

    locationsToShow.forEach(location => {
        if (!location.latitude || !location.longitude) return;

        markerBounds.push([location.latitude, location.longitude]);

        const isSlaughterhouse = location.slaughter && location.slaughter.toLowerCase() === 'yes';
        const markerIcon = isSlaughterhouse ? slaughterhouseIcon : processingIcon;

        const marker = L.marker([location.latitude, location.longitude], { icon: markerIcon });
        
        let address = location.street && location.street.trim() ? `${location.street.trim()}, ${location.city.trim()}, ${location.state.trim()} ${location.zip}` : 'Address not available';

        let animals_slaughtered_yearly_text = "N/A";
        if (location.slaughter_volume_category) {
            switch (location.slaughter_volume_category) {
                case "1.0": animals_slaughtered_yearly_text = "Less than 1,000 animals killed per year."; break;
                case "2.0": animals_slaughtered_yearly_text = "1,000 to 10,000 animals killed per year."; break;
                case "3.0": animals_slaughtered_yearly_text = "10,000 to 100,000 animals killed per year."; break;
                case "4.0": animals_slaughtered_yearly_text = "100,000 to 10,000,000 animals killed per year."; break;
                case "5.0": animals_slaughtered_yearly_text = "Over 10,000,000 animals killed per year."; break;
            }
        }

        let slaughterText = "";
        if (isSlaughterhouse) {
            slaughterText = `<hr>
                <p><strong>Types of Animals Killed:</strong> ${location.animals_slaughtered || 'N/A'}</p>
                <p><strong>Yearly Slaughter Count:</strong> ${animals_slaughtered_yearly_text}</p>
                `;
        }

        let animals_processed_monthly_text = "N/A";
        if (location.processing_volume_category) {
            switch (location.processing_volume_category) {
                case "1.0": animals_processed_monthly_text = "Less than 10,000 pounds of products processed per month."; break;
                case "2.0": animals_processed_monthly_text = "10,000 to 100,000 pounds of products processed per month."; break;
                case "3.0": animals_processed_monthly_text = "100,000 to 1,000,000 pounds of products processed per month."; break;
                case "4.0": animals_processed_monthly_text = "1,000,000 to 10,000,000 pounds of products processed per month."; break;
                case "5.0": animals_processed_monthly_text = "Over 10,000,000 pounds of products processed per month."; break;
            }
        }
        
        let otherNamesText = "";
        if (location.dbas && location.dbas.length > 0) {
            otherNamesText = `<p><strong>Doing Business As:</strong> ${location.dbas}</p>`;
        }
        
        const popupContent = `
            <div class="info-popup">
                <h3>${location.establishment_name || 'Unknown Name'}</h3>
                <p1>(${location.latitude},${location.longitude})</p1>
                <hr>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Establishment ID:</strong> ${location.establishment_id}</p>
                <p><strong>Phone:</strong> ${location.phone || 'N/A'}</p>
                ${otherNamesText}
                <hr>
                <p><strong>Main Activities:</strong> ${location.activities || 'N/A'}</p>
                <p><strong>Product Volume:</strong> ${animals_processed_monthly_text}</p>
                ${slaughterText}
            </div>
        `;


        marker.bindPopup(popupContent);

        if (isSlaughterhouse) {
            marker.addTo(slaughterhouseLayer);
        } else {
            marker.addTo(processingLayer);
        }
    });

    // --- Filter and plot APHIS Lab Locations ---
    const labLocationsToShow = allLabLocations.filter(lab => selectedState === 'all' || getStateFromCityStateZip(lab['City-State-Zip']) === selectedState);
    
    labLocationsToShow.forEach(lab => {
        if (lab.latitude && lab.longitude) {
            const marker = L.marker([lab.latitude, lab.longitude], { icon: labIcon });
            markerBounds.push([lab.latitude, lab.longitude]);

            let labPopupContent = `
            <div class="info-popup">
                <h3>${lab['Account Name'] || 'Unknown Name'}</h3>
                <p1>(${lab.latitude},${lab.longitude})</p1>
                <hr>
                <p><strong>Address:</strong> ${lab['Address Line 1']} ${lab['Address Line 2']} ${lab['City-State-Zip'] || 'N/A'}</p>
                <p><strong>Customer Number:</strong> ${lab['Customer Number_x'] || 'N/A'}</p>
                <p><strong>Certificate Number:</strong> ${lab['Certificate Number'] || 'N/A'}</p>
                <p><strong>Certificate Status:</strong> ${lab['Certificate Status'] || 'N/A'} as of 2024 </p>
                <p><strong>Registration Type:</strong> ${lab['Registration Type'] || 'N/A'}</p>
                <p><strong>Animals Tested On:</strong> ${lab['Animals Tested On'] || 'N/A'}</p>
                <hr>
            </div>
            `

            marker.bindPopup(labPopupContent);
            marker.addTo(labLayer);
        }
    });


    // --- Sync visibility for ALL layers ---
    if (slaughterhouseCheckbox.checked) slaughterhouseLayer.addTo(map); else slaughterhouseLayer.removeFrom(map);
    if (meatProcessingCheckbox.checked) processingLayer.addTo(map); else processingLayer.removeFrom(map);
    if (testingLabsCheckbox.checked) labLayer.addTo(map); else labLayer.removeFrom(map);

    if (selectedState !== 'all' && markerBounds.length > 0) {
        // If a specific state is selected and we have markers, fit the map to them.
        const bounds = L.latLngBounds(markerBounds);
        map.fitBounds(bounds.pad(0.1)); // .pad(0.1) adds a nice margin
    } else if (selectedState === 'all') {
        // If "All States" is selected, reset to the default national view.
        map.setView([38.438847, -99.579560], 4);
    }
}


// --- Setup functions ---
slaughterhouseCheckbox.addEventListener('change', applyFilters);
meatProcessingCheckbox.addEventListener('change', applyFilters);
testingLabsCheckbox.addEventListener('change', applyFilters);
stateSelector.addEventListener('change', applyFilters);

function getStateFromCityStateZip(cityStateZip) {
    if (!cityStateZip || typeof cityStateZip !== 'string') {
        return null;
    }
    // This regular expression looks for a comma, a space, and then captures two capital letters.
    const match = cityStateZip.match(/, ([A-Z]{2})/);
    return match ? match[1] : null;
}

async function initializeApp() {
    try {
        // Fetch BOTH datasets when the app starts
        const usdaPromise = fetch('/api/locations');
        const aphisPromise = fetch('/api/aphis-reports');

        // Wait for both fetch requests to complete
        const [usdaResponse, aphisResponse] = await Promise.all([usdaPromise, aphisPromise]);

        allLocations = await usdaResponse.json();
        allLabLocations = await aphisResponse.json();
        
        // Populate dropdown from BOTH datasets to get all states
        const usdaStates = allLocations.map(loc => loc.state);
        const aphisStates = allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip'])); 
        const allStateValues = [...usdaStates, ...aphisStates];

        const uniqueStates = [...new Set(allStateValues.filter(state => state != null))];
        uniqueStates.sort();
        
        // Clear existing options before adding new ones
        stateSelector.innerHTML = '<option value="all">All States</option>';
        uniqueStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelector.appendChild(option);
        });
    
        // Run the filters once to set the initial view
        applyFilters();

    } catch (error) {
        console.error('Failed to fetch initial data:', error);
    }
}

initializeApp();
