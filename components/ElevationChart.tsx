import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Line, Brush, Label
} from 'recharts';
import { AnalysisResult } from '../types';
import { Eye, EyeOff, Info, AlertTriangle } from 'lucide-react';

interface ElevationChartProps {
  result: AnalysisResult | null;
}

const formatElevation = (val: number) => `${val.toFixed(0)}m`;
const formatDistance = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}km` : `${val}m`;

const CustomTooltip = ({ active, payload, label, visibleSeries }: any) => {
  if (active && payload && payload.length) {
    const terrain = payload.find((p: any) => p.dataKey === 'elevation');
    const los = payload.find((p: any) => p.dataKey === 'los');
    
    const showTerrain = terrain && visibleSeries.terrain;
    const showLoS = los && visibleSeries.los;

    if (!showTerrain && !showLoS) return null;

    const clearance = (los && terrain) ? los.value - terrain.value : null;
    const isObstructed = clearance !== null ? terrain.value > los.value : false;

    return (
      <div className="bg-white/80 backdrop-blur-xl p-4 border border-white shadow-2xl rounded-2xl text-xs min-w-[160px] animate-in fade-in zoom-in-95">
        <p className="font-black text-slate-800 mb-3 border-b border-slate-100/50 pb-2 flex justify-between items-center text-[10px] uppercase tracking-widest">
          <span>DISTANCE:</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-full">{formatDistance(label)}</span>
        </p>
        <div className="space-y-2.5 mt-1">
          {showTerrain && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></div>
                <span className="text-slate-500 font-bold uppercase text-[9px]">Ground:</span>
              </div>
              <span className="font-mono font-black text-blue-700">{formatElevation(terrain.value)}</span>
            </div>
          )}
          {showLoS && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"></div>
                <span className="text-slate-500 font-bold uppercase text-[9px]">LoS:</span>
              </div>
              <span className="font-mono font-black text-red-700">{formatElevation(los.value)}</span>
            </div>
          )}
          {showTerrain && showLoS && clearance !== null && (
            <div className={`flex justify-between items-center pt-3 border-t border-slate-100 mt-2 ${isObstructed ? 'text-red-600' : 'text-emerald-600'}`}>
              <span className="font-black uppercase text-[9px] tracking-[0.1em]">
                {isObstructed ? 'Blocked' : 'Clearance'}
              </span>
              <span className="font-mono font-black text-[11px] bg-white/50 px-2 py-0.5 rounded-lg shadow-inner">
                {isObstructed ? '!' : ''}{formatElevation(Math.abs(clearance))}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ElevationChart: React.FC<ElevationChartProps> = ({ result }) => {
  const [visibleSeries, setVisibleSeries] = useState({
    terrain: true,
    los: true
  });
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSeries = (key: 'terrain' | 'los') => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!result) {
    return (
      <div className="h-full w-full min-h-[300px] flex items-center justify-center text-slate-400 p-8 text-center bg-white/30 rounded-2xl border border-white/50">
        <div className="max-w-[280px]">
          <div className="mb-6 mx-auto w-16 h-16 rounded-3xl bg-white/50 backdrop-blur-xl flex items-center justify-center text-slate-300 shadow-xl border border-white/60">
            <Info size={32} />
          </div>
          <p className="font-black text-slate-600 uppercase tracking-[0.1em] text-sm">No analysis active</p>
          <p className="text-[10px] mt-3 text-slate-400 uppercase tracking-widest font-bold leading-relaxed">Run a new scan or pick a link from the table below to view terrain data.</p>
        </div>
      </div>
    );
  }

  if (result.status === 'Error') {
    return (
      <div className="h-full w-full min-h-[300px] flex items-center justify-center text-red-400 p-8 text-center bg-red-50/30 rounded-2xl border border-red-200/50">
        <div className="max-w-[300px]">
          <div className="mb-6 mx-auto w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center text-red-500 shadow-lg shadow-red-200">
            <AlertTriangle size={32} />
          </div>
          <p className="font-black text-red-700 uppercase tracking-[0.1em] text-sm">Scan Failure</p>
          <p className="text-[11px] mt-3 text-red-500/80 font-bold leading-relaxed bg-white/50 p-4 rounded-xl shadow-inner border border-red-100">
            {result.errorMessage || "An unexpected error occurred while mapping terrain elevations."}
          </p>
        </div>
      </div>
    );
  }

  const data = result.profile.map(p => ({
    dist: Math.round(p.distance),
    elevation: p.alt,
    los: p.losHeight,
  }));

  return (
    <div className="flex flex-col h-full min-h-[400px] p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-8">
        <div>
          <h3 className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            Terrain Profile
          </h3>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-2 ml-4">Advanced LoS Visualization</p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl p-1.5 rounded-2xl border border-white/60 shadow-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => toggleSeries('terrain')}
            className={`flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none ${
              visibleSeries.terrain 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-slate-400 hover:text-blue-500'
            }`}
          >
            {visibleSeries.terrain ? <Eye size={16} /> : <EyeOff size={16} />}
            Terrain
          </button>
          <button 
            onClick={() => toggleSeries('los')}
            className={`flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none ${
              visibleSeries.los 
                ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-200' 
                : 'bg-white text-slate-400 hover:text-red-500'
            }`}
          >
            {visibleSeries.los ? <Eye size={16} /> : <EyeOff size={16} />}
            LoS
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            
            <XAxis 
              dataKey="dist" 
              fontSize={10}
              fontWeight="900"
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : `${val}`}
              stroke="#cbd5e1"
              tick={{ fill: '#94a3b8' }}
              minTickGap={isSmallScreen ? 45 : 30}
              height={35}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis 
              fontSize={10}
              fontWeight="900"
              domain={['auto', 'auto']}
              stroke="#cbd5e1"
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(val) => `${val}m`}
              width={isSmallScreen ? 40 : 50}
              axisLine={false}
              tickLine={false}
            >
              {!isSmallScreen && (
                <Label 
                  value="Elevation (m)" 
                  angle={-90} 
                  position="insideLeft" 
                  style={{ textAnchor: 'middle', fontSize: '9px', fontWeight: '950', fill: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                  offset={-5}
                />
              )}
            </YAxis>
            
            <Tooltip 
              content={<CustomTooltip visibleSeries={visibleSeries} />} 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              isAnimationActive={false}
              offset={10}
            />
            
            {visibleSeries.terrain && (
              <Area 
                type="monotone" 
                dataKey="elevation" 
                stroke="#2563eb" 
                strokeWidth={3}
                fill="url(#colorElev)" 
                fillOpacity={1} 
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-in-out"
              />
            )}
            
            {visibleSeries.los && (
              <Line 
                type="linear" 
                dataKey="los" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={false} 
                strokeDasharray="8 5"
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-in-out"
              />
            )}

            <Brush 
              dataKey="dist" 
              height={32} 
              stroke="#e2e8f0" 
              fill="rgba(255,255,255,0.4)"
              tickFormatter={(val) => formatDistance(val)}
              className="font-black"
              travellerWidth={10}
              gap={5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 items-center gap-6">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Source (A)</span>
          <span className="text-[11px] text-slate-800 font-mono font-black bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 truncate w-full shadow-sm">
            {result.pointA.lat.toFixed(5)}, {result.pointA.lng.toFixed(5)}
          </span>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2.5 text-[10px] text-slate-500 font-black bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-sm shadow-slate-200/50">
          <div className="bg-blue-600 text-white p-1 rounded-md">
            <Info size={12} />
          </div>
          <span className="uppercase tracking-[0.1em]">SCROLL TO ZOOM</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Target (B)</span>
          <span className="text-[11px] text-slate-800 font-mono font-black bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 truncate w-full text-right shadow-sm">
            {result.pointB.lat.toFixed(5)}, {result.pointB.lng.toFixed(5)}
          </span>
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .recharts-brush-traveller {
          fill: #fff;
          stroke: #cbd5e1;
          stroke-width: 2px;
        }
      `}</style>
    </div>
  );
};
