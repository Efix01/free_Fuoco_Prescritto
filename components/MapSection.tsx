'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';

// Fix icon default di Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapControllerProps {
    onAreaDrawn: (geojson: any) => void;
}

function MapController({ onAreaDrawn }: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        // Attiva i controlli Geoman (Disegno)
        // @ts-ignore - pm types might be missing or not perfectly aligned
        if (map.pm) {
            map.pm.addControls({
                position: 'topleft',
                drawPolygon: true,
                drawCircle: false,
                drawPolyline: false,
                drawRectangle: false,
                drawMarker: false,
                editMode: true,
                dragMode: false,
                cutPolygon: false,
                removalMode: true,
            });

            // Evento quando finisci di disegnare
            map.on('pm:create', (e: any) => {
                const layer = e.layer;
                const geoJSON = layer.toGeoJSON();
                onAreaDrawn(geoJSON);
            });
        }

    }, [map, onAreaDrawn]);

    return null;
}

interface MapSectionProps {
    onAreaDrawn: (geojson: any) => void;
}

export default function MapSection({ onAreaDrawn }: MapSectionProps) {
    // Coordinate iniziali (Sardegna Centro)
    const center: L.LatLngExpression = [40.1209, 9.0129];

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border-2 border-green-700 shadow-lg relative z-0">
            <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController onAreaDrawn={onAreaDrawn} />
            </MapContainer>
        </div>
    );
}
