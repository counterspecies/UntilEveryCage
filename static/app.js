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
    //maxBounds: worldBounds,
    //maxBoundsViscosity: 0.0, // Makes the map "bounce back" at the edges.
    zoomControl: false // Disable default zoom control, we'll add it to bottom
}).setView([31.42841, -49.57343], 2).setMinZoom(2).setZoom(2);

// =============================================================================
//  WORLD WRAPPING FUNCTIONALITY
// =============================================================================

/**
 * Corrects coordinates to ensure they stay within world bounds by wrapping longitude
 * and clamping latitude, creating a seamless looping effect.
 */
function correctCoordinates(lat, lng) {
    // Wrap longitude: if it goes outside ±180, bring it back into range
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    
    // Clamp latitude to valid range (can't wrap north-south)
    lat = Math.max(-85, Math.min(85, lat)); // Using 85 instead of 90 to match web mercator limits
    
    return [lat, lng];
}

/**
 * Applies coordinate correction to the current map view
 */
function correctMapView() {
    const center = map.getCenter();
    const [correctedLat, correctedLng] = correctCoordinates(center.lat, center.lng);
    
    // Only update if coordinates actually changed
    if (Math.abs(center.lat - correctedLat) > 0.001 || Math.abs(center.lng - correctedLng) > 0.001) {
        map.setView([correctedLat, correctedLng], map.getZoom(), { animate: false });
    }
}

// Apply coordinate correction on map move events
map.on('moveend', correctMapView);

// Also apply correction on drag end for smoother experience
map.on('dragend', correctMapView);

// Add zoom control to bottom-right
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Define the base map tile layers (the map imagery itself).
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});
// Create satellite base layer
const satelliteBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
});

// Create transportation overlay (roads, highways, major boundaries only - no POIs)
const transportationOverlay = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: ''
});

// Combine satellite base with clean transportation overlay
const satelliteMap = L.layerGroup([satelliteBase, transportationOverlay]);

// Add the default street map layer to the map on initial load.
streetMap.addTo(map);

// Create the layer control to allow switching between Street and Satellite views.
const baseMaps = {
    "Street View": streetMap,
    "Satellite View": satelliteMap
};
L.control.layers(baseMaps, null, { collapsed: false, position: 'bottomleft' }).addTo(map);


// =============================================================================
//  CUSTOM LEAFLET CONTROLS
// =============================================================================

/**
 * Custom Fullscreen Control for Leaflet.
 */
L.Control.CustomFullscreen = L.Control.extend({
    options: {
        position: 'bottomright',
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

// Move all map controls to bottom to avoid overlap with filter panel
function moveControlsToBottom() {
    const leftControls = document.querySelector('.leaflet-top.leaflet-left');
    const rightControls = document.querySelector('.leaflet-top.leaflet-right');
    
    if (leftControls) {
        leftControls.classList.remove('leaflet-top');
        leftControls.classList.add('leaflet-bottom');
    }
    if (rightControls) {
        rightControls.classList.remove('leaflet-top');
        rightControls.classList.add('leaflet-bottom');
    }
}

// Call after a short delay to ensure controls are rendered
setTimeout(moveControlsToBottom, 100);

/**
 * Custom Find Me Control
 */
L.Control.FindMe = L.Control.extend({
    options: {
        position: 'bottomright'
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
     .bindPopup("You are here.").openPopup();
});
map.on('locationerror', e => {
    alert(e.message);
});


// =============================================================================
//  ICONS AND LAYER GROUPS
// =============================================================================

// Scalable icon system
const BASE_ICON_SPECS = {
    slaughter: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    },
    processing: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    },
    lab: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    },
    breeder: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    },
    dealer: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    },
    exhibitor: {
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    }
};

const PIN_SCALES = [0.5, 0.75, 1];
let currentPinScaleIndex = PIN_SCALES.indexOf(1) !== -1 ? PIN_SCALES.indexOf(1) : PIN_SCALES.length - 1;

