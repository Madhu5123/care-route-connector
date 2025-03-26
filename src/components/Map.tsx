import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api";
import { AmbulanceData, subscribeToAmbulanceLocations } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default map center (India)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

// Map libraries needed
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places", "geometry"];

interface MapProps {
  ambulanceMode?: boolean;
  onRouteCalculated?: (route: google.maps.DirectionsResult) => void;
  destination?: { lat: number; lng: number; name: string } | null;
  showAmbulances?: boolean;
  className?: string;
}

const Map: React.FC<MapProps> = ({
  ambulanceMode = false,
  onRouteCalculated,
  destination = null,
  showAmbulances = true,
  className = "",
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with your Google Maps API key
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceData | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const locationWatchId = useRef<number | null>(null);

  // Load ambulance data from Firebase
  useEffect(() => {
    if (!showAmbulances) return;

    const unsubscribe = subscribeToAmbulanceLocations((data) => {
      setAmbulances(data);
    });

    return () => unsubscribe();
  }, [showAmbulances]);

  // Watch user's current location
  useEffect(() => {
    if (!isLoaded) return;

    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);

          // If in ambulance mode, recalculate directions when location changes
          if (ambulanceMode && destination && map) {
            calculateRoute(newLocation, destination);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [isLoaded, ambulanceMode, destination, map]);

  // Initialize directions service
  useEffect(() => {
    if (isLoaded && !directionsService.current) {
      directionsService.current = new google.maps.DirectionsService();
    }
  }, [isLoaded]);

  // Calculate route when destination changes
  useEffect(() => {
    if (isLoaded && userLocation && destination && directionsService.current) {
      calculateRoute(userLocation, destination);
    }
  }, [isLoaded, userLocation, destination]);

  // Calculate route between two points
  const calculateRoute = useCallback(
    (origin: google.maps.LatLngLiteral, dest: { lat: number; lng: number }) => {
      if (!directionsService.current) return;

      directionsService.current.route(
        {
          origin,
          destination: dest,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (onRouteCalculated) {
              onRouteCalculated(result);
            }
            
            // Find the fastest route considering traffic
            let fastestRoute = 0;
            let shortestTime = Infinity;
            
            result.routes.forEach((route, index) => {
              const duration = route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value;
              if (duration < shortestTime) {
                shortestTime = duration;
                fastestRoute = index;
              }
            });
            
            // Apply the fastest route
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map,
              directions: result,
              routeIndex: fastestRoute,
              polylineOptions: {
                strokeColor: "#4285F4",
                strokeWeight: 6,
                strokeOpacity: 0.8,
              },
            });
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    },
    [map, onRouteCalculated]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  if (loadError) {
    return <div className="p-4 text-red-500">Error loading maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden shadow-lg ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={userLocation ? 15 : 5}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ lightness: 20 }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ visibility: "simplified" }, { lightness: 10 }],
            },
            {
              featureType: "road",
              elementType: "labels.text",
              stylers: [{ visibility: "on" }],
            },
          ],
        }}
        onLoad={onMapLoad}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: ambulanceMode ? "#E53935" : "#1976D2",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
            animation={google.maps.Animation.DROP}
          />
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={{ lat: destination.lat, lng: destination.lng }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
            title={destination.name}
          />
        )}

        {/* Ambulance markers */}
        {showAmbulances && ambulances.map((ambulance) => (
          ambulance.currentLocation && (
            <Marker
              key={ambulance.id}
              position={{
                lat: ambulance.currentLocation.lat,
                lng: ambulance.currentLocation.lng,
              }}
              icon={{
                path: "M 10,0 L 14,5 L 14,25 L 6,25 L 6,5 Z",
                fillColor: "#E53935",
                fillOpacity: 1,
                strokeColor: "#B71C1C",
                strokeWeight: 1,
                scale: 1.2,
                anchor: new google.maps.Point(10, 25),
              }}
              onClick={() => setSelectedAmbulance(ambulance)}
            />
          )
        ))}

        {/* Info window for selected ambulance */}
        {selectedAmbulance && selectedAmbulance.currentLocation && (
          <InfoWindow
            position={{
              lat: selectedAmbulance.currentLocation.lat,
              lng: selectedAmbulance.currentLocation.lng,
            }}
            onCloseClick={() => setSelectedAmbulance(null)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-medium text-sm">Ambulance #{selectedAmbulance.vehicleId}</h3>
              <p className="text-xs mt-1">Status: {selectedAmbulance.status}</p>
              {selectedAmbulance.patientInfo && (
                <div className="mt-1">
                  <p className="text-xs font-semibold">Patient Severity:</p>
                  <p className={`text-xs ${
                    selectedAmbulance.patientInfo.severity === 'critical' ? 'text-red-500' :
                    selectedAmbulance.patientInfo.severity === 'high' ? 'text-orange-500' :
                    selectedAmbulance.patientInfo.severity === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {selectedAmbulance.patientInfo.severity.toUpperCase()}
                  </p>
                </div>
              )}
              {selectedAmbulance.destination && (
                <p className="text-xs mt-1">
                  To: {selectedAmbulance.destination.name}
                </p>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Show directions */}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>

      {/* Map overlay for attribution */}
      <div className="absolute bottom-1 left-1 bg-white/80 text-xs px-1 rounded">
        Map data ©{new Date().getFullYear()} Google
      </div>
    </div>
  );
};

export default Map;
