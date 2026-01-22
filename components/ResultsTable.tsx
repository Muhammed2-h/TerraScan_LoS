import React from 'react';
import { Download, CheckCircle2, XCircle, ChevronRight, AlertCircle, Navigation } from 'lucide-react';
import { AnalysisResult } from '../types';
import Papa from 'papaparse';

interface ResultsTableProps {
  results: AnalysisResult[];
  onSelectResult: (res: AnalysisResult) => void;
  selectedId: string | null;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, onSelectResult, selectedId }) => {
  const downloadResults = () => {
    const exportData = results.map(r => ({
      ID: r.id,
      Source_Descriptor: r.nameA || "Source",
      Source_Latitude: r.pointA.lat,
      Source_Longitude: r.pointA.lng,
      Target_Descriptor: r.nameB || "Target",
      Target_Latitude: r.pointB.lat,
      Target_Longitude: r.pointB.lng,
      Status: r.status,
      Distance_Meters: r.distance,
      Max_Obstruction_Meters: r.maxObstructionHeight.toFixed(2),
      K_Factor: r.settings?.kFactor || "1.333",
      Earth_Radius_Meters: r.settings?.earthRadius || "6371000",
      Error_Log: r.errorMessage || "N/A"
    }));

    const csv = Papa.unparse(exportData);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `terrascan_export_${timestamp}.csv`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="p-6 bg-white/40 border-b border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-black text-slate-800 text-lg tracking-tight">Analysis Archive</h3>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Registry of Calculated Terrain Links</p>
        </div>
        <button
          onClick={downloadResults}
          className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-slate-900/10 transition-all active:scale-95 shadow-lg"
        >
          <Download size={16} /> Export Data Pack
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-white/20 backdrop-blur-md">
            <tr>
              <th className="px-8 py-5">Origin/Node Details</th>
              <th className="px-8 py-5">Source Coords</th>
              <th className="px-8 py-5">Target Coords</th>
              <th className="px-8 py-5">Metrics</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {results.map((res) => (
              <tr
                key={res.id}
                className={`group transition-all cursor-pointer ${selectedId === res.id ? 'bg-blue-600 shadow-xl scale-[1.005] z-10 relative' : 'hover:bg-white/50'}`}
                onClick={() => onSelectResult(res)}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${selectedId === res.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all'}`}>
                      <Navigation size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-black tracking-tight text-sm ${selectedId === res.id ? 'text-white' : 'text-slate-800'}`}>
                        {res.nameA || 'Source'} <span className={selectedId === res.id ? 'text-white/60' : 'text-slate-400'}>→</span> {res.nameB || 'Target'}
                      </span>
                      <span className={`text-[9px] font-black tracking-widest uppercase mt-0.5 ${selectedId === res.id ? 'text-white/60' : 'text-slate-400'}`}>{res.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-0.5">
                    <span className={`font-mono text-[10px] font-black ${selectedId === res.id ? 'text-white' : 'text-slate-500'}`}>{res.pointA.lat.toFixed(5)}</span>
                    <span className={`font-mono text-[10px] font-black ${selectedId === res.id ? 'text-white/70' : 'text-slate-400'}`}>{res.pointA.lng.toFixed(5)}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-0.5">
                    <span className={`font-mono text-[10px] font-black ${selectedId === res.id ? 'text-white' : 'text-slate-500'}`}>{res.pointB.lat.toFixed(5)}</span>
                    <span className={`font-mono text-[10px] font-black ${selectedId === res.id ? 'text-white/70' : 'text-slate-400'}`}>{res.pointB.lng.toFixed(5)}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className={`font-mono text-xs font-black ${selectedId === res.id ? 'text-white' : 'text-slate-600'}`}>
                      {res.status === 'Error' ? '-' : `${(res.distance / 1000).toFixed(2)} km`}
                    </span>
                    {res.status !== 'Error' && res.maxObstructionHeight > 0 && (
                      <span className={`text-[9px] font-black uppercase tracking-widest ${selectedId === res.id ? 'text-white/60' : 'text-red-500'}`}>
                        Obst: {res.maxObstructionHeight.toFixed(1)}m
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  {res.status === 'Clear' ? (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedId === res.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm'}`}>
                      <CheckCircle2 size={14} /> Clear
                    </span>
                  ) : res.status === 'Blocked' ? (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedId === res.id ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 border border-red-100/50 shadow-sm'}`}>
                      <XCircle size={14} /> Blocked
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedId === res.id ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-100/50 shadow-sm'}`} title={res.errorMessage}>
                      <AlertCircle size={14} /> Failed
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectResult(res);
                    }}
                    className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${selectedId === res.id ? 'text-white bg-white/10 px-4 py-2 rounded-xl shadow-lg' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    Details <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