const round = (n) => Math.max(1, Math.round(n));
function createScaledIcon(spec, scale) {
    const sz = spec.iconSize;
    const sh = spec.shadowSize;
    const ia = spec.iconAnchor;
    const pa = spec.popupAnchor;
    const s = scale;
    return L.icon({
        iconUrl: spec.iconUrl,
        shadowUrl: spec.shadowUrl,
        iconSize: [round(sz[0] * s), round(sz[1] * s)],
        shadowSize: [round(sh[0] * s), round(sh[1] * s)],
        iconAnchor: [round(ia[0] * s), round(ia[1] * s)],
        popupAnchor: [round(pa[0] * s), round(pa[1] * s)]
    });
}

function getCurrentScale() { return PIN_SCALES[currentPinScaleIndex]; }

// Live icon instances used when plotting markers
let slaughterhouseIcon = createScaledIcon(BASE_ICON_SPECS.slaughter, getCurrentScale());
let processingIcon = createScaledIcon(BASE_ICON_SPECS.processing, getCurrentScale());
let labIcon = createScaledIcon(BASE_ICON_SPECS.lab, getCurrentScale());
let breederIcon = createScaledIcon(BASE_ICON_SPECS.breeder, getCurrentScale());
let dealerIcon = createScaledIcon(BASE_ICON_SPECS.dealer, getCurrentScale());
let exhibitorIcon = createScaledIcon(BASE_ICON_SPECS.exhibitor, getCurrentScale());

function refreshGlobalIcons() {
    const s = getCurrentScale();
    slaughterhouseIcon = createScaledIcon(BASE_ICON_SPECS.slaughter, s);
    processingIcon = createScaledIcon(BASE_ICON_SPECS.processing, s);
    labIcon = createScaledIcon(BASE_ICON_SPECS.lab, s);
    breederIcon = createScaledIcon(BASE_ICON_SPECS.breeder, s);
    dealerIcon = createScaledIcon(BASE_ICON_SPECS.dealer, s);
    exhibitorIcon = createScaledIcon(BASE_ICON_SPECS.exhibitor, s);
}

function iconForType(type) {
    switch (type) {
        case 'slaughter': return slaughterhouseIcon;
        case 'processing': return processingIcon;
        case 'lab': return labIcon;
        case 'breeder': return breederIcon;
        case 'dealer': return dealerIcon;
        case 'exhibitor': return exhibitorIcon;
        default: return processingIcon;
    }
}

function updateAllMarkerIcons() {
    // Recreate live icons for the new scale
    refreshGlobalIcons();
    const updateMarker = (m) => {
        if (m && m.setIcon && m._iconType) {
            m.setIcon(iconForType(m._iconType));
        }
    };
    // Update markers across all layers
    [unifiedClusterLayer, slaughterhouseFeatureLayer, processingFeatureLayer, labFeatureLayer, inspectionReportFeatureLayer]
        .forEach(layer => {
            if (!layer) return;
            layer.eachLayer(l => {
                // l may be a marker or a group; try to update directly
                if (l && l.eachLayer) {
                    l.eachLayer(inner => updateMarker(inner));
                } else {
                    updateMarker(l);
                }
            });
        });
}

// Control to cycle pin sizes
L.Control.PinScale = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-pin-scale');
        const link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Toggle pin size';
        link.style.minWidth = '34px';
        link.style.textAlign = 'center';
        const setLabel = () => { link.textContent = `${getCurrentScale()}x`; };
        setLabel();
        L.DomEvent.on(link, 'click', L.DomEvent.stop)
                 .on(link, 'click', () => {
                     currentPinScaleIndex = (currentPinScaleIndex + 1) % PIN_SCALES.length;
                     setLabel();
                     updateAllMarkerIcons();
                 });
        return container;
    }
});
map.addControl(new L.Control.PinScale());

// --- Application State Management ---
let allLocations = [];
let allLabLocations = [];
let allInspectionReports = [];
let isInitialDataLoading = true;

