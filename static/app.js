// @ts-nocheck
/**
 * =============================================================================
 * UNTIL EVERY CAGE IS EMPTY - MAP APPLICATION SCRIPT
 * =============================================================================
 * * This script powers the interactive map for the "Until Every Cage is Empty" project.
 * It handles:
 * - Initializing the Leaflet map and its controls.
 * - Fetching multiple datasets from the backend API.
 * - Creating and managing different map layers for each data type.
 * - Applying user filters (by state and data type).
 * - Dynamically generating detailed popups for each map marker.
 * - Updating the browser URL to allow for shareable map views.
 * * Main Dependencies: Leaflet.js, Leaflet.markercluster
 */

// =============================================================================
//  MAP INITIALIZATION & CONFIGURATION
// =============================================================================


// Define the absolute geographical boundaries of the map to prevent scrolling too far.
const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const worldBounds = L.latLngBounds(southWest, northEast);

// Create the main Leaflet map instance, centered on the continental US.
const map = L.map('map', {
    maxBounds: worldBounds,
    maxBoundsViscosity: 0.1 // Makes the map "bounce back" at the edges.
}).setView([38.438847, -99.579560], 4).setMinZoom(2).setZoom(4);

// Define the base map tile layers (the map imagery itself).
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});
const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
});

// Add the default street map layer to the map on initial load.
streetMap.addTo(map);

// Create the layer control to allow switching between Street and Satellite views.
const baseMaps = {
    "Street View": streetMap,
    "Satellite View": satelliteMap
};
L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);


// =============================================================================
//  CUSTOM LEAFLET CONTROLS
// =============================================================================

/**
 * Custom Fullscreen Control for Leaflet.
 */
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
            if (exitMethod) exitMethod.call(document);
        } else {
            const requestMethod = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(container);
            } else {
                L.DomUtil.addClass(container, 'map-pseudo-fullscreen');
                this.link.innerHTML = this.options.exitText;
                this._map.invalidateSize();
            }
        }
    },
    _onFullscreenChange: function () {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        this.link.innerHTML = fullscreenElement ? this.options.exitText : this.options.enterText;
    }
});
map.addControl(new L.Control.CustomFullscreen());

/**
 * Custom Find Me Control
 */
L.Control.FindMe = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-find-me');
        const link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Find my location';

        L.DomEvent.on(link, 'click', L.DomEvent.stop)
                  .on(link, 'click', () => {
                      map.locate({ setView: true, maxZoom: 12 });
                  });
        
        return container;
    }
});
map.addControl(new L.Control.FindMe());

map.on('locationfound', e => {
    L.marker(e.latlng).addTo(map)
     .bindPopup("You are somewhere around here.").openPopup();
});
map.on('locationerror', e => {
    alert(e.message);
});


// =============================================================================
//  ICONS AND LAYER GROUPS
// =============================================================================

// Defines the visual icons used for each type of map marker.
const slaughterhouseIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const processingIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const labIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const inspectionReportIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// --- Application State Management ---
let allLocations = [];
let allLabLocations = [];
let allInspectionReports = [];
let isInitialDataLoading = true;

// --- Layer Groups ---
// A SINGLE cluster group for all marker types
const unifiedClusterLayer = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60, disableClusteringAtZoom: 9 });

// Individual layers for when clustering is disabled
const slaughterhouseFeatureLayer = L.layerGroup();
const processingFeatureLayer = L.layerGroup();
const labFeatureLayer = L.layerGroup();
const inspectionReportFeatureLayer = L.layerGroup();


// --- DOM Element References ---
const slaughterhouseCheckbox = document.getElementById('slaughterhousesCheckbox');
const meatProcessingCheckbox = document.getElementById('meatProcessingPlantsCheckbox');
const testingLabsCheckbox = document.getElementById('testingLabsCheckbox');
const breedersCheckbox = document.getElementById('breedersCheckbox');
const dealersCheckbox = document.getElementById('dealersCheckbox');
const exhibitorsCheckbox = document.getElementById('exhibitorsCheckbox');
const stateSelector = document.getElementById('state-selector');
const nameSearchInput = document.getElementById('name-search-input');
const shareViewBtn = document.getElementById('share-view-btn');
const statsContainer = document.getElementById('stats-container');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// =============================================================================
//  CORE APPLICATION LOGIC
// =============================================================================

