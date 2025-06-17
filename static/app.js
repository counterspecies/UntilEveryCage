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
            const marker = L.marker([location.lat, location.lon]).addTo(map);
            marker.bindPopup(`<b>${location.name}</b><br>${location.type}`);
        });

    } catch (error) {
        console.error('Failed to fetch locations:', error);
    }
}

plotLocations();