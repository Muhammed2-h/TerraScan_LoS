
import React, { useEffect, useState, useRef, memo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import {
  Maximize2, Minimize2, Eye, EyeOff,
  Compass, ChevronDown, ChevronUp, Map as MapIcon,
  Activity, Settings2, ChevronRight, Plus, Minus, Home, Layers
} from 'lucide-react';
import { AnalysisResult, Coordinate } from '../types';

// Add missing MapLayerType definition
export type MapLayerType = 'normal' | 'satellite' | 'hybrid';

// Add missing TerrainMapProps interface definition
export interface TerrainMapProps {
  results: AnalysisResult[];
  selectedId: string | null;
  focusPoint: Coordinate | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  pickingMode: 'pointA' | number | null;
  onLocationConfirm: (coord: Coordinate) => void;
  onPickingCancel: () => void;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const sharedCanvasRenderer = L.canvas({ padding: 0.5 });

const MapEvents = memo(({ active, onMapClick }: { active: boolean; onMapClick: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng);
    },
  });
  return null;
});

const LinksLayer = memo(({ results, selectedId }: { results: AnalysisResult[]; selectedId: string | null }) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [map]);

  useEffect(() => {
    if (!layerRef.current) return;
    const layerGroup = layerRef.current;

    polylinesRef.current.forEach(p => layerGroup.removeLayer(p));
    polylinesRef.current.clear();

    results.forEach(res => {
      const isSelected = res.id === selectedId;
      const poly = L.polyline(
        [[res.pointA.lat, res.pointA.lng], [res.pointB.lat, res.pointB.lng]],
        {
          renderer: sharedCanvasRenderer,
          color: res.status === 'Blocked' ? '#ef4444' : '#22c55e',
          weight: isSelected ? 6 : 3,
          opacity: isSelected ? 1.0 : 0.6,
          smoothFactor: 2.0,
          interactive: true
        }
      ).bindPopup(`<div class="p-1 min-w-[120px]"><div class="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Path Detail</div><div class="text-xs font-bold text-slate-800">${res.nameA || 'Source'} → ${res.nameB || 'Target'}</div><div class="text-[9px] mt-1 font-mono text-slate-500">${(res.distance / 1000).toFixed(2)} km</div></div>`);
      poly.addTo(layerGroup);
      polylinesRef.current.set(res.id, poly);
      if (isSelected) poly.bringToFront();
    });
  }, [results, selectedId, map]);

  return null;
});

const ClusterMarkers = memo(({ results }: { results: AnalysisResult[] }) => {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    const leaflet = L as any;
    if (!leaflet.markerClusterGroup) return;
    const clusterGroup = leaflet.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 40, chunkedLoading: true, disableClusteringAtZoom: 16, spiderfyOnMaxZoom: true, removeOutsideVisibleBounds: true
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);
    return () => { map.removeLayer(clusterGroup); };
  }, [map]);

  useEffect(() => {
    if (!clusterGroupRef.current) return;
    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();

    const markers: L.Marker[] = [];
    results.forEach(res => {
      markers.push(L.marker([res.pointA.lat, res.pointA.lng], { icon: blueIcon }).bindPopup(`<b>${res.nameA || 'Source'}</b>`));
      markers.push(L.marker([res.pointB.lat, res.pointB.lng], { icon: greenIcon }).bindPopup(`<b>${res.nameB || 'Target'}</b>`));
      if (res.maxObstructionPoint && res.status === 'Blocked') {
        markers.push(L.marker([res.maxObstructionPoint.lat, res.maxObstructionPoint.lng], { icon: redIcon }).bindPopup(`<b>Obstruction:</b> ${res.maxObstructionHeight.toFixed(1)}m`));
      }
    });
    clusterGroup.addLayers(markers);
  }, [results]);

  return null;
});

const MapControls = memo(({ isExpanded, results, selectedId, focusPoint }: any) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [isExpanded, map]);

  useEffect(() => {
    if (focusPoint && !isNaN(focusPoint.lat) && !isNaN(focusPoint.lng)) {
      map.flyTo([focusPoint.lat, focusPoint.lng], 16, { duration: 1.5 });
    }
  }, [focusPoint, map]);

  useEffect(() => {
    if (selectedId) {
      const res = results.find((r: any) => r.id === selectedId);
      if (res) {
        const bounds = L.latLngBounds([[res.pointA.lat, res.pointA.lng], [res.pointB.lat, res.pointB.lng]]);
        map.flyToBounds(bounds, { padding: [100, 100], duration: 1.5 });
      }
    }
  }, [selectedId, results, map]);

  return null;
});