function updateUrlWithCurrentState() {
    if (isInitialDataLoading) return;
    
    const center = map.getCenter();
    const zoom = map.getZoom();
    const params = new URLSearchParams({
        lat: center.lat.toFixed(5),
        lng: center.lng.toFixed(5),
        zoom: zoom,
        state: stateSelector.value,
    });

    const searchTerm = nameSearchInput.value;
    if (searchTerm) params.set('search', searchTerm);

    let activeLayers = [];
    if (slaughterhouseCheckbox.checked) activeLayers.push('slaughter');
    if (meatProcessingCheckbox.checked) activeLayers.push('processing');
    if (testingLabsCheckbox.checked) activeLayers.push('labs');
    if (breedersCheckbox.checked) activeLayers.push('breeders');
    if (dealersCheckbox.checked) activeLayers.push('dealers');
    if (exhibitorsCheckbox.checked) activeLayers.push('exhibitors');

    if (activeLayers.length > 0) {
        params.set('layers', activeLayers.join(','));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, '', newUrl);
}

function applyFilters(shouldUpdateView = false) {
    const selectedState = stateSelector.value;
    const searchTerm = nameSearchInput.value.toLowerCase().trim();
    const isAllStatesView = selectedState === 'all';

    // --- 1. Clear all layers ---
    unifiedClusterLayer.clearLayers();
    [slaughterhouseFeatureLayer, processingFeatureLayer, labFeatureLayer, inspectionReportFeatureLayer]
        .forEach(layer => layer.clearLayers());
    
    map.removeLayer(unifiedClusterLayer);
    [slaughterhouseFeatureLayer, processingFeatureLayer, labFeatureLayer, inspectionReportFeatureLayer]
        .forEach(layer => map.removeLayer(layer));

    // --- 2. Filter data sources ---
    const showBreeders = breedersCheckbox.checked;
    const showDealers = dealersCheckbox.checked;
    const showExhibitors = exhibitorsCheckbox.checked;
    
    // Handle search term synonyms
    const searchSynonyms = {
        'cow': 'cattle',
        'cows': 'cattle'
    };
    const effectiveSearchTerm = searchSynonyms[searchTerm] || searchTerm;

    const filteredUsdaLocations = allLocations.filter(loc => {
        const stateMatch = isAllStatesView || loc.state === selectedState;
        if (!stateMatch) return false;

        if (!searchTerm) return true; // If no search term, only filter by state

        const nameMatch = (loc.establishment_name && loc.establishment_name.toLowerCase().includes(searchTerm)) ||
                          (loc.dbas && loc.dbas.toLowerCase().includes(searchTerm));
        
        const animalMatch = (loc.animals_slaughtered && loc.animals_slaughtered.toLowerCase().includes(effectiveSearchTerm)) ||
                            (loc.animals_processed && loc.animals_processed.toLowerCase().includes(effectiveSearchTerm));

        return nameMatch || animalMatch;
    });

    const filteredLabs = allLabLocations.filter(lab => {
        const stateMatch = isAllStatesView || getStateFromCityStateZip(lab['City-State-Zip']) === selectedState;
        if (!stateMatch) return false;

        if (!searchTerm) return true;

        const nameMatch = lab['Account Name'] && lab['Account Name'].toLowerCase().includes(searchTerm);
        const animalMatch = lab['Animals Tested On'] && lab['Animals Tested On'].toLowerCase().includes(searchTerm);

        return nameMatch || animalMatch;
    });

    const filteredInspections = allInspectionReports.filter(report => {
        const stateMatch = isAllStatesView || report['State'] === selectedState;
        const nameMatch = !searchTerm || (report['Account Name'] && report['Account Name'].toLowerCase().includes(searchTerm));
        if (!stateMatch || !nameMatch) return false;

        const licenseType = report['License Type'] || '';
        if (showBreeders && licenseType === 'Class A - Breeder') return true;
        if (showDealers && licenseType === 'Class B - Dealer') return true;
        if (showExhibitors && licenseType === 'Class C - Exhibitor') return true;
        return false;
    });

    const slaughterhouses = filteredUsdaLocations.filter(loc => loc.slaughter && loc.slaughter.toLowerCase() === 'yes');
    const processingPlants = filteredUsdaLocations.filter(loc => !loc.slaughter || loc.slaughter.toLowerCase() !== 'yes');
    
    // --- 3. Decide on clustering and update stats ---
    let totalMarkerCount = 0;
    if (slaughterhouseCheckbox.checked) totalMarkerCount += slaughterhouses.length;
    if (meatProcessingCheckbox.checked) totalMarkerCount += processingPlants.length;
    if (testingLabsCheckbox.checked) totalMarkerCount += filteredLabs.length;
    totalMarkerCount += filteredInspections.length;

    const CLUSTER_THRESHOLD = 2100;
    const useClustering = totalMarkerCount >= CLUSTER_THRESHOLD;

    updateStats(slaughterhouses.length, processingPlants.length, filteredLabs.length, filteredInspections.length);

    // --- 4. Plot markers and add to layers ---
    const markerBounds = [];
    const addMarkerToLayer = (marker, layer) => {
        if (marker) {
            layer.addLayer(marker);
            if (!isAllStatesView) markerBounds.push(marker.getLatLng());
        }
    };

    const slaughterLayer = useClustering ? unifiedClusterLayer : slaughterhouseFeatureLayer;
    const processingLayer = useClustering ? unifiedClusterLayer : processingFeatureLayer;
    const labLayer = useClustering ? unifiedClusterLayer : labFeatureLayer;
    const inspectionLayer = useClustering ? unifiedClusterLayer : inspectionReportFeatureLayer;

    if (slaughterhouseCheckbox.checked) {
        slaughterhouses.forEach(loc => addMarkerToLayer(plotMarker(loc, true), slaughterLayer));
    }
    if (meatProcessingCheckbox.checked) {
        processingPlants.forEach(loc => addMarkerToLayer(plotMarker(loc, false), processingLayer));
    }
    if (testingLabsCheckbox.checked) {
        filteredLabs.forEach(lab => addMarkerToLayer(plotMarker(lab, 'lab'), labLayer));
    }
    filteredInspections.forEach(report => addMarkerToLayer(plotMarker(report, 'inspection'), inspectionLayer));
    
    // --- 5. Add layers to map ---
    if (useClustering) {
        map.addLayer(unifiedClusterLayer);
    } else {
        if (slaughterhouseCheckbox.checked) map.addLayer(slaughterhouseFeatureLayer);
        if (meatProcessingCheckbox.checked) map.addLayer(processingFeatureLayer);
        if (testingLabsCheckbox.checked) map.addLayer(labFeatureLayer);
        if (filteredInspections.length > 0) map.addLayer(inspectionReportFeatureLayer);
    }
    
    // --- 6. Adjust map view ---
    if (shouldUpdateView) {
        if (!isAllStatesView && markerBounds.length > 0) {
            map.fitBounds(L.latLngBounds(markerBounds).pad(0.1));
        } else if (isAllStatesView) {
            map.setView([38.438847, -99.579560], 4);
        }
    }
    updateUrlWithCurrentState();
}

