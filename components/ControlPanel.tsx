import React, { useState } from 'react';
import { Lock, Unlock, Upload, Play, MapPin, Trash2, FileText, Plus, X, Terminal, AlertCircle, Settings2, DownloadCloud, LocateFixed, Edit2 } from 'lucide-react';
import Papa from 'papaparse';
import { Coordinate } from '../types';

interface ControlPanelProps {
  pointA: Coordinate;
  targets: Coordinate[];
  lockA: boolean;
  lockB: boolean;
  kFactor: number;
  onUpdatePointA: (coord: Partial<Coordinate>) => void;
  onUpdateTarget: (index: number, coord: Partial<Coordinate>) => void;
  onUpdateKFactor: (val: number) => void;
  onAddTarget: () => void;
  onRemoveTarget: (index: number) => void;
  onToggleLock: (key: 'lockA' | 'lockB') => void;
  onAnalyze: (batch?: { pointA: Coordinate; pointB: Coordinate }[]) => void;
  onFocusPoint: (coord: Coordinate) => void;
  onStartPicking: (target: 'pointA' | number) => void;
  isAnalyzing: boolean;
  onClear: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  pointA, targets, lockA, lockB, kFactor, onUpdatePointA, onUpdateTarget, onUpdateKFactor, onAddTarget, onRemoveTarget, onToggleLock, onAnalyze, onFocusPoint, onStartPicking, isAnalyzing, onClear
}) => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvError(null);
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setCsvError("The uploaded CSV is empty.");
            return;
          }
          setCsvHeaders(results.meta.fields || []);
          setCsvData(results.data);
        },
        error: (err) => {
          setCsvError(`CSV Parse Error: ${err.message}`);
        }
      });
    }
  };

  const inputClasses = "w-full p-3.5 bg-white/50 border border-white/90 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300 disabled:opacity-50 shadow-sm backdrop-blur-xl selection:bg-blue-100";

  const IconButton = ({ icon: Icon, onClick, active, color = "blue", title }: any) => {
    const variants: Record<string, string> = {
      blue: active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-blue-600 hover:bg-white',
      emerald: active ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-emerald-600 hover:bg-white',
      amber: active ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-amber-500 hover:bg-white',
      indigo: active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-indigo-600 hover:bg-white',
      red: 'bg-white/60 text-slate-400 hover:text-red-600 hover:bg-white',
    };

    return (
      <button 
        onClick={onClick}
        title={title}
        className={`p-2.5 rounded-2xl transition-all duration-300 active:scale-90 border border-white/50 shadow-sm ${variants[color]}`}
      >
        <Icon size={18} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-8 p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-4">
          <div className="bg-blue-600/10 p-2.5 rounded-2xl text-blue-600 border border-blue-600/10">
            <MapPin size={22} />
          </div>
          Scenario Configuration
        </h2>
        <div className="flex gap-2">
          <IconButton icon={Settings2} active={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)} title="Toggle Settings" />
          <IconButton icon={Trash2} color="red" onClick={onClear} title="Clear Workspace" />
        </div>
      </div>

      {showAdvanced && (
        <div className="p-6 bg-blue-500/[0.03] backdrop-blur-3xl rounded-[2rem] border border-blue-500/10 shadow-inner animate-in fade-in slide-in-from-top-4">
           <span className="text-[9px] font-black text-blue-600/50 uppercase tracking-[0.3em] flex items-center gap-2 mb-5">Physics Calibration</span>
           <div className="flex justify-between items-center mb-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block">Atmospheric k-Factor</label>
              <span className="text-xs font-mono font-black text-blue-700 bg-white/90 px-3.5 py-1.5 rounded-full shadow-sm ring-1 ring-blue-50">{kFactor.toFixed(3)}</span>
            </div>
            <input 
              type="range" min="0.5" max="2.0" step="0.001" value={kFactor} 
              onChange={e => onUpdateKFactor(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/50 rounded-full appearance-none cursor-pointer accent-blue-600 transition-all hover:bg-slate-300/50"
            />
        </div>
      )}

      {csvError && (
        <div className="bg-red-500/5 backdrop-blur-3xl border border-red-500/10 p-5 rounded-[2rem] flex items-start gap-4 text-red-700 animate-in fade-in zoom-in shadow-xl shadow-red-900/[0.02]">
          <AlertCircle size={22} className="mt-0.5 flex-shrink-0 text-red-500" />
          <p className="text-xs font-black leading-relaxed uppercase tracking-tight">{csvError}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-700 ${lockA ? 'border-blue-500/30 bg-blue-500/[0.02] backdrop-blur-3xl' : 'border-white bg-white/20 hover:border-blue-200/50'}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] opacity-90">Source Point (A)</span>
            <div className="flex gap-2">
              <IconButton icon={Edit2} color="indigo" onClick={() => onStartPicking('pointA')} title="Edit on Map" />
              <IconButton icon={LocateFixed} color="amber" onClick={() => onFocusPoint(pointA)} title="Locate & Confirm" />
              <IconButton icon={lockA ? Lock : Unlock} active={lockA} onClick={() => onToggleLock('lockA')} title="Lock" />
            </div>
          </div>
          <div className="space-y-5">
            <input type="text" placeholder="Descriptor" value={pointA.name || ''} onChange={e => onUpdatePointA({ name: e.target.value })} className={inputClasses} disabled={isAnalyzing} />
            <div className="grid grid-cols-2 gap-5">
              <input type="number" step="any" value={pointA.lat} onChange={e => onUpdatePointA({ lat: parseFloat(e.target.value) })} className={inputClasses} disabled={isAnalyzing} />
              <input type="number" step="any" value={pointA.lng} onChange={e => onUpdatePointA({ lng: parseFloat(e.target.value) })} className={inputClasses} disabled={isAnalyzing} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 px-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-70">Remote Nodes ({targets.length})</span>
          <button onClick={onAddTarget} className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all duration-500 flex items-center justify-center border border-white/20">
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {targets.map((target, index) => (
            <div key={index} className={`p-6 rounded-[2.5rem] border-2 transition-all duration-700 ${lockB && index === 0 ? 'border-emerald-500/30 bg-emerald-500/[0.02] backdrop-blur-3xl' : 'border-white bg-white/20 hover:border-emerald-200/50'}`}>
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] opacity-90">Node {index + 1}</span>
                <div className="flex items-center gap-2">
                  <IconButton icon={Edit2} color="indigo" onClick={() => onStartPicking(index)} title="Edit on Map" />
                  <IconButton icon={LocateFixed} color="amber" onClick={() => onFocusPoint(target)} title="Locate & Confirm" />
                  {index === 0 && <IconButton icon={lockB ? Lock : Unlock} color="emerald" active={lockB} onClick={() => onToggleLock('lockB')} title="Lock Reference" />}
                  {targets.length > 1 && <IconButton icon={X} color="red" onClick={() => onRemoveTarget(index)} title="Remove" />}
                </div>
              </div>
              <div className="space-y-5">
                <input type="text" placeholder="Descriptor" value={target.name || ''} onChange={e => onUpdateTarget(index, { name: e.target.value })} className={inputClasses} disabled={isAnalyzing} />
                <div className="grid grid-cols-2 gap-5">
                  <input type="number" step="any" value={target.lat} onChange={e => onUpdateTarget(index, { lat: parseFloat(e.target.value) })} className={inputClasses} disabled={isAnalyzing} />
                  <input type="number" step="any" value={target.lng} onChange={e => onUpdateTarget(index, { lng: parseFloat(e.target.value) })} className={inputClasses} disabled={isAnalyzing} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-6 pt-10 border-t border-slate-900/5">
        <div className="relative group">
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className={`flex items-center justify-center gap-4 p-6 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 text-[11px] font-black uppercase tracking-[0.2em] ${csvData.length > 0 ? 'border-blue-600 bg-blue-600/[0.05] text-blue-700' : 'border-slate-200 bg-white/40 text-slate-400 hover:border-blue-400 hover:bg-white'}`}>
            <Upload size={24} className="opacity-30" /> {csvData.length > 0 ? `${csvData.length} Records Ingested` : 'Select CSV Batch'}
          </label>
        </div>

        <button onClick={() => onAnalyze()} disabled={isAnalyzing} className={`w-full py-6 rounded-[2.5rem] flex items-center justify-center gap-6 font-black text-white transition-all duration-700 shadow-2xl uppercase tracking-[0.3em] text-[11px] ring-1 ring-white/30 ${isAnalyzing ? 'bg-slate-400 opacity-60' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}>
          {isAnalyzing ? <><div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> Mapping Grid</> : <><Play size={24} fill="currentColor" /> Run Scenario Scan</>}
        </button>
      </div>
    </div>
  );
};
