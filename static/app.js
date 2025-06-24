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
        L.DomEvent.on(document, 'fullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'webkitfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'mozfullscreenchange', this._onFullscreenChange, this);
        L.DomEvent.on(document, 'msfullscreenchange', this._onFullscreenChange, this);
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
    _toggleFullscreen: function () {
        const container = this._map.getContainer();
        if (L.DomUtil.hasClass(container, 'map-pseudo-fullscreen')) {
            L.DomUtil.removeClass(container, 'map-pseudo-fullscreen');
            this.link.innerHTML = this.options.enterText;
            this._map.invalidateSize();
            return;
        }
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (fullscreenElement) {
            const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exitMethod) {
                exitMethod.call(document);
            }
            return;
        }
        const requestMethod = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;
        if (requestMethod) {
            requestMethod.call(container);
        } else {
            L.DomUtil.addClass(container, 'map-pseudo-fullscreen');
            this.link.innerHTML = this.options.exitText;
            this._map.invalidateSize();
        }
    },
    _onFullscreenChange: function () {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (fullscreenElement === this._map.getContainer()) {
            this.link.innerHTML = this.options.exitText;
        } else {
            L.DomUtil.removeClass(this._map.getContainer(), 'map-pseudo-fullscreen');
            this.link.innerHTML = this.options.enterText;
        }
    }
});

const map = L.map('map', {
    maxBounds: worldBounds,
    maxBoundsViscosity: 0.1
}).setView([38.438847, -99.579560], 4).setMinZoom(2).setZoom(4);

map.addControl(new L.Control.CustomFullscreen());

// Define multiple map layers
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});
const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
});
streetMap.addTo(map);

const baseMaps = {
    "Street View": streetMap,
    "Satellite View": satelliteMap
};
L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);

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

// Both clustered and non-clustered layers
const slaughterhouseClusterLayer = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 75, disableClusteringAtZoom: 10  });
const processingClusterLayer = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 75, disableClusteringAtZoom: 10  });
const labClusterLayer = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 75, disableClusteringAtZoom: 10  });

const slaughterhouseFeatureLayer = L.layerGroup();
const processingFeatureLayer = L.layerGroup();
const labFeatureLayer = L.layerGroup();

// DOM element references
const slaughterhouseCheckbox = document.getElementById('slaughterhousesCheckbox');
const meatProcessingCheckbox = document.getElementById('meatProcessingPlantsCheckbox');
const testingLabsCheckbox = document.getElementById('testingLabsCheckbox');
const stateSelector = document.getElementById('state-selector');