function plotMarker(data, type) {
    let lat, lng, icon, popupContent;

    if (type === 'lab') {
        lat = data.latitude;
        lng = data.longitude;
        icon = labIcon;
        popupContent = buildLabPopup(data);
    } else if (type === 'inspection') {
        lat = parseFloat(data['Geocodio Latitude']);
        lng = parseFloat(data['Geocodio Longitude']);
        icon = inspectionReportIcon;
        popupContent = buildInspectionReportPopup(data);
    } else { // USDA Location
        lat = data.latitude;
        lng = data.longitude;
        const isSlaughterhouse = type === true;
        icon = isSlaughterhouse ? slaughterhouseIcon : processingIcon;
        popupContent = buildUsdaPopup(data, isSlaughterhouse);
    }

    if (lat && lng) {
        const marker = L.marker([lat, lng], { icon: icon });
        marker.bindPopup(popupContent);
        return marker;
    }
    return null; // Return null if no coordinates
}

function updateStats(slaughterhouses, processing, labs, inspections) {
    let stats = [];
    if (slaughterhouseCheckbox.checked && slaughterhouses > 0 ) stats.push(`${slaughterhouses.toLocaleString()} Slaughterhouses`);
    if (meatProcessingCheckbox.checked && processing > 0) stats.push(`${processing.toLocaleString()} Processing Plants`);
    if (testingLabsCheckbox.checked && labs > 0) stats.push(`${labs.toLocaleString()} Animal Labs`);
    if ((breedersCheckbox.checked || dealersCheckbox.checked || exhibitorsCheckbox.checked) && inspections > 0) stats.push(`${inspections.toLocaleString()} Other Registrants`);
    
    statsContainer.innerHTML = stats.length > 0 ? `Showing: ${stats.join(', ')}` : 'No facilities match the current filters.';
}