const MapToolbar = ({
  layerType, setLayerType,
  showLegend, setShowLegend,
  isExpanded, onToggleExpand
}: any) => {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleHome = () => map.setView([10.5, 76.5], 7, { animate: true });

  const cycleLayer = () => {
    if (layerType === 'normal') setLayerType('satellite');
    else if (layerType === 'satellite') setLayerType('hybrid');
    else setLayerType('normal');
  };

  const Btn = ({ icon: Icon, onClick, active, title }: any) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`p-2 rounded-lg transition-all duration-300 ${active ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
    >
      <Icon size={18} strokeWidth={active ? 3 : 2} />
    </button>
  );

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5">
      <Btn icon={Layers} onClick={cycleLayer} active={layerType !== 'normal'} title={`Layer: ${layerType}`} />
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <Btn icon={Plus} onClick={handleZoomIn} title="Zoom In" />
      <Btn icon={Minus} onClick={handleZoomOut} title="Zoom Out" />
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <Btn icon={showLegend ? Eye : EyeOff} onClick={() => setShowLegend(!showLegend)} active={showLegend} title="Toggle HUD" />
      <Btn icon={isExpanded ? Minimize2 : Maximize2} onClick={onToggleExpand} active={isExpanded} title="Fullscreen" />
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <Btn icon={Home} onClick={handleHome} title="Reset View" />
    </div>
  );
};

export const TerrainMap: React.FC<TerrainMapProps> = ({
  results, selectedId, focusPoint, isExpanded, onToggleExpand,
  pickingMode, onLocationConfirm, onPickingCancel
}) => {
  const INITIAL_CENTER: [number, number] = [10.5, 76.5];
  const [showLegend, setShowLegend] = useState(true);
  const [layerType, setLayerType] = useState<MapLayerType>('normal');
  const [tempPickCoord, setTempPickCoord] = useState<Coordinate | null>(null);

  const handleMapClick = (latlng: L.LatLng) => {
    if (pickingMode !== null) {
      const coord = { lat: latlng.lat, lng: latlng.lng };
      setTempPickCoord(coord);
      onLocationConfirm(coord);
    }
  };

  return (
    <div className={`h-full w-full relative rounded-[3rem] overflow-hidden bg-slate-50 ${pickingMode !== null ? 'cursor-crosshair' : ''}`}>
      <MapContainer center={INITIAL_CENTER} zoom={7} className="h-full w-full" preferCanvas={true} zoomControl={false}>
        {layerType === 'normal' && <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
        {(layerType === 'satellite' || layerType === 'hybrid') && <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />}
        {layerType === 'hybrid' && <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />}

        {focusPoint && !isNaN(focusPoint.lat) && !isNaN(focusPoint.lng) && (
          <Marker position={[focusPoint.lat, focusPoint.lng]} icon={goldIcon} />
        )}

        {tempPickCoord && <Marker position={[tempPickCoord.lat, tempPickCoord.lng]} icon={goldIcon} />}

        <MapEvents active={pickingMode !== null} onMapClick={handleMapClick} />
        <LinksLayer results={results} selectedId={selectedId} />
        <ClusterMarkers results={results} />
        <MapControls isExpanded={isExpanded} results={results} selectedId={selectedId} focusPoint={focusPoint} />

        <MapToolbar
          layerType={layerType}
          setLayerType={setLayerType}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      </MapContainer>

      {/* Legend - Standard Size for Readability */}
      <div className={`absolute bottom-6 left-6 z-[1000] bg-white/80 backdrop-blur-3xl p-4 rounded-[1.5rem] shadow-2xl border border-white/90 flex flex-col gap-3 transition-all duration-700 transform ${showLegend && pickingMode === null ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'} w-44`}>
        <div className="flex justify-between items-center border-b border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <Compass size={12} className="text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-black">Legend</span>
          </div>
          <button onClick={() => setShowLegend(false)} className="text-black hover:text-red-500"><ChevronDown size={14} /></button>
        </div>
        <div className="grid grid-cols-1 gap-y-2 px-1">
          <LegendItem color="bg-blue-500" label="Source" />
          <LegendItem color="bg-green-500" label="Target" />
          <LegendItem color="bg-red-500" label="Blocked" />
          <div className="h-px bg-black/5 my-0.5"></div>
          <LegendLine color="bg-green-500/80" label="Clear" />
          <LegendLine color="bg-red-500/80" label="Blocked" />
        </div>
      </div>
    </div>
  );
};

const LegendItem = memo(({ color, label }: any) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
    <span className="text-[8px] font-black uppercase text-black tracking-widest">{label}</span>
  </div>
));

const LegendLine = memo(({ color, label }: any) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-5 h-0.5 rounded-full ${color}`}></div>
    <span className="text-[8px] font-black uppercase text-black tracking-widest">{label}</span>
  </div>
));