// --- State Name Mapping ---
const US_STATE_NAMES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia', 'AS': 'American Samoa', 'GU': 'Guam', 'MP': 'Northern Mariana Islands',
    'PR': 'Puerto Rico', 'VI': 'U.S. Virgin Islands'
};

const GERMAN_STATE_NAMES = {
    'BW': 'Baden-Württemberg', 'BY': 'Bayern', 'BE': 'Berlin', 'BB': 'Brandenburg',
    'HB': 'Bremen', 'HH': 'Hamburg', 'HE': 'Hessen', 'MV': 'Mecklenburg-Vorpommern',
    'NI': 'Niedersachsen', 'NW': 'Nordrhein-Westfalen', 'RP': 'Rheinland-Pfalz',
    'SL': 'Saarland', 'SN': 'Sachsen', 'ST': 'Sachsen-Anhalt', 'SH': 'Schleswig-Holstein', 'TH': 'Thüringen',
    'DE_UNKNOWN': 'Deutschland (Unspecified)'
};



function getStateDisplayName(stateCode) {
    return US_STATE_NAMES[stateCode] || GERMAN_STATE_NAMES[stateCode] || stateCode;
}

function isGermanState(stateCode) {
    return GERMAN_STATE_NAMES.hasOwnProperty(stateCode) || stateCode === 'DE_UNKNOWN';
}

function isUSState(stateCode) {
    return US_STATE_NAMES.hasOwnProperty(stateCode);
}

function isUKState(stateCode) {
    // UK states/counties are any that aren't US or German states
    // This is simpler than maintaining a comprehensive UK county list
    return !isUSState(stateCode) && !isGermanState(stateCode) && stateCode && stateCode.trim() !== '';
}

// --- Hierarchical State Selection Functions ---
function populateCountrySelector(allStateValues) {
    const hasUSStates = allStateValues.some(state => isUSState(state));
    const hasGermanStates = allStateValues.some(state => isGermanState(state));
    const hasUKStates = allStateValues.some(state => isUKState(state));
    
    countrySelector.innerHTML = '<option value="all">All Countries</option>';
    
    if (hasUSStates) {
        const usOption = document.createElement('option');
        usOption.value = 'US';
        usOption.textContent = 'United States';
        countrySelector.appendChild(usOption);
    }
    
    if (hasGermanStates) {
        const deOption = document.createElement('option');
        deOption.value = 'DE';
        deOption.textContent = 'Deutschland';
        countrySelector.appendChild(deOption);
    }
    
    if (hasUKStates) {
        const ukOption = document.createElement('option');
        ukOption.value = 'UK';
        ukOption.textContent = 'United Kingdom';
        countrySelector.appendChild(ukOption);
    }
}

function populateStateSelector(allStateValues, selectedCountry = 'all') {
    let filteredStates = [];
    
    if (selectedCountry === 'all') {
        filteredStates = allStateValues;
    } else if (selectedCountry === 'US') {
        filteredStates = allStateValues.filter(state => isUSState(state));
    } else if (selectedCountry === 'DE') {
        filteredStates = allStateValues.filter(state => isGermanState(state));
    } else if (selectedCountry === 'UK') {
        filteredStates = allStateValues.filter(state => isUKState(state));
    }
    
    stateSelector.innerHTML = '<option value="all">All States/Provinces</option>';
    
    // Sort states alphabetically by display name
    filteredStates
        .sort((a, b) => getStateDisplayName(a).localeCompare(getStateDisplayName(b)))
        .forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = getStateDisplayName(state);
            stateSelector.appendChild(option);
        });
}

function getSelectedCountryForState(stateCode) {
    if (isUSState(stateCode)) return 'US';
    if (isGermanState(stateCode)) return 'DE';
    if (isUKState(stateCode)) return 'UK';
    return 'all';
}

