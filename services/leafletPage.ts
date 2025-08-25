/**
 * Leaflet Page Service
 * Generates HTML with Leaflet map for WebView integration
 * Uses OpenStreetMap tiles with proper attribution
 */

export interface LeafletMapConfig {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  };
  routeCoordinates?: Array<{
    latitude: number;
    longitude: number;
  }>;
  showFallbackMessage?: boolean;
  fallbackMessage?: string;
}

export class LeafletPageService {
  /**
   * Generate HTML page with Leaflet map
   */
  static generateMapHTML(config: LeafletMapConfig): string {
    const {
      userLocation,
      destination,
      routeCoordinates = [],
      showFallbackMessage = false,
      fallbackMessage = "Routing failed. Showing straight line route."
    } = config;

    // Calculate center point for the map
    const centerLat = userLocation 
      ? (userLocation.latitude + destination.latitude) / 2 
      : destination.latitude;
    const centerLng = userLocation 
      ? (userLocation.longitude + destination.longitude) / 2 
      : destination.longitude;

    // Calculate zoom level based on distance
    const zoomLevel = userLocation 
      ? this.calculateZoomLevel(userLocation, destination)
      : 13;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Heritage Site Map</title>
        
        <!-- Leaflet CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossorigin=""/>
        
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            #map {
                width: 100%;
                height: 100vh;
            }
            
            .fallback-banner {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                background-color: #FEF3C7;
                border: 1px solid #FCD34D;
                border-radius: 8px;
                padding: 12px;
                z-index: 1000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: ${showFallbackMessage ? 'block' : 'none'};
            }
            
            .fallback-banner .banner-content {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #92400E;
                font-size: 14px;
                font-weight: 500;
            }
            
            .custom-popup {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .popup-title {
                font-weight: 600;
                font-size: 16px;
                color: #111827;
                margin-bottom: 4px;
            }
            
            .popup-description {
                font-size: 14px;
                color: #6B7280;
                margin: 0;
            }
            
            /* Ensure proper attribution styling */
            .leaflet-control-attribution {
                background: rgba(255, 255, 255, 0.9);
                font-size: 11px;
                padding: 4px 6px;
            }
            
            .leaflet-control-attribution a {
                color: #0066CC;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <!-- Fallback message banner -->
        <div class="fallback-banner">
            <div class="banner-content">
                <span>⚠️</span>
                <span>${fallbackMessage}</span>
            </div>
        </div>
        
        <!-- Map container -->
        <div id="map"></div>
        
        <!-- Leaflet JavaScript -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossorigin=""></script>
        
        <script>
            // Disable file access and other security concerns
            window.open = null;
            
            // Initialize map
            const map = L.map('map', {
                center: [${centerLat}, ${centerLng}],
                zoom: ${zoomLevel},
                zoomControl: true,
                attributionControl: true
            });
            
            // Add OpenStreetMap tile layer with proper attribution
            const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            });
            
            tileLayer.addTo(map);
            
            // Handle tile loading errors
            tileLayer.on('tileerror', function(e) {
                console.warn('Tile loading error:', e);
            });
            
            // Custom icons
            const userIcon = L.divIcon({
                html: '<div style="background-color: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                className: 'custom-div-icon'
            });
            
            const destinationIcon = L.divIcon({
                html: '<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                className: 'custom-div-icon'
            });
            
            ${userLocation ? `
            // Add user location marker
            const userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
                icon: userIcon
            }).addTo(map);
            
            userMarker.bindPopup(
                '<div class="custom-popup">' +
                '<div class="popup-title">Your Location</div>' +
                '<div class="popup-description">You are here</div>' +
                '</div>'
            );
            ` : ''}
            
            // Add destination marker
            const destinationMarker = L.marker([${destination.latitude}, ${destination.longitude}], {
                icon: destinationIcon
            }).addTo(map);
            
            destinationMarker.bindPopup(
                '<div class="custom-popup">' +
                '<div class="popup-title">${destination.name}</div>' +
                ${destination.description ? `'<div class="popup-description">${destination.description}</div>' +` : ''}
                '</div>'
            );
            
            ${routeCoordinates.length > 0 ? `
            // Add route polyline
            const routeCoords = ${JSON.stringify(routeCoordinates.map(coord => [coord.latitude, coord.longitude]))};
            
            const routePolyline = L.polyline(routeCoords, {
                color: '#1E40AF',
                weight: 4,
                opacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(map);
            
            // Fit map to show entire route
            ${userLocation ? `
            const bounds = L.latLngBounds([
                [${userLocation.latitude}, ${userLocation.longitude}],
                [${destination.latitude}, ${destination.longitude}]
            ]);
            map.fitBounds(bounds, { padding: [20, 20] });
            ` : `
            map.fitBounds(routePolyline.getBounds(), { padding: [20, 20] });
            `}
            ` : userLocation ? `
            // Fit map to show both markers
            const bounds = L.latLngBounds([
                [${userLocation.latitude}, ${userLocation.longitude}],
                [${destination.latitude}, ${destination.longitude}]
            ]);
            map.fitBounds(bounds, { padding: [20, 20] });
            ` : ''}
            
            // Handle map events
            map.on('load', function() {
                console.log('Map loaded successfully');
            });
            
            map.on('error', function(e) {
                console.error('Map error:', e);
            });
            
            // Disable context menu
            map.on('contextmenu', function(e) {
                e.originalEvent.preventDefault();
                return false;
            });
            
            // Communication with React Native (if needed)
            window.mapReady = true;
            
            // Expose functions for React Native communication
            window.updateUserLocation = function(lat, lng) {
                if (window.userMarker) {
                    window.userMarker.setLatLng([lat, lng]);
                }
            };
            
            window.showFallbackMessage = function(message) {
                const banner = document.querySelector('.fallback-banner');
                const messageSpan = banner.querySelector('.banner-content span:last-child');
                messageSpan.textContent = message;
                banner.style.display = 'block';
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    banner.style.display = 'none';
                }, 5000);
            };
            
        </script>
    </body>
    </html>
    `;
  }

  /**
   * Calculate appropriate zoom level based on distance between points
   */
  private static calculateZoomLevel(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const distance = this.calculateDistance(point1, point2);
    
    // Zoom levels based on distance (in km)
    if (distance < 1) return 15;        // Very close
    if (distance < 5) return 13;        // Close
    if (distance < 10) return 12;       // Nearby
    if (distance < 25) return 11;       // Medium distance
    if (distance < 50) return 10;       // Far
    if (distance < 100) return 9;       // Very far
    return 8;                           // Extremely far
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Generate simple map HTML without route (for basic location display)
   */
  static generateSimpleMapHTML(
    latitude: number, 
    longitude: number, 
    title: string = 'Location',
    description?: string
  ): string {
    return this.generateMapHTML({
      destination: {
        latitude,
        longitude,
        name: title,
        description
      }
    });
  }
}
