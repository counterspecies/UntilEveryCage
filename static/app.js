


const slaughterhouseIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});




const map = L.map('map').setView([20, 0], 2); // Centered roughly globally, zoomed out


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// @ts-ignore
async function plotLocations() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/locations');
        const locations = await response.json();

        locations.forEach(location => {

            let icon = defaultIcon;

            if (location.type.includes("Slaughter")){
                icon = slaughterhouseIcon;
            }

            const marker = L.marker([location.lat, location.lon]).addTo(map);
            marker.setIcon(icon).bindPopup(`<b>${location.name}</b><br>${"Activites: " + location.type}`);
                
        });

    } catch (error) {
        console.error('Failed to fetch locations:', error);
    }
}

plotLocations();