// --- Layer Groups ---
// A SINGLE cluster group for all marker types
const unifiedClusterLayer = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50, disableClusteringAtZoom: 10 });

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
const countrySelector = document.getElementById('country-selector');
const stateSelector = document.getElementById('state-selector');
const nameSearchInput = document.getElementById('name-search-input');
const shareViewBtn = document.getElementById('share-view-btn');
const statsContainer = document.getElementById('stats-container');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const loader = document.getElementById('loading-indicator');

// CSV export helpers
function normalizeUsdaRow(loc, isSlaughterhouse) {
    const address = (loc.street && loc.street.trim()) ? `${loc.street.trim()}, ${loc.city?.trim() || ''}, ${getStateDisplayName(loc.state?.trim() || '')} ${loc.zip || ''}`.replace(/ ,/g, ',') : '';
    return {
        Type: isSlaughterhouse ? 'Slaughterhouse' : 'Processing',
        Name: loc.establishment_name || '',
        State: getStateDisplayName(loc.state || ''),
        City: loc.city || '',
        ZIP: loc.zip || '',
        Address: address,
        Latitude: loc.latitude || '',
        Longitude: loc.longitude || '',
        EstablishmentID: loc.establishment_id || '',
        Phone: loc.phone || '',
        AnimalsProcessed: loc.animals_processed || '',
        AnimalsSlaughtered: loc.animals_slaughtered || ''
    };
}
function normalizeLabRow(lab) {
    const fullAddress = `${lab['Address Line 1'] || ''} ${lab['Address Line 2'] || ''} ${lab['City-State-Zip'] || ''}`.trim().replace(/ ,/g, ',');
    return {
        Type: 'Lab',
        Name: lab['Account Name'] || '',
        State: (lab['City-State-Zip'] || '').split(',')[1]?.trim().split(' ')[0] || '',
        City: (lab['City-State-Zip'] || '').split(',')[0]?.trim() || '',
        ZIP: (lab['City-State-Zip'] || '').split(/\s+/).pop() || '',
        Address: fullAddress,
        Latitude: lab.latitude || '',
        Longitude: lab.longitude || '',
        CertificateNumber: lab['Certificate Number'] || '',
        AnimalsTestedOn: lab['Animals Tested On'] || ''
    };
}
function normalizeInspectionRow(report) {
    let type = 'Other';
    if (report['License Type'] === 'Class A - Breeder') type = 'Breeder';
    else if (report['License Type'] === 'Class B - Dealer') type = 'Dealer';
    else if (report['License Type'] === 'Class C - Exhibitor') type = 'Exhibitor';
    const address = `${report['Address Line 1'] || ''}, ${report['City-State-Zip'] || ''}`.replace(/^,|,$/g, '').trim();
    return {
        Type: type,
        Name: report['Account Name'] || '',
        State: report['State'] || '',
        City: (report['City-State-Zip'] || '').split(',')[0]?.trim() || '',
        ZIP: (report['City-State-Zip'] || '').split(/\s+/).pop() || '',
        Address: address,
        Latitude: report['Geocodio Latitude'] || '',
        Longitude: report['Geocodio Longitude'] || '',
        CertificateNumber: report['Certificate Number'] || ''
    };
}
function toCsv(rows) {
    if (!rows || rows.length === 0) return '';
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(',')));
    return lines.join('\n');
}
function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', () => {
        const lf = window.__lastFiltered || {};
        const includeSlaughter = slaughterhouseCheckbox.checked;
        const includeProcessing = meatProcessingCheckbox.checked;
        const includeLabs = testingLabsCheckbox.checked;
        const includeBreeders = breedersCheckbox.checked;
        const includeDealers = dealersCheckbox.checked;
        const includeExhibitors = exhibitorsCheckbox.checked;
        const rows = [];
        if (includeSlaughter && Array.isArray(lf.slaughterhouses)) rows.push(...lf.slaughterhouses.map(loc => normalizeUsdaRow(loc, true)));
        if (includeProcessing && Array.isArray(lf.processingPlants)) rows.push(...lf.processingPlants.map(loc => normalizeUsdaRow(loc, false)));
        if (includeLabs && Array.isArray(lf.filteredLabs)) rows.push(...lf.filteredLabs.map(lab => normalizeLabRow(lab)));
        if (Array.isArray(lf.filteredInspections)) {
            lf.filteredInspections.forEach(r => {
                if ((includeBreeders && r['License Type'] === 'Class A - Breeder') ||
                    (includeDealers && r['License Type'] === 'Class B - Dealer') ||
                    (includeExhibitors && r['License Type'] === 'Class C - Exhibitor')) {
                    rows.push(normalizeInspectionRow(r));
                }
            });
        }
        if (rows.length === 0) {
            alert('No data to export for current filters.');
            return;
        }
        const csv = toCsv(rows);
        const isComplete = stateSelector.value === 'all'
            && (nameSearchInput.value.trim() === '')
            && slaughterhouseCheckbox.checked
            && meatProcessingCheckbox.checked
            && testingLabsCheckbox.checked
            && breedersCheckbox.checked
            && dealersCheckbox.checked
            && exhibitorsCheckbox.checked;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const suffix = isComplete ? 'complete' : 'filtered';
        const filename = `untileverycage-visible-${dateStr}-${suffix}.csv`;
        downloadText(filename, csv);
    });
}

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
        country: countrySelector.value,
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
    const selectedCountry = countrySelector.value;
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
        // Country filtering
        let countryMatch = selectedCountry === 'all';
        if (!countryMatch) {
            if (selectedCountry === 'US' && isUSState(loc.state)) {
                countryMatch = true;
            } else if (selectedCountry === 'DE' && isGermanState(loc.state)) {
                countryMatch = true;
            } else if (selectedCountry === 'UK' && isUKState(loc.state)) {
                countryMatch = true;
            }
        }
        if (!countryMatch) return false;

        // State filtering (within the selected country)
        const stateMatch = isAllStatesView || loc.state === selectedState;
        if (!stateMatch) return false;

        if (!searchTerm) return true; // If no search term, only filter by country and state

        const nameMatch = (loc.establishment_name && loc.establishment_name.toLowerCase().includes(searchTerm)) ||
                          (loc.dbas && loc.dbas.toLowerCase().includes(searchTerm));
        
        const animalMatch = (loc.animals_slaughtered && loc.animals_slaughtered.toLowerCase().includes(effectiveSearchTerm)) ||
                            (loc.animals_processed && loc.animals_processed.toLowerCase().includes(effectiveSearchTerm));

        return nameMatch || animalMatch;
    });

    const filteredLabs = allLabLocations.filter(lab => {
        const labState = getStateFromCityStateZip(lab['City-State-Zip']);
        
        // Country filtering
        let countryMatch = selectedCountry === 'all';
        if (!countryMatch) {
            if (selectedCountry === 'US' && isUSState(labState)) {
                countryMatch = true;
            } else if (selectedCountry === 'DE' && isGermanState(labState)) {
                countryMatch = true;
            } else if (selectedCountry === 'UK' && isUKState(labState)) {
                countryMatch = true;
            }
        }
        if (!countryMatch) return false;

        // State filtering (within the selected country)
        const stateMatch = isAllStatesView || labState === selectedState;
        if (!stateMatch) return false;

        if (!searchTerm) return true;

        const nameMatch = lab['Account Name'] && lab['Account Name'].toLowerCase().includes(searchTerm);
        const animalMatch = lab['Animals Tested On'] && lab['Animals Tested On'].toLowerCase().includes(searchTerm);

        return nameMatch || animalMatch;
    });

    const filteredInspections = allInspectionReports.filter(report => {
        const reportState = report['State'];
        
        // Country filtering
        let countryMatch = selectedCountry === 'all';
        if (!countryMatch) {
            if (selectedCountry === 'US' && isUSState(reportState)) {
                countryMatch = true;
            } else if (selectedCountry === 'DE' && isGermanState(reportState)) {
                countryMatch = true;
            } else if (selectedCountry === 'UK' && isUKState(reportState)) {
                countryMatch = true;
            }
        }
        if (!countryMatch) return false;

        // State filtering (within the selected country)
        const stateMatch = isAllStatesView || reportState === selectedState;
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

    const CLUSTER_THRESHOLD = 2800;
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
    
    // Expose last filtered sets for CSV export
    window.__lastFiltered = {
        slaughterhouses,
        processingPlants,
        filteredLabs,
        filteredInspections
    };

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
            map.setView([31.42841, -49.57343], 2).setZoom(2);
        }
    }
    updateUrlWithCurrentState();
}