// =============================================================================
//  POPUP BUILDER HELPER FUNCTIONS
// =============================================================================

// REPLACE this function in app.js
function buildUsdaPopup(location, isSlaughterhouse) {
    const establishmentName = location.establishment_name || 'Unknown Name';
    const locationTypeText = isSlaughterhouse ? "Slaughterhouse" : "Processing-Only Facility";
    const fullAddress = location.street && location.street.trim() ? `${location.street.trim()}, ${location.city.trim()}, ${location.state.trim()} ${location.zip}` : 'Address not available';
    const establishmentId = location.establishment_id;
    const grantDate = location.grant_date;
    const phone = location.phone;
    const dbas = location.dbas;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

    // Helper function to create the volume bars
    const createVolumeBars = (category) => {
        if (!category || category === "0.0") return '';
        const level = parseInt(category.charAt(0));
        let bars = '';
        for (let i = 1; i <= 5; i++) {
            bars += `<div class="volume-indicator-bar ${i <= level ? 'filled' : ''}"></div>`;
        }
        return `<div class="volume-indicator">${bars}</div>`;
    };
    
    let animals_processed_monthly_text = "N/A";
    let processingVolumeHtml = createVolumeBars(location.processing_volume_category);
    if (location.processing_volume_category) {
        switch (location.processing_volume_category) {
            case "1.0": animals_processed_monthly_text = "Less than 10,000 pounds/month."; break;
            case "2.0": animals_processed_monthly_text = "10k - 100k pounds/month."; break;
            case "3.0": animals_processed_monthly_text = "100k - 1M pounds/month."; break;
            case "4.0": animals_processed_monthly_text = "1M - 10M pounds/month."; break;
            case "5.0": animals_processed_monthly_text = "Over 10M pounds/month."; break;
        }
    }

    let slaughterText = "";
    if (isSlaughterhouse) {
        let animals_slaughtered_yearly_text = "N/A";
        let slaughterVolumeHtml = createVolumeBars(location.slaughter_volume_category);
        if (location.slaughter_volume_category) {
            switch (location.slaughter_volume_category) {
                case "1.0": animals_slaughtered_yearly_text = "Less than 1,000 animals/year."; break;
                case "2.0": animals_slaughtered_yearly_text = "1k - 10k animals/year."; break;
                case "3.0": animals_slaughtered_yearly_text = "10k - 100k animals/year."; break;
                case "4.0": animals_slaughtered_yearly_text = "100k - 10M animals/year."; break;
                case "5.0": animals_slaughtered_yearly_text = "Over 10M animals/year."; break;
            }
        }
        slaughterText = `<hr><p><strong>Types of Animals Killed:</strong> ${location.animals_slaughtered || 'N/A'}</p>
                         <p><strong>Yearly Slaughter Volume:</strong> ${slaughterVolumeHtml} <span class="volume-label">${animals_slaughtered_yearly_text}</span></p>`;
    }

    return `
        <div class="info-popup">
            <h3>${establishmentName}</h3>
            <p1><strong>${locationTypeText}</strong></p1><br>
            <p1>(${location.latitude}, ${location.longitude})</p1>
            <hr>
            <p><strong>Address:</strong> <span class="copyable-text" data-copy="${fullAddress}">${fullAddress}</span></p>
            <p><strong>Establishment ID:</strong> <span class="copyable-text" data-copy="${establishmentId}">${establishmentId}</span></p>
            <p><strong>Grant Date:</strong> ${grantDate || 'N/A'}</p>
            <p><strong>Phone:</strong> ${phone ? `<span class="copyable-text" data-copy="${phone}">${phone}</span>` : 'N/A'}</p>
            ${dbas ? `<p><strong>Doing Business As:</strong> <span class="copyable-text" data-copy="${dbas}">${dbas}</span></p>` : ""}
            <hr>
            <p><strong>Products Processed:</strong> ${location.animals_processed || 'N/A'}</p>
            <p><strong>Monthly Product Volume:</strong> ${processingVolumeHtml} <span class="volume-label">${animals_processed_monthly_text}</span></p>
            ${slaughterText}
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Get Directions</strong></a>
        </div>`;
}


