
"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet-geometryutil';

import { Search, CloudSun, Ruler, Camera } from 'lucide-react';

// Interfaccia esposta tramite ref
export interface MapEditorHandle {
    captureMap: () => Promise<string | null>;
    getMap: () => L.Map | null;
}

interface MapEditorProps {
    onMapReady?: (map: L.Map) => void;
}

const MapEditor = forwardRef<MapEditorHandle, MapEditorProps>(({ onMapReady }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const drawnLayerRef = useRef<L.Layer | null>(null);

    const [stats, setStats] = useState({ area: 0, perimeter: 0, center: '' });
    const [weather, setWeather] = useState<{ temp: string, wind: string, humidity: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingWeather, setIsFetchingWeather] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    // Funzione per generare una mappa statica come fallback (usando OSM static)
    const generateStaticMapImage = async (map: L.Map): Promise<string | null> => {
        try {
            const center = map.getCenter();
            const zoom = map.getZoom();
            const bounds = map.getBounds();

            // Crea un canvas e disegna manualmente le tile
            const container = map.getContainer();
            const width = container.offsetWidth || 600;
            const height = container.offsetHeight || 400;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) return null;

            // Sfondo bianco
            ctx.fillStyle = '#e8e8e8';
            ctx.fillRect(0, 0, width, height);

            // Calcola le tile necessarie
            const tileSize = 256;
            const scale = Math.pow(2, zoom);

            // Centro in pixel mondo
            const worldCenterX = ((center.lng + 180) / 360) * scale * tileSize;
            const worldCenterY = ((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2) * scale * tileSize;

            // Offset dal centro
            const offsetX = width / 2;
            const offsetY = height / 2;

            // Calcola range di tile
            const minTileX = Math.floor((worldCenterX - offsetX) / tileSize);
            const maxTileX = Math.ceil((worldCenterX + offsetX) / tileSize);
            const minTileY = Math.floor((worldCenterY - offsetY) / tileSize);
            const maxTileY = Math.ceil((worldCenterY + offsetY) / tileSize);

            // Carica le tile
            const tilePromises: Promise<void>[] = [];

            for (let x = minTileX; x <= maxTileX; x++) {
                for (let y = minTileY; y <= maxTileY; y++) {
                    if (y < 0 || y >= scale) continue;
                    const tileX = ((x % scale) + scale) % scale;

                    const promise = new Promise<void>((resolve) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';

                        img.onload = () => {
                            // Posizione della tile sul canvas
                            const px = (x * tileSize) - worldCenterX + offsetX;
                            const py = (y * tileSize) - worldCenterY + offsetY;
                            ctx.drawImage(img, px, py, tileSize, tileSize);
                            resolve();
                        };

                        img.onerror = () => {
                            // Ignora errori singoli tile
                            resolve();
                        };

                        // Usa un server tile che supporta CORS
                        img.src = `https://tile.openstreetmap.org/${zoom}/${tileX}/${y}.png`;
                    });

                    tilePromises.push(promise);
                }
            }

            await Promise.all(tilePromises);

            // Disegna il poligono se presente
            if (drawnLayerRef.current && 'getLatLngs' in drawnLayerRef.current) {
                const layer = drawnLayerRef.current as L.Polygon;
                const latlngs = layer.getLatLngs()[0] as L.LatLng[];

                if (latlngs && latlngs.length > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#3388ff';
                    ctx.fillStyle = 'rgba(51, 136, 255, 0.3)';
                    ctx.lineWidth = 3;

                    latlngs.forEach((latlng, i) => {
                        // Converti coordinate in pixel
                        const px = ((latlng.lng + 180) / 360) * scale * tileSize - worldCenterX + offsetX;
                        const pyWorld = ((1 - Math.log(Math.tan(latlng.lat * Math.PI / 180) + 1 / Math.cos(latlng.lat * Math.PI / 180)) / Math.PI) / 2) * scale * tileSize;
                        const py = pyWorld - worldCenterY + offsetY;

                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    });

                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }

            // Aggiungi watermark/attribution
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(5, height - 20, 180, 18);
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.fillText('© OpenStreetMap contributors', 10, height - 8);

            return canvas.toDataURL('image/png');

        } catch (error) {
            console.error("Errore generazione mappa statica:", error);
            return null;
        }
    };

    // Espone metodi tramite il ref
    useImperativeHandle(ref, () => ({
        captureMap: async (): Promise<string | null> => {
            const map = mapInstanceRef.current;
            if (!map) {
                console.error("Map instance not available");
                return null;
            }

            setIsCapturing(true);

            try {
                // Approccio 1: Prova leaflet-image prima
                const leafletImageResult = await new Promise<string | null>((resolve) => {
                    import('leaflet-image').then((leafletImageModule) => {
                        const leafletImage = leafletImageModule.default;

                        // Timeout di 5 secondi
                        const timeout = setTimeout(() => {
                            console.warn("leaflet-image timeout");
                            resolve(null);
                        }, 5000);

                        leafletImage(map, (err: Error | null, canvas: HTMLCanvasElement) => {
                            clearTimeout(timeout);

                            if (err) {
                                console.warn("leaflet-image fallback:", err.message);
                                resolve(null);
                                return;
                            }

                            try {
                                // Verifica che il canvas non sia vuoto/corrotto
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    resolve(null);
                                    return;
                                }

                                // Controlla se il canvas ha contenuto (non tutto bianco/vuoto)
                                const imageData = ctx.getImageData(0, 0, 10, 10);
                                const hasContent = imageData.data.some((val, i) => i % 4 !== 3 && val !== 0 && val !== 255);

                                if (!hasContent) {
                                    console.warn("leaflet-image canvas appears empty");
                                    resolve(null);
                                    return;
                                }

                                const dataUrl = canvas.toDataURL('image/png');
                                resolve(dataUrl);
                            } catch (e) {
                                console.warn("leaflet-image conversion error:", e);
                                resolve(null);
                            }
                        });
                    }).catch(err => {
                        console.warn("leaflet-image import error:", err);
                        resolve(null);
                    });
                });

                if (leafletImageResult) {
                    setIsCapturing(false);
                    return leafletImageResult;
                }

                // Approccio 2: Usa il generatore statico manuale
                console.log("Using static map generator fallback...");
                const staticResult = await generateStaticMapImage(map);
                setIsCapturing(false);
                return staticResult;

            } catch (error) {
                console.error("Errore generale cattura:", error);
                setIsCapturing(false);
                return null;
            }
        },
        getMap: () => mapInstanceRef.current
    }));

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // 1. Initialize Map with preferCanvas for better capture
        const map = L.map(mapContainerRef.current, {
            preferCanvas: true
        }).setView([40.1209, 9.0129], 8);
        mapInstanceRef.current = map;

        // 2. Add Tile Layer con crossOrigin per CORS
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
            crossOrigin: 'anonymous'
        }).addTo(map);

        // 3. Fix Leaflet default icon issue
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // 4. Configure Geoman (Drawing Tools)
        map.pm.setLang('it');
        map.pm.addControls({
            position: 'topleft',
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawCircle: false,
            drawText: false,
            drawPolygon: true,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: true,
            rotateMode: false,
        });

        const handleUpdate = (e: any) => {
            const layer = e.layer || e.target;
            updateStats(layer);
        };

        // 5. Handle Drawing Events
        map.on('pm:create', (e) => {
            if (drawnLayerRef.current && drawnLayerRef.current !== e.layer) {
                map.removeLayer(drawnLayerRef.current);
            }

            drawnLayerRef.current = e.layer;
            updateStats(e.layer);

            const layer = e.layer;
            layer.on('pm:edit', handleUpdate);
            layer.on('pm:dragend', handleUpdate);
            layer.on('pm:markerdragend', handleUpdate);
            layer.on('pm:cut', handleUpdate);
        });

        map.on('pm:remove', (e) => {
            if (drawnLayerRef.current === e.layer) {
                drawnLayerRef.current = null;
                setStats({ area: 0, perimeter: 0, center: '' });
                setWeather(null);
            }
        });

        // Callback per notificare che la mappa è pronta
        if (onMapReady) {
            onMapReady(map);
        }

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [onMapReady]);

    // Helper: Extract coordinates recursively
    const getDeepLatlngs = (latlngs: any): any[] => {
        if (!Array.isArray(latlngs)) return [];
        if (latlngs.length === 0) return [];

        const first = latlngs[0];
        if (first && typeof first === 'object' && 'lat' in first && 'lng' in first) {
            return latlngs;
        }
        if (Array.isArray(first)) {
            return getDeepLatlngs(first);
        }
        return [];
    };

    // Helper: Calculate Geodesic Area (Manual Implementation)
    const calculateGeodesicArea = (latLngs: any[]) => {
        const pointsCount = latLngs.length;
        let area = 0.0;
        const d2r = Math.PI / 180;
        let p1, p2;

        if (pointsCount > 2) {
            for (let i = 0; i < pointsCount; i++) {
                p1 = latLngs[i];
                p2 = latLngs[(i + 1) % pointsCount];
                area += ((p2.lng - p1.lng) * d2r) *
                    (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
            area = area * 6378137.0 * 6378137.0 / 2.0;
        }

        return Math.abs(area);
    };

    const updateStats = (layer: any) => {
        if (!layer || !layer.getLatLngs) return;

        const rawLatlngs = layer.getLatLngs();
        const latlngs = getDeepLatlngs(rawLatlngs);

        if (!latlngs || latlngs.length < 3) {
            setStats(prev => ({ ...prev, area: 0, perimeter: 0 }));
            return;
        }

        try {
            // Area Calculation (Manual Geodesic)
            const areaSqMeters = calculateGeodesicArea(latlngs);
            const areaHa = areaSqMeters / 10000;

            // Perimeter Calculation
            let perimeterMeters = 0;
            for (let i = 0; i < latlngs.length; i++) {
                const p1 = new L.LatLng(latlngs[i].lat, latlngs[i].lng);
                const p2 = new L.LatLng(latlngs[i < latlngs.length - 1 ? i + 1 : 0].lat, latlngs[i < latlngs.length - 1 ? i + 1 : 0].lng);
                perimeterMeters += p1.distanceTo(p2);
            }

            // Center
            const bounds = layer.getBounds();
            const center = bounds.getCenter();

            setStats({
                area: parseFloat(areaHa.toFixed(2)),
                perimeter: Math.floor(perimeterMeters),
                center: `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
            });

        } catch (err) {
            console.error("Error calculating stats:", err);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newCenter = [parseFloat(lat), parseFloat(lon)] as [number, number];

                mapInstanceRef.current?.setView(newCenter, 14);

                L.marker(newCenter)
                    .addTo(mapInstanceRef.current!)
                    .bindPopup(display_name)
                    .openPopup();

                setSearchQuery('');
            } else {
                alert("Luogo non trovato");
            }
        } catch (e) {
            console.error(e);
            alert("Errore ricerca");
        } finally {
            setIsSearching(false);
        }
    };

    const handleGetWeather = async () => {
        if (!drawnLayerRef.current) {
            alert("Disegna prima un'area sulla mappa!");
            return;
        }

        setIsFetchingWeather(true);
        try {
            // @ts-ignore
            const center = drawnLayerRef.current.getBounds().getCenter();

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${center.lat}&longitude=${center.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`);
            const data = await res.json();

            if (data.current) {
                setWeather({
                    temp: data.current.temperature_2m + " " + data.current_units.temperature_2m,
                    wind: data.current.wind_speed_10m + " " + data.current_units.wind_speed_10m + " (" + data.current.wind_direction_10m + "°)",
                    humidity: data.current.relative_humidity_2m + " " + data.current_units.relative_humidity_2m
                });
            }
        } catch (e) {
            console.error(e);
            alert("Errore Meteo");
        } finally {
            setIsFetchingWeather(false);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            <div
                ref={mapContainerRef}
                className="flex-grow z-0"
                style={{ minHeight: '100%', height: '100%' }}
            />

            {/* Indicatore cattura in corso */}
            {isCapturing && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[2000]">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                        <Camera className="animate-pulse text-green-600" size={20} />
                        <span className="font-medium">Cattura mappa...</span>
                    </div>
                </div>
            )}

            <div className="absolute top-4 right-4 z-[1000] w-80 flex flex-col gap-4 pointer-events-none">
                <div className="glass-card p-2 rounded-xl pointer-events-auto flex gap-2">
                    <input
                        type="text"
                        placeholder="Cerca località..."
                        className="flex-grow bg-transparent outline-none px-2 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="p-2 bg-[var(--primary)] text-white rounded-lg hover:brightness-110"
                        disabled={isSearching}
                    >
                        <Search size={16} />
                    </button>
                </div>

                <div className="glass-card p-4 rounded-xl pointer-events-auto space-y-4">
                    <div className="flex items-center gap-2 text-[var(--primary)] border-b border-[var(--glass-border)] pb-2">
                        <Ruler size={18} />
                        <h3 className="font-bold text-sm">Dati Area</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="opacity-70">Superficie:</div>
                        <div className="font-bold text-right">{stats.area} Ha</div>

                        <div className="opacity-70">Perimetro:</div>
                        <div className="font-bold text-right">{stats.perimeter} m</div>

                        <div className="opacity-70 col-span-2 text-xs font-mono mt-1 text-center">
                            {stats.center || "Disegna un'area per iniziare"}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                <CloudSun size={14} />
                                METEO LOCALE
                            </div>
                            <button
                                onClick={handleGetWeather}
                                className="text-[10px] bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:brightness-95"
                                disabled={isFetchingWeather}
                            >
                                {isFetchingWeather ? '...' : 'Aggiorna'}
                            </button>
                        </div>

                        {weather ? (
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Vento:</span>
                                    <span className="font-bold">{weather.wind}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Temp:</span>
                                    <span className="font-bold">{weather.temp}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Umidità:</span>
                                    <span className="font-bold">{weather.humidity}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] opacity-60 text-center py-1">
                                Nessun dato meteo
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

MapEditor.displayName = 'MapEditor';

export default MapEditor;