function plotMarker(data, type) {
    let lat, lng, iconType, popupContent;

    if (type === 'lab') {
        lat = data.latitude;
        lng = data.longitude;
        iconType = 'lab';
        popupContent = buildLabPopup(data);
    } else if (type === 'inspection') {
        lat = parseFloat(data['Geocodio Latitude']);
        lng = parseFloat(data['Geocodio Longitude']);
        
        // Choose icon type based on license type
        const licenseType = data['License Type'];
        if (licenseType === 'Class A - Breeder') {
            iconType = 'breeder';
        } else if (licenseType === 'Class B - Dealer') {
            iconType = 'dealer';
        } else if (licenseType === 'Class C - Exhibitor') {
            iconType = 'exhibitor';
        } else {
            iconType = 'breeder'; // fallback
        }
        
        popupContent = buildInspectionReportPopup(data);
    } else { // USDA Location
        lat = data.latitude;
        lng = data.longitude;
        const isSlaughterhouse = type === true;
        iconType = isSlaughterhouse ? 'slaughter' : 'processing';
        popupContent = buildUsdaPopup(data, isSlaughterhouse);
    }

    if (lat && lng) {
        const marker = L.marker([lat, lng], { icon: iconForType(iconType) });
        // store marker type for future resizing
        marker._iconType = iconType;
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
    if ((breedersCheckbox.checked || dealersCheckbox.checked || exhibitorsCheckbox.checked) && inspections > 0) stats.push(`${inspections.toLocaleString()} Other Locations`);
    
    statsContainer.innerHTML = stats.length > 0 ? `Showing: ${stats.join(', ')}` : 'No facilities match the current filters.';
}

// =============================================================================
//  POPUP BUILDER HELPER FUNCTIONS
// =============================================================================

// REPLACE this function in app.js
function buildUsdaPopup(location, isSlaughterhouse) {
    const establishmentName = location.establishment_name || 'Unknown Name';
    const locationTypeText = isSlaughterhouse ? "Slaughterhouse" : "Processing-Only Facility";
    const fullAddress = location.street && location.street.trim() ? `${location.street.trim()}, ${location.city.trim()}, ${getStateDisplayName(location.state.trim())} ${location.zip}` : 'Address not available';
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

    // Check if animals_processed has meaningful data
    const hasAnimalsProcessed = location.animals_processed && 
                               location.animals_processed.toLowerCase() !== 'n/a' && 
                               location.animals_processed.toLowerCase() !== 'unknown' &&
                               location.animals_processed.trim() !== '';
    
    // Check if processing volume has meaningful data
    const hasProcessingVolume = location.processing_volume_category && 
                               location.processing_volume_category !== "0.0" &&
                               animals_processed_monthly_text !== "N/A";

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
        
        // Check if animals_slaughtered has meaningful data
        const hasAnimalsSlaughtered = location.animals_slaughtered && 
                                     location.animals_slaughtered.toLowerCase() !== 'n/a' && 
                                     location.animals_slaughtered.toLowerCase() !== 'unknown' &&
                                     location.animals_slaughtered.trim() !== '';
        
        // Check if slaughter volume has meaningful data
        const hasSlaughterVolume = location.slaughter_volume_category && 
                                  location.slaughter_volume_category !== "0.0" &&
                                  animals_slaughtered_yearly_text !== "N/A";
        
        // Only include slaughter data if at least one field has meaningful data
        if (hasAnimalsSlaughtered || hasSlaughterVolume) {
            slaughterText = `<hr>`;
            if (hasAnimalsSlaughtered) {
                slaughterText += `<p><strong>Types of Animals Killed:</strong> ${location.animals_slaughtered}</p>`;
            }
            if (hasSlaughterVolume) {
                slaughterText += `<p><strong>Slaughter Volume:</strong> ${animals_slaughtered_yearly_text}</p>`;
            }
        }
    }

    return `
        <div class="info-popup">
            <h3>${establishmentName}</h3>
            <p1><strong>${locationTypeText}</strong></p1><br>
            <p1>(${location.latitude}, ${location.longitude})</p1>
            <hr>
            <p><strong>Address:</strong> <span class="copyable-text" data-copy="${fullAddress}">${fullAddress}</span></p>
            <p><strong>ID:</strong> <span class="copyable-text" data-copy="${establishmentId}">${establishmentId}</span></p>
            ${phone && phone.trim() !== '' && phone !== 'N/A' ? `<p><strong>Phone:</strong> <span class="copyable-text" data-copy="${phone}">${phone}</span></p>` : ''}
            ${dbas ? `<p><strong>Doing Business As:</strong> <span class="copyable-text" data-copy="${dbas}">${dbas}</span></p>` : ""}
            ${(hasAnimalsProcessed || hasProcessingVolume) ? '<hr>' : ''}
            ${hasAnimalsProcessed ? `<p><strong>Products Processed:</strong> ${location.animals_processed}</p>` : ''}
            ${hasProcessingVolume ? `<p><strong>Product Volume:</strong> ${animals_processed_monthly_text}</p>` : ''}
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
            <p><strong>Animals Being Tested On:</strong> ${lab['Animals Tested On'] || 'N/A'}</p>
            <hr>
            
            <p><strong>Investigation Instructions: </strong>Copy the <span class="copyable-text" data-copy="${certNum}">${"certificate number" || 'N/A'}</span>, paste it into the APHIS search tool below, then click <strong>query annual reports</strong> on the facility. Keep an eye out for <strong> exception reports</strong>; those are especially cruel.</p>

            <a href="https://aphis.my.site.com/PublicSearchTool/s/annual-reports" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Open APHIS Search Tool</strong></a>
            <p></p>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Get Directions</strong></a>
        </div>`;
}