function buildLabPopup(lab) {
    const name = lab['Account Name'] || 'Unknown Name';
    const certNum = lab['Certificate Number'];
    const fullAddress = `${lab['Address Line 1'] || ''} ${lab['Address Line 2'] || ''} ${lab['City-State-Zip'] || ''}`.trim().replace(/ ,/g, ',');
    const arloUrl = certNum ? `https://arlo.riseforanimals.org/browse?query=${encodeURIComponent(certNum)}&order=relevance` : null;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lab.latitude},${lab.longitude}`;

    return `
        <div class="info-popup">
            <h3>${name}</h3>
            <p1><strong>${lab['Registration Type'] || 'N/A'}</strong></p1><br>
            <p1>(${lab.latitude},${lab.longitude})</p1>
            <hr>
            <p><strong>Address:</strong> <span class="copyable-text" data-copy="${fullAddress}">${fullAddress || 'N/A'}</span></p>
            <p><strong>Certificate Number:</strong> <span class="copyable-text" data-copy="${certNum}">${certNum || 'N/A'}</span></p>
            ${arloUrl ? `<p><a href="${arloUrl}" target="_blank" rel="noopener noreferrer"><strong>View Details on ARLO »</strong></a></p>` : ''}
            <hr>
            <p><strong>Animals Tested On:</strong> ${lab['Animals Tested On'] || 'N/A'}</p>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Get Directions</strong></a>
        </div>`;
}

function buildInspectionReportPopup(report) {
    let classText = "N/A";
    if (report['License Type'] === "Class A - Breeder") classText = "Breeder";
    else if (report['License Type'] === "Class B - Dealer") classText = "Dealer";
    else if (report['License Type'] === "Class C - Exhibitor") classText = "Exhibitor";
    
    const name = report['Account Name'] || 'Unknown Name';
    const certNum = report['Certificate Number'];
    const fullAddress = `${report['Address Line 1'] || ''}, ${report['City-State-Zip'] || ''}`.trim().replace(/^,|,$/g, '').trim();
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report['Geocodio Latitude']},${report['Geocodio Longitude']}`;

    return `
        <div class="info-popup inspection-popup">
            <h3>${name}</h3>
            <p1><strong>${classText}</strong></p1><br>
            <p1>(${report['Geocodio Latitude']}, ${report['Geocodio Longitude']})</p1>
            <hr>
            <p><strong>Address:</strong> <span class="copyable-text" data-copy="${fullAddress}">${fullAddress || 'N/A'}</span></p>
            <p><strong>Certificate Number:</strong> <span class="copyable-text" data-copy="${certNum}">${certNum || 'N/A'}</span></p>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Get Directions</strong></a>
        </div>`;
}
// =============================================================================
//  EVENT LISTENERS & UTILITY FUNCTIONS
// =============================================================================

[slaughterhouseCheckbox, meatProcessingCheckbox, testingLabsCheckbox, breedersCheckbox, dealersCheckbox, exhibitorsCheckbox]
.forEach(checkbox => checkbox.addEventListener('change', () => applyFilters(false)));

stateSelector.addEventListener('change', () => applyFilters(true));
nameSearchInput.addEventListener('input', () => applyFilters(false));
map.on('moveend', updateUrlWithCurrentState);

function getStateFromCityStateZip(cityStateZip) {
    if (!cityStateZip || typeof cityStateZip !== 'string') return null;
    const match = cityStateZip.match(/, ([A-Z]{2})/);
    return match ? match[1] : null;
}

shareViewBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        shareViewBtn.textContent = 'Link Copied!';
        shareViewBtn.classList.add('copied');
        setTimeout(() => {
            shareViewBtn.textContent = 'Share View';
            shareViewBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy URL: ', err);
    });
});

resetFiltersBtn.addEventListener('click', () => {
    stateSelector.value = 'all';
    nameSearchInput.value = '';
    slaughterhouseCheckbox.checked = true;
    meatProcessingCheckbox.checked = true;
    testingLabsCheckbox.checked = true;
    breedersCheckbox.checked = true;
    dealersCheckbox.checked = true;
    exhibitorsCheckbox.checked = true;
    applyFilters(true); // true to reset the map view
});