function applyFilters(shouldUpdateView = false) {
    const selectedState = stateSelector.value;
    const isAllStatesView = selectedState === 'all';

    // Clear all possible layers to ensure a clean slate
    slaughterhouseClusterLayer.clearLayers();
    processingClusterLayer.clearLayers();
    labClusterLayer.clearLayers();
    slaughterhouseFeatureLayer.clearLayers();
    processingFeatureLayer.clearLayers();
    labFeatureLayer.clearLayers();
    
    // Remove all layers from map before re-adding the correct ones
    map.removeLayer(slaughterhouseClusterLayer);
    map.removeLayer(processingClusterLayer);
    map.removeLayer(labClusterLayer);
    map.removeLayer(slaughterhouseFeatureLayer);
    map.removeLayer(processingFeatureLayer);
    map.removeLayer(labFeatureLayer);

    const markerBounds = [];

    // Filter and plot USDA Slaughter/Processing Locations
    const locationsToShow = allLocations.filter(location => isAllStatesView || location.state === selectedState);
    locationsToShow.forEach(location => {
        if (!location.latitude || !location.longitude) return;
        if (!isAllStatesView) markerBounds.push([location.latitude, location.longitude]);

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
                <p><strong>Products Processed:</strong> ${location.animals_processed || 'N/A'}</p>
                <p><strong>Product Volume:</strong> ${animals_processed_monthly_text}</p> 
                ${slaughterText}
            </div>
        `;
        marker.bindPopup(popupContent);

        // Add marker to the correct layer type (clustered or not)
        if (isSlaughterhouse) {
            isAllStatesView ? slaughterhouseClusterLayer.addLayer(marker) : slaughterhouseFeatureLayer.addLayer(marker);
        } else {
            isAllStatesView ? processingClusterLayer.addLayer(marker) : processingFeatureLayer.addLayer(marker);
        }
    });

    // Filter and plot APHIS Lab Locations
    const labLocationsToShow = allLabLocations.filter(lab => isAllStatesView || getStateFromCityStateZip(lab['City-State-Zip']) === selectedState);
    labLocationsToShow.forEach(lab => {
        if (lab.latitude && lab.longitude) {
            if (!isAllStatesView) markerBounds.push([lab.latitude, lab.longitude]);
            const marker = L.marker([lab.latitude, lab.longitude], { icon: labIcon });
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

            isAllStatesView ? labClusterLayer.addLayer(marker) : labFeatureLayer.addLayer(marker);
        }
    });

    // Sync visibility for the correct set of layers
    if (isAllStatesView) {
        if (slaughterhouseCheckbox.checked) map.addLayer(slaughterhouseClusterLayer);
        if (meatProcessingCheckbox.checked) map.addLayer(processingClusterLayer);
        if (testingLabsCheckbox.checked) map.addLayer(labClusterLayer);
    } else {
        if (slaughterhouseCheckbox.checked) map.addLayer(slaughterhouseFeatureLayer);
        if (meatProcessingCheckbox.checked) map.addLayer(processingFeatureLayer);
        if (testingLabsCheckbox.checked) map.addLayer(labFeatureLayer);
    }
    

    if (shouldUpdateView) {
        if (!isAllStatesView && markerBounds.length > 0) {
            const bounds = L.latLngBounds(markerBounds);
            map.fitBounds(bounds.pad(0.1));
        } else if (isAllStatesView) {
            map.setView([38.438847, -99.579560], 4);
        }
    }
}


slaughterhouseCheckbox.addEventListener('change', () => applyFilters(false));
meatProcessingCheckbox.addEventListener('change', () => applyFilters(false));
testingLabsCheckbox.addEventListener('change', () => applyFilters(false));
stateSelector.addEventListener('change', () => applyFilters(true)); // Only this one updates the view

function getStateFromCityStateZip(cityStateZip) {
    if (!cityStateZip || typeof cityStateZip !== 'string') return null;
    const match = cityStateZip.match(/, ([A-Z]{2})/);
    return match ? match[1] : null;
}

async function initializeApp() {

    const loader = document.getElementById('loader-overlay'); 
    try {
        if(loader) loader.style.display = 'flex';

        const usdaPromise = fetch('https://untileverycage-ikbq.shuttle.app/api/locations');
        const aphisPromise = fetch('https://untileverycage-ikbq.shuttle.app/api/aphis-reports');

        const [usdaResponse, aphisResponse] = await Promise.all([usdaPromise, aphisPromise]);

        if (!usdaResponse.ok) throw new Error(`USDA data request failed: ${usdaResponse.status}`);
        if (!aphisResponse.ok) throw new Error(`APHIS data request failed: ${aphisResponse.status}`);

        allLocations = await usdaResponse.json();
        allLabLocations = await aphisResponse.json();
        
        const usdaStates = allLocations.map(loc => loc.state);
        const aphisStates = allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip']));
        const allStateValues = [...usdaStates, ...aphisStates];
        const uniqueStates = [...new Set(allStateValues.filter(state => state != null))];
        uniqueStates.sort();
        stateSelector.innerHTML = '<option value="all">All States</option>';
        uniqueStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelector.appendChild(option);
        });

        applyFilters(true);

    } catch (error) {
        console.error('Failed to fetch initial data:', error);
        alert(`There was a critical error fetching data from the server: ${error.message}`);
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

initializeApp();