function buildInspectionReportPopup(report) {
    let classText = "N/A";
    if (report['License Type'] === "Class A - Breeder") classText = "Animal Breeder";
    else if (report['License Type'] === "Class B - Dealer") classText = "Animal Dealer";
    else if (report['License Type'] === "Class C - Exhibitor") classText = "Exhibitor / Zoo";
    
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
            <p><strong>Investigation Instructions: </strong>Copy the <span class="copyable-text" data-copy="${certNum}">${"certificate number" || 'N/A'}</span>, paste it into the APHIS search tool below, then click <strong>query inspection reports</strong> on the facility.</p>
            <a href="https://aphis.my.site.com/PublicSearchTool/s/inspection-reports" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Open APHIS Search Tool</strong></a>
            <p></p>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn"><strong>Get Directions</strong></a>
        </div>`;
}
// =============================================================================
//  EVENT LISTENERS & UTILITY FUNCTIONS
// =============================================================================

[slaughterhouseCheckbox, meatProcessingCheckbox, testingLabsCheckbox, breedersCheckbox, dealersCheckbox, exhibitorsCheckbox]
.forEach(checkbox => checkbox.addEventListener('change', () => applyFilters(false)));

// Country selector event handler - updates state dropdown when country changes
countrySelector.addEventListener('change', () => {
    const selectedCountry = countrySelector.value;
    const allStateValues = [...new Set([
        ...allLocations.map(loc => loc.state),
        ...allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip'])),
        ...allInspectionReports.map(report => report['State'])
    ].filter(Boolean))];
    
    populateStateSelector(allStateValues, selectedCountry);
    applyFilters(true);
});

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
    countrySelector.value = 'all';
    
    // Repopulate state selector with all states since country is reset to 'all'
    const allStateValues = [...new Set([
        ...allLocations.map(loc => loc.state),
        ...allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip'])),
        ...allInspectionReports.map(report => report['State'])
    ].filter(Boolean))];
    populateStateSelector(allStateValues, 'all');
    
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


// Filter panel toggle functionality
const filterHeader = document.querySelector('.filter-header');
const mapFilters = document.getElementById('map-filters');
const toggleBtn = document.getElementById('filter-toggle-btn');

filterHeader.addEventListener('click', () => {
    mapFilters.classList.toggle('collapsed');
    
    // Update arrow direction
    if (mapFilters.classList.contains('collapsed')) {
        toggleBtn.textContent = '▶';
    } else {
        toggleBtn.textContent = '▼';
    }
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

// REPLACE the existing initializeApp function with this one
async function initializeApp() {
    let urlParams; // Declare urlParams here, in the higher scope
    let loaderTimeout;

    try {
        // Show loader only if data takes more than 100ms to load
        loaderTimeout = setTimeout(() => {
            if(loader) loader.style.display = 'flex';
        }, 100);

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
        
        // Process German locations - extract specific German states from establishment IDs
        allLocations = allLocations.map(location => {
            // Check if location doesn't have a state and appears to be in Germany
            if (!location.state || location.state.trim() === '') {
                // First try to extract German state from establishment ID (most reliable)
                if (location.establishment_id && typeof location.establishment_id === 'string') {
                    const germanStateMatch = location.establishment_id.match(/^(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)\s/);
                    if (germanStateMatch) {
                        const germanStateCode = germanStateMatch[1];
                        return { ...location, state: germanStateCode };
                    }
                }
                // Fallback: Check if coordinates are within Germany's boundaries
                // Germany: latitude ~47.3-55.1, longitude ~5.9-15.0
                if (location.latitude > 47 && location.latitude < 56 && 
                    location.longitude > 5 && location.longitude < 16) {
                    // If we can't determine the specific state, use a generic German identifier
                    return { ...location, state: 'DE_UNKNOWN' };
                }
            }
            return location;
        });
        
        const allStateValues = [...new Set([
            ...allLocations.map(loc => loc.state),
            ...allLabLocations.map(lab => getStateFromCityStateZip(lab['City-State-Zip'])),
            ...allInspectionReports.map(report => report['State'])
        ].filter(Boolean))];
        allStateValues.sort();
        
        // Populate country and state dropdowns
        populateCountrySelector(allStateValues);
        populateStateSelector(allStateValues, 'all');

        urlParams = new URLSearchParams(window.location.search); // Assign the value here
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
        
        const urlCountry = urlParams.get('country') || 'all';
        const urlState = urlParams.get('state') || 'all';
        
        countrySelector.value = urlCountry;
        
        // If a specific country is pre-selected or a specific state is requested, 
        // make sure state selector is properly filtered
        if (urlCountry !== 'all') {
            populateStateSelector(allStateValues, urlCountry);
        } else if (urlState !== 'all') {
            const stateCountry = getSelectedCountryForState(urlState);
            if (stateCountry !== 'all') {
                countrySelector.value = stateCountry;
                populateStateSelector(allStateValues, stateCountry);
            }
        }
        
        stateSelector.value = urlState;
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
        clearTimeout(loaderTimeout);
        if(loader) loader.style.display = 'none';
        isInitialDataLoading = false;
        if(urlParams && !urlParams.has('lat')) { // Check if urlParams exists before using it
            updateUrlWithCurrentState();
        }
    }
}
initializeApp();
