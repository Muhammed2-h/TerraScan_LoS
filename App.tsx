import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, Globe } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { TerrainMap } from './components/TerrainMap';
import { ElevationChart } from './components/ElevationChart';
import { ResultsTable } from './components/ResultsTable';
import { AppState, AnalysisResult, Coordinate } from './types';
import { runLoSAnalysis } from './services/analysisService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    pointA: { lat: 8.5241, lng: 76.9366 },
    targets: [{ lat: 9.9312, lng: 76.2673 }],
    lockA: false,
    lockB: false,
    results: [],
    isAnalyzing: false,
    kFactor: 1.333,
    earthRadius: 6371000
  });

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [focusPoint, setFocusPoint] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickingMode, setPickingMode] = useState<'pointA' | number | null>(null);
  
  const chartSectionRef = useRef<HTMLDivElement>(null);

  // Filter valid results for the map to prevent unnecessary recalculations
  const validResults = useMemo(() => 
    state.results.filter(r => r.status !== 'Error'),
    [state.results]
  );

  useEffect(() => {
    if (selectedResult && chartSectionRef.current) {
      setTimeout(() => {
        chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedResult]);

  const handleUpdatePointA = useCallback((coord: Partial<Coordinate>) => {
    setState(prev => ({
      ...prev,
      pointA: { ...prev.pointA, ...coord }
    }));
  }, []);

  const handleUpdateTarget = useCallback((index: number, coord: Partial<Coordinate>) => {
    setState(prev => {
      const newTargets = [...prev.targets];
      newTargets[index] = { ...newTargets[index], ...coord };
      return { ...prev, targets: newTargets };
    });
  }, []);

  const handleUpdateKFactor = useCallback((val: number) => {
    setState(prev => ({ ...prev, kFactor: val }));
  }, []);

  const handleAddTarget = useCallback(() => {
    setState(prev => ({
      ...prev,
      targets: [...prev.targets, { lat: prev.targets[prev.targets.length - 1].lat + 0.1, lng: prev.targets[prev.targets.length - 1].lng + 0.1 }]
    }));
  }, []);

  const handleRemoveTarget = useCallback((index: number) => {
    setState(prev => {
      if (prev.targets.length <= 1) return prev;
      const newTargets = prev.targets.filter((_, i) => i !== index);
      return { ...prev, targets: newTargets };
    });
  }, []);

  const handleToggleLock = useCallback((key: 'lockA' | 'lockB') => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const executeAnalysis = async (batchInput?: { pointA: Coordinate; pointB: Coordinate }[]) => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);
    setFocusPoint(null);
    
    try {
      const items = batchInput || state.targets.map(t => ({ pointA: state.pointA, pointB: t }));
      
      // Process in small parallel chunks to optimize performance without hitting API limits too hard
      const CHUNK_SIZE = 3;
      const allResults: AnalysisResult[] = [];

      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.map(async (item, idx) => {
          try {
            return await runLoSAnalysis(
              `TERRA-${Date.now()}-${i + idx}`, 
              item.pointA, 
              item.pointB, 
              undefined, 
              { kFactor: state.kFactor, earthRadius: state.earthRadius }
            );
          } catch (linkErr: any) {
            return {
              id: `TERRA-ERR-${Date.now()}-${i + idx}`,
              pointA: item.pointA,
              pointB: item.pointB,
              distance: 0, 
              status: 'Error' as const,
              errorMessage: linkErr.message || "Elevation fetch failure",
              maxObstructionHeight: 0,
              profile: []
            };
          }
        });

        const results = await Promise.all(chunkPromises);
        allResults.push(...results);
        
        // Update state progressively for feedback
        setState(prev => ({
          ...prev,
          results: [...results, ...prev.results].slice(0, 500)
        }));

        if (i === 0 && results.length > 0) {
          setSelectedResult(results[0]);
        }
      }

      setState(prev => ({ ...prev, isAnalyzing: false }));
    } catch (err: any) {
      console.error(err);
      setError("Analysis process encountered a critical error.");
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleClear = () => {
    setState(prev => ({ ...prev, results: [] }));
    setSelectedResult(null);
    setFocusPoint(null);
  };

  const handleLocationConfirm = (coord: Coordinate) => {
    if (pickingMode === 'pointA') {
      handleUpdatePointA(coord);
    } else if (typeof pickingMode === 'number') {
      handleUpdateTarget(pickingMode, coord);
    }
    setPickingMode(null);
  };

  return (
    <div className="min-h-screen relative flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white bg-[#fafcff]">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <header className="bg-white/70 backdrop-blur-3xl border-b border-white/80 px-8 py-5 flex items-center justify-between sticky top-0 z-[3000] shadow-[0_4px_30px_rgba(0,0,0,0.02)] ring-1 ring-black/[0.01]">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <Globe size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              TerraScan <span className="text-blue-600 italic">LoS</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5 opacity-80">
              Advanced Terrain Intelligence
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Engine State</span>
            <span className={`text-xs font-black uppercase tracking-tight ${state.isAnalyzing ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
              {state.isAnalyzing ? 'Processing...' : 'Ready'}
            </span>
          </div>
          <div className={`p-2.5 rounded-2xl border transition-all duration-700 ${state.isAnalyzing ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
            <Activity className={`${state.isAnalyzing ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} size={20} />
          </div>
        </div>
      </header>

      <main className={`flex-1 p-6 lg:p-8 grid gap-8 h-auto lg:h-[calc(100vh-82px)] overflow-hidden ${isMapExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        <aside className={`${isMapExpanded ? 'hidden' : 'lg:col-span-3'} h-full overflow-y-auto pr-1 custom-scrollbar`}>
          <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] h-full overflow-hidden transition-all duration-500">
            <ControlPanel 
              pointA={state.pointA}
              targets={state.targets}
              lockA={state.lockA}
              lockB={state.lockB}
              kFactor={state.kFactor}
              onUpdatePointA={handleUpdatePointA}
              onUpdateTarget={handleUpdateTarget}
              onUpdateKFactor={handleUpdateKFactor}
              onAddTarget={handleAddTarget}
              onRemoveTarget={handleRemoveTarget}
              onToggleLock={handleToggleLock}
              onAnalyze={executeAnalysis}
              onFocusPoint={setFocusPoint}
              onStartPicking={setPickingMode}
              isAnalyzing={state.isAnalyzing}
              onClear={handleClear}
            />
          </div>
        </aside>

        <div className={`${isMapExpanded ? 'w-full h-full' : 'lg:col-span-9'} flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar scroll-smooth`}>
          {error && (
            <div className="bg-red-500/5 backdrop-blur-3xl border border-red-500/20 p-6 rounded-[2rem] flex items-center gap-4 text-red-700 animate-in fade-in slide-in-from-top-4 shadow-xl shadow-red-900/[0.02]">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20"><AlertTriangle size={24} /></div>
              <p className="text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className={`grid gap-8 ${isMapExpanded ? 'grid-cols-1 flex-1' : 'grid-cols-1 xl:grid-cols-2 lg:min-h-[500px]'}`}>
            <section className={`flex flex-col gap-4 ${isMapExpanded ? 'h-full flex-1' : 'min-h-[450px]'}`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-3 tracking-[0.4em] px-3 opacity-70">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div> Geospatial Map
              </h3>
              <div className="flex-1 min-h-[400px] relative rounded-[3rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-white ring-1 ring-black/5 bg-white">
                <TerrainMap 
                  results={validResults} 
                  selectedId={selectedResult?.id || null}
                  focusPoint={focusPoint}
                  isExpanded={isMapExpanded} 
                  onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
                  pickingMode={pickingMode}
                  onLocationConfirm={handleLocationConfirm}
                  onPickingCancel={() => setPickingMode(null)}
                />
              </div>
            </section>

            {!isMapExpanded && (
              <section ref={chartSectionRef} className="flex flex-col gap-4 min-h-[450px] scroll-mt-32">
                <h3 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-3 tracking-[0.4em] px-3 opacity-70">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div> Terrain Profile
                </h3>
                <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_30px_70px_rgba(0,0,0,0.04)] p-3 hover:bg-white/50 transition-all duration-500">
                  <ElevationChart result={selectedResult} />
                </div>
              </section>
            )}
          </div>

          {!isMapExpanded && (
            <section className="pb-16">
              <div className="bg-white/30 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-700 hover:bg-white/40">
                <ResultsTable 
                  results={state.results} 
                  onSelectResult={setSelectedResult}
                  selectedId={selectedResult?.id || null}
                />
              </div>
            </section>
          )}
        </div>
      </main>

      {!isMapExpanded && (
        <footer className="bg-slate-950/90 backdrop-blur-3xl text-slate-500 px-10 py-5 text-[10px] flex justify-between items-center border-t border-white/5 sticky bottom-0 z-[3000]">
          <p className="font-black tracking-[0.3em] opacity-40 uppercase">TerraScan Intelligence Labs © 2024</p>
          <div className="hidden sm:flex gap-12 font-black uppercase tracking-[0.2em] opacity-50">
            <span className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> GEO ENGINE READY</span>
            <span className="flex items-center gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> SAMPLING ACTIVE</span>
          </div>
        </footer>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.15);
          border-radius: 12px;
          border: 4px solid transparent;
          background-clip: padding-box;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.3); }
      `}</style>
    </div>
  );
};

export default App;
