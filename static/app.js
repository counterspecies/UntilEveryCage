// @ts-nocheck

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const worldBounds = L.latLngBounds(southWest, northEast);

L.Control.CustomFullscreen = L.Control.extend({
    options: {
        position: 'topleft',
        enterText: 'Fullscreen',
        exitText: 'Exit'
    },

    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom-fullscreen');
        this.link = L.DomUtil.create('a', '', container);
        this.link.href = '#';
        this.link.innerHTML = this.options.enterText;

        this._map = map;

        // Listen for native fullscreen changes
        L.DomEvent.on(document, 'fullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'webkitfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'mozfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'msfullscreenchange', this._onFullscreenChange, this);

        // Listen for clicks on the button
        L.DomEvent.on(container, 'click', L.DomEvent.stop);
        L.DomEvent.on(container, 'click', this._toggleFullscreen, this);

        return container;
    },

    onRemove: function (map) {
        L.DomEvent.off(document, 'fullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.off(document, 'webkitfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.off(document, 'mozfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.off(document, 'msfullscreenchange', this._onFullscreenChange, this);
    },

    // This function now handles all cases (native and pseudo)
    _toggleFullscreen: function () {
        const container = this._map.getContainer();

        // 1. Check if we are in pseudo-fullscreen mode (for iOS)
        if (L.DomUtil.hasClass(container, 'map-pseudo-fullscreen')) {
            L.DomUtil.removeClass(container, 'map-pseudo-fullscreen');
            this.link.innerHTML = this.options.enterText;
            this._map.invalidateSize(); // Tell Leaflet to redraw
            return;
        }

        // 2. Check for native fullscreen element
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

        if (fullscreenElement) {
            // Exit native fullscreen
            const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exitMethod) {
                exitMethod.call(document);
            }
            return;
        }
        
        // 3. If not in any fullscreen, try to enter
        const requestMethod = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;

        if (requestMethod) {
            // Try native fullscreen first
            requestMethod.call(container);
        } else {
            // Fallback to pseudo-fullscreen for iOS and older browsers
            L.DomUtil.addClass(container, 'map-pseudo-fullscreen');
            this.link.innerHTML = this.options.exitText;
            this._map.invalidateSize(); // Tell Leaflet to redraw
        }
    },

    // This function only needs to handle native fullscreen changes (like pressing Esc)
    _onFullscreenChange: function () {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        
        if (fullscreenElement === this._map.getContainer()) {
            this.link.innerHTML = this.options.exitText;
        } else {
            L.DomUtil.removeClass(this._map.getContainer(), 'map-pseudo-fullscreen'); // Ensure pseudo is also removed
            this.link.innerHTML = this.options.enterText;
        }
    }
});

const map = L.map('map', {
    maxBounds: worldBounds,      // Restricts the view to our defined bounds
    maxBoundsViscosity: 0.1      // Makes the bounds solid like a wall (no bouncing)
}).setView([38.438847, -99.579560], 4).setMinZoom(2).setZoom(4);

map.addControl(new L.Control.CustomFullscreen());

// Define multiple map layers (tile providers)
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Add one of the layers to the map by default (this will be the initial view)
streetMap.addTo(map);

//Create a 'baseMaps' object to hold our different map backgrounds.
const baseMaps = {
    "Street View": streetMap,
    "Satellite View": satelliteMap
};

//Add the layers control to the map, passing in our baseMaps object.
L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);


// --- NEW SVG ICON DEFINITIONS ---

// Define the SVG markup for our icons. The fill color is changed for each category.
const slaughterhouseSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#D73737" width="30px" height="42px"><path d="M12 0C7.802 0 4 3.802 4 8.5c0 4.803 7.055 14.823 7.421 15.32a.987.987 0 0 0 1.158 0C12.945 23.323 20 13.303 20 8.5 20 3.802 16.198 0 12 0Zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`;
const processingSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#808080" width="30px" height="42px"><path d="M12 0C7.802 0 4 3.802 4 8.5c0 4.803 7.055 14.823 7.421 15.32a.987.987 0 0 0 1.158 0C12.945 23.323 20 13.303 20 8.5 20 3.802 16.198 0 12 0Zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`;
const labSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#8A2BE2" width="30px" height="42px"><path d="M12 0C7.802 0 4 3.802 4 8.5c0 4.803 7.055 14.823 7.421 15.32a.987.987 0 0 0 1.158 0C12.945 23.323 20 13.303 20 8.5 20 3.802 16.198 0 12 0Zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>`;



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


const labIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});



// --- Setup ---
let allLocations = [];
let allLabLocations = [];

// This is the optimized version
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

        let locationTypeText = isSlaughterhouse ? "Slaughterhouse" : "Processing Plant";
        
        const popupContent = `
            <div class="info-popup">
                <h3>${location.establishment_name || 'Unknown Name'}</h3>
                <p1>${location.latitude}, ${location.longitude}</p1>
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