map.on('popupopen', function (e) {
    const popupNode = e.popup.getElement();
    if (!popupNode) return;

    // Use a unique ID to track if a message is already showing
    const popupId = `popup-${e.popup._leaflet_id}`;

    const copyableElements = popupNode.querySelectorAll('.copyable-text');
    copyableElements.forEach(el => {
        el.addEventListener('click', function (event) {
            event.stopPropagation(); // Stop click from propagating to the map
            const textToCopy = this.getAttribute('data-copy');
            
            // Prevent multiple "Copied!" messages from appearing
            const existingFeedback = popupNode.querySelector('.copy-feedback-message');
            if (existingFeedback) {
                existingFeedback.remove();
            }

            if (textToCopy && textToCopy !== 'N/A') {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const feedbackEl = document.createElement('span');
                    feedbackEl.className = 'copy-feedback-message';
                    feedbackEl.textContent = 'Copied!';
                    
                    // Position the tooltip based on the clicked element
                    feedbackEl.style.left = `${this.offsetLeft}px`;
                    feedbackEl.style.top = `${this.offsetTop}px`;

                    // Add it to the DOM and then remove it after a delay
                    this.parentNode.appendChild(feedbackEl);
                    
                    setTimeout(() => {
                        feedbackEl.remove();
                    }, 1200); // Message disappears after 1.2 seconds

                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        });
    });
});
// =============================================================================
//  APPLICATION INITIALIZATION
// =============================================================================

async function initializeApp() {
    const loader = document.getElementById('loader-overlay'); 
    try {
        if(loader) loader.style.display = 'flex';

        const [usdaResponse, aphisResponse, inspectionsResponse] = await Promise.all([
            fetch('https://untileverycage-ikbq.shuttle.app/api/locations'),
            fetch('https://untileverycage-ikbq.shuttle.app/api/aphis-reports'),
            fetch('https://untileverycage-ikbq.shuttle.app/api/inspection-reports')
        ]);

        if (!usdaResponse.ok) throw new Error(`USDA data request failed`);
        if (!aphisResponse.ok) throw new Error(`APHIS data request failed`);
        if (!inspectionsResponse.ok) throw new Error(`Inspections data request failed`);

        allLocations = await usdaResponse.json();
        allLabLocations = await aphisResponse.json();
        allInspectionReports = await inspectionsResponse.json();
        
        const allStateValues = [...new Set([
            ...allLocations.map(loc => loc.state),
            ...allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip'])),
            ...allInspectionReports.map(report => report['State'])
        ].filter(Boolean))];
        allStateValues.sort();
        
        stateSelector.innerHTML = '<option value="all">All States</option>';
        allStateValues.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelector.appendChild(option);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const layersParam = urlParams.get('layers');
        if (layersParam) {
            const visibleLayers = new Set(layersParam.split(','));
            slaughterhouseCheckbox.checked = visibleLayers.has('slaughter');
            meatProcessingCheckbox.checked = visibleLayers.has('processing');
            testingLabsCheckbox.checked = visibleLayers.has('labs');
            breedersCheckbox.checked = visibleLayers.has('breeders');
            dealersCheckbox.checked = visibleLayers.has('dealers');
            exhibitorsCheckbox.checked = visibleLayers.has('exhibitors');
        }
        
        stateSelector.value = urlParams.get('state') || 'all';
        nameSearchInput.value = urlParams.get('search') || '';

        let shouldUpdateViewOnLoad = true;
        if (urlParams.has('lat') && urlParams.has('lng') && urlParams.has('zoom')) {
            map.setView([parseFloat(urlParams.get('lat')), parseFloat(urlParams.get('lng'))], parseInt(urlParams.get('zoom')));
            shouldUpdateViewOnLoad = false;
        }

        applyFilters(shouldUpdateViewOnLoad);

    } catch (error) {
        console.error('Failed to fetch initial data:', error);
        if(statsContainer) statsContainer.innerHTML = `Could not load map data. Please try refreshing the page.`;
    } finally {
        if(loader) loader.style.display = 'none';
        isInitialDataLoading = false;
        if(!urlParams.has('lat')) updateUrlWithCurrentState();
    }
}

initializeApp();
