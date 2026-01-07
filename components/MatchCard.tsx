
import React, { memo } from 'react';
import { Match, Team } from '../types';

interface MatchCardProps {
  match: Match;
  teams: Team[];
  onScoreChange: (matchId: string, setIdx: number, s1: number | null, s2: number | null) => void;
  isReadOnly?: boolean;
}

interface ScoreDisplayProps {
  value: number | null;
  setIdx: number;
  isTeam1: boolean;
  winner: boolean;
  isReadOnly: boolean;
  handleInput: (setIdx: number, isTeam1: boolean, value: string) => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  value, 
  setIdx, 
  isTeam1, 
  winner, 
  isReadOnly, 
  handleInput 
}) => {
  if (isReadOnly) {
    return (
      <div className={`w-full h-9 flex items-center justify-center font-black rounded border-2 text-xs sm:text-sm ${
          winner 
          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
          {value ?? '-'}
      </div>
    );
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value ?? ''}
      onChange={(e) => handleInput(setIdx, isTeam1, e.target.value)}
      className={`w-full h-9 text-center font-black rounded border-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
          winner 
          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    />
  );
};

export const MatchCard: React.FC<MatchCardProps> = memo(({ match, teams, onScoreChange, isReadOnly = false }) => {
  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);

  const handleInput = (setIdx: number, isTeam1: boolean, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const numValue = numericValue === '' ? null : parseInt(numericValue, 10);
    
    if (isTeam1) {
      onScoreChange(match.id, setIdx, numValue, match.sets[setIdx].s2);
    } else {
      onScoreChange(match.id, setIdx, match.sets[setIdx].s1, numValue);
    }
  };

  let sets1 = 0;
  let sets2 = 0;
  match.sets.forEach(s => {
    if (s.s1 !== null && s.s2 !== null) {
      if (s.s1 > s.s2) sets1++;
      else if (s.s2 > s.s1) sets2++;
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-50 px-3 py-1.5 flex justify-between items-center border-b border-slate-100">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {match.type.toUpperCase()}
        </span>
        {match.completed && (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
                {sets1}-{sets2}
            </span>
        )}
      </div>
      
      <div className="p-2 sm:p-3">
        {/* Adjusted grid for better mobile fit: team names get max space, score columns are consistent */}
        <div className="grid grid-cols-[1fr_repeat(3,38px)] sm:grid-cols-[1fr_repeat(3,44px)] gap-1.5 sm:gap-2 items-center mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-1 h-4 sm:w-1.5 sm:h-5 shrink-0 rounded-full ${sets1 > sets2 && match.completed ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                <span className={`font-bold text-[11px] sm:text-xs truncate ${sets1 > sets2 && match.completed ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {team1?.name || 'TBD'}
                </span>
            </div>
            {match.sets.map((set, idx) => (
                <ScoreDisplay 
                  key={`t1-s${idx}`} 
                  value={set.s1} 
                  setIdx={idx} 
                  isTeam1={true} 
                  winner={set.s1 !== null && set.s2 !== null && set.s1 > set.s2}
                  isReadOnly={isReadOnly}
                  handleInput={handleInput}
                />
            ))}
        </div>

        <div className="grid grid-cols-[1fr_repeat(3,38px)] sm:grid-cols-[1fr_repeat(3,44px)] gap-1.5 sm:gap-2 items-center">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-1 h-4 sm:w-1.5 sm:h-5 shrink-0 rounded-full ${sets2 > sets1 && match.completed ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                <span className={`font-bold text-[11px] sm:text-xs truncate ${sets2 > sets1 && match.completed ? 'text-sky-700' : 'text-slate-700'}`}>
                    {team2?.name || 'TBD'}
                </span>
            </div>
            {match.sets.map((set, idx) => (
                <ScoreDisplay 
                  key={`t2-s${idx}`} 
                  value={set.s2} 
                  setIdx={idx} 
                  isTeam1={false} 
                  winner={set.s1 !== null && set.s2 !== null && set.s2 > set.s1}
                  isReadOnly={isReadOnly}
                  handleInput={handleInput}
                />
            ))}
        </div>
      </div>
    </div>
  );
});
