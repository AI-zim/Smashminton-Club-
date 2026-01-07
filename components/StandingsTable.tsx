
import React from 'react';
import { StandingsRow } from '../types';

interface StandingsTableProps {
  title: string;
  rows: StandingsRow[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ title, rows }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 sm:mb-8">
      <div className="bg-emerald-600 px-3 py-2 sm:px-4 sm:py-3">
        <h3 className="text-white text-sm sm:text-base font-bold tracking-tight">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] sm:text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-2 py-2 sm:px-4 sm:py-3 w-8 sm:w-12 text-center">#</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Team</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">W</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Diff</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center hidden sm:table-cell">PF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={row.teamId} className={idx === 0 ? "bg-emerald-50/50" : idx === 1 ? "bg-sky-50/50" : ""}>
                <td className="px-2 py-2 sm:px-4 sm:py-3">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded-full text-[10px] sm:text-xs font-bold ${
                    idx === 0 ? 'bg-emerald-500 text-white' : 
                    idx === 1 ? 'bg-sky-500 text-white' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-slate-800 truncate max-w-[80px] sm:max-w-none">
                    {row.teamName}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold text-slate-700">{row.won}</td>
                <td className={`px-2 py-2 sm:px-4 sm:py-3 text-center font-bold ${row.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-slate-500 hidden sm:table-cell">{row.pointsFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
