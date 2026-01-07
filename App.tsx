
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Team, Match, TournamentState, SetScore, StandingsRow } from './types';
import { generateGroupMatches, calculateStandings, isMatchComplete, getMatchWinner } from './utils/tournament';
import { MatchCard } from './components/MatchCard';
import { StandingsTable } from './components/StandingsTable';
import * as htmlToImage from 'html-to-image';

interface SharedProps {
  state: TournamentState;
  standings1: StandingsRow[];
  standings2: StandingsRow[];
  updateMatchScore: (matchId: string, setIdx: number, s1: number | null, s2: number | null) => void;
  groupStageComplete: boolean;
  setActiveTab?: (tab: TabType) => void;
  isTournamentFinished: boolean;
  isReadOnly?: boolean;
}

type TabType = 'groups' | 'knockout' | 'overall';

const getFreshInitialState = (): TournamentState => ({
  teams: Array.from({ length: 6 }, (_, i) => ({ 
    id: `t${i}`, 
    name: '', 
    player1: '', 
    player2: '' 
  })),
  groupMatches: [],
  knockoutMatches: {
    sf1: { id: 'sf1', team1Id: '', team2Id: '', sets: [ { s1: null, s2: null }, { s1: null, s2: null }, { s1: null, s2: null } ], completed: false, type: 'semi' },
    sf2: { id: 'sf2', team1Id: '', team2Id: '', sets: [ { s1: null, s2: null }, { s1: null, s2: null }, { s1: null, s2: null } ], completed: false, type: 'semi' },
    final: { id: 'final', team1Id: '', team2Id: '', sets: [ { s1: null, s2: null }, { s1: null, s2: null }, { s1: null, s2: null } ], completed: false, type: 'final' },
  },
  phase: 'setup',
});

const GroupSection: React.FC<SharedProps> = ({ state, standings1, standings2, updateMatchScore, groupStageComplete, setActiveTab, isReadOnly = false }) => (
  <div className="space-y-6 sm:space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <div className="space-y-6">
        <StandingsTable title="Group 1 Standings" rows={standings1} />
        <div className="space-y-3 sm:space-y-4">
          <h3 className={`text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 ${isReadOnly ? 'text-slate-900' : 'no-print'}`}>Group 1 Matches</h3>
          {state.groupMatches.filter(m => m.groupId === 1).map(match => (
            <MatchCard key={match.id} match={match} teams={state.teams} onScoreChange={updateMatchScore} isReadOnly={isReadOnly} />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <StandingsTable title="Group 2 Standings" rows={standings2} />
        <div className="space-y-3 sm:space-y-4">
          <h3 className={`text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 ${isReadOnly ? 'text-slate-900' : 'no-print'}`}>Group 2 Matches</h3>
          {state.groupMatches.filter(m => m.groupId === 2).map(match => (
            <MatchCard key={match.id} match={match} teams={state.teams} onScoreChange={updateMatchScore} isReadOnly={isReadOnly} />
          ))}
        </div>
      </div>
    </div>
    {groupStageComplete && setActiveTab && !isReadOnly && (
      <div className="mt-8 sm:mt-12 p-6 sm:p-10 bg-emerald-50 rounded-2xl sm:rounded-3xl border-2 border-emerald-100 text-center no-print">
        <h3 className="text-xl sm:text-2xl font-black text-emerald-900 mb-2">Groups Finished!</h3>
        <button 
          type="button" 
          onClick={() => { setActiveTab?.('knockout'); window.scrollTo(0, 0); }}
          className="bg-emerald-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold mt-4 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
        >
          See Knockout Bracket →
        </button>
      </div>
    )}
  </div>
);

const KnockoutSection: React.FC<SharedProps & { showSummaryBtn?: boolean }> = ({ state, updateMatchScore, isTournamentFinished, groupStageComplete, isReadOnly = false, setActiveTab, showSummaryBtn }) => (
  <div className="max-w-3xl mx-auto space-y-8 sm:space-y-12">
    {!groupStageComplete && !isReadOnly ? (
      <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner no-print px-4">
         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">Complete Groups to Unlock Bracket</p>
      </div>
    ) : (
      <>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-3 uppercase tracking-tighter">
            {!isReadOnly && <span className="w-1.5 sm:w-2 h-6 sm:h-7 bg-sky-500 rounded-full"></span>}
            Knockout Phase
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 px-2">Semi-Final 1</p>
              <MatchCard match={state.knockoutMatches.sf1} teams={state.teams} onScoreChange={updateMatchScore} isReadOnly={isReadOnly} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 px-2">Semi-Final 2</p>
              <MatchCard match={state.knockoutMatches.sf2} teams={state.teams} onScoreChange={updateMatchScore} isReadOnly={isReadOnly} />
            </div>
          </div>
        </div>

        <div className={`bg-sky-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 sm:border-4 border-sky-100 shadow-xl ${isReadOnly ? 'bg-white border-slate-900 border-4 shadow-none' : ''}`}>
          <h2 className="text-xl sm:text-2xl font-black text-sky-950 mb-6 sm:mb-8 text-center uppercase tracking-tighter">🏆 Tournament Grand Final</h2>
          <div className="max-w-md mx-auto">
            <MatchCard match={state.knockoutMatches.final} teams={state.teams} onScoreChange={updateMatchScore} isReadOnly={isReadOnly} />
          </div>
          {isTournamentFinished && (
            <div className="mt-8 sm:mt-10 text-center">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2">Tournament Champions</p>
              <h3 className={`text-3xl sm:text-5xl font-black text-sky-950 tracking-tighter uppercase ${isReadOnly ? 'text-slate-900' : ''}`}>
                {state.teams.find(t => t.id === state.knockoutMatches.final.winnerId)?.name}
              </h3>
              {showSummaryBtn && setActiveTab && (
                <button 
                  type="button"
                  onClick={() => { setActiveTab('overall'); window.scrollTo(0, 0); }}
                  className="mt-6 sm:mt-8 bg-slate-900 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:bg-black active:scale-95 transition-all no-print text-sm"
                >
                  View Overall Result Summary
                </button>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </div>
);

const OverallSummary: React.FC<SharedProps> = (props) => {
  const winner = props.state.teams.find(t => t.id === props.state.knockoutMatches.final.winnerId);
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="space-y-10 sm:space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 p-0.5 sm:p-1 rounded-2xl sm:rounded-3xl shadow-2xl">
        <div className="bg-white rounded-[18px] sm:rounded-[22px] py-8 sm:py-12 px-4 sm:px-6 text-center border-2 sm:border-4 border-white">
          <div className="text-4xl sm:text-6xl mb-4">🏆</div>
          <p className="text-[10px] sm:text-sm font-black text-amber-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2">Tournament Champions</p>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase mb-4 break-words">
            {winner?.name}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold text-[9px] sm:text-xs uppercase">Overall Winners</span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-[9px] sm:text-xs uppercase">{currentDate}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:gap-12">
        <section>
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <span className="w-8 sm:w-12 h-1 bg-emerald-500 rounded-full"></span>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Final Standings</h3>
            <span className="flex-grow h-1 bg-slate-100 rounded-full"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <StandingsTable title="Group 1 Final" rows={props.standings1} />
            <StandingsTable title="Group 2 Final" rows={props.standings2} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <span className="w-8 sm:w-12 h-1 bg-sky-500 rounded-full"></span>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Knockout Recap</h3>
            <span className="flex-grow h-1 bg-slate-100 rounded-full"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="opacity-85 sm:scale-95 sm:origin-left">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SF1 Result</p>
              <MatchCard match={props.state.knockoutMatches.sf1} teams={props.state.teams} onScoreChange={props.updateMatchScore} isReadOnly={true} />
            </div>
            <div className="opacity-85 sm:scale-95 sm:origin-right">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SF2 Result</p>
              <MatchCard match={props.state.knockoutMatches.sf2} teams={props.state.teams} onScoreChange={props.updateMatchScore} isReadOnly={true} />
            </div>
          </div>
          <div className="max-w-xl mx-auto">
            <p className="text-[9px] sm:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 text-center">Grand Final Result</p>
            <MatchCard match={props.state.knockoutMatches.final} teams={props.state.teams} onScoreChange={props.updateMatchScore} isReadOnly={true} />
          </div>
        </section>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [isExporting, setIsExporting] = useState(false);
  const [resetKey, setResetKey] = useState(0); 
  const printRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<TournamentState>(getFreshInitialState());

  const handleStartTournament = () => {
    if (state.teams.some(t => t.player1.trim() === '' || t.player2.trim() === '')) {
      alert('Please fill in both player names for all 6 teams.');
      return;
    }
    const group1 = state.teams.slice(0, 3);
    const group2 = state.teams.slice(3, 6);
    setState(prev => ({
      ...prev,
      groupMatches: [...generateGroupMatches(group1, 1), ...generateGroupMatches(group2, 2)],
      phase: 'groups'
    }));
  };

  const updatePlayerName = (id: string, playerNum: 1 | 2, value: string) => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id === id) {
          const p1 = playerNum === 1 ? value : t.player1;
          const p2 = playerNum === 2 ? value : t.player2;
          return {
            ...t,
            player1: p1,
            player2: p2,
            name: (p1 && p2) ? `${p1} / ${p2}` : (p1 || p2 || '')
          };
        }
        return t;
      })
    }));
  };

  const updateMatchScore = useCallback((matchId: string, setIdx: number, s1: number | null, s2: number | null) => {
    setState(prev => {
      const isGroup = matchId.startsWith('g');
      const updateMatchData = (m: Match): Match => {
        const newSets = [...m.sets];
        newSets[setIdx] = { s1, s2 };
        const updatedMatch = { ...m, sets: newSets };
        return { 
          ...updatedMatch, 
          completed: isMatchComplete(updatedMatch),
          winnerId: getMatchWinner(updatedMatch)
        };
      };

      if (isGroup) {
        return {
          ...prev,
          groupMatches: prev.groupMatches.map(m => m.id === matchId ? updateMatchData(m) : m)
        };
      } else {
        const key = matchId as 'sf1' | 'sf2' | 'final';
        return {
          ...prev,
          knockoutMatches: {
            ...prev.knockoutMatches,
            [key]: updateMatchData(prev.knockoutMatches[key])
          }
        };
      }
    });
  }, []);

  const standings1 = useMemo(() => 
    calculateStandings(state.teams.slice(0, 3), state.groupMatches.filter(m => m.groupId === 1)),
    [state.teams, state.groupMatches]
  );

  const standings2 = useMemo(() => 
    calculateStandings(state.teams.slice(3, 6), state.groupMatches.filter(m => m.groupId === 2)),
    [state.teams, state.groupMatches]
  );

  const groupStageComplete = useMemo(() => 
    state.groupMatches.length > 0 && state.groupMatches.every(m => m.completed),
    [state.groupMatches]
  );

  useEffect(() => {
    if (state.phase === 'groups' && groupStageComplete) {
      setState(prev => ({
        ...prev,
        knockoutMatches: {
          ...prev.knockoutMatches,
          sf1: { ...prev.knockoutMatches.sf1, team1Id: standings1[0].teamId, team2Id: standings2[1].teamId },
          sf2: { ...prev.knockoutMatches.sf2, team1Id: standings2[0].teamId, team2Id: standings1[1].teamId },
        }
      }));
    }
  }, [standings1, standings2, groupStageComplete, state.phase]);

  useEffect(() => {
    const { sf1, sf2 } = state.knockoutMatches;
    if (sf1.completed && sf2.completed) {
      setState(prev => ({
        ...prev,
        knockoutMatches: {
          ...prev.knockoutMatches,
          final: { ...prev.knockoutMatches.final, team1Id: sf1.winnerId!, team2Id: sf2.winnerId! }
        }
      }));
    }
  }, [state.knockoutMatches.sf1.completed, state.knockoutMatches.sf2.completed, state.knockoutMatches.sf1.winnerId, state.knockoutMatches.sf2.winnerId]);

  const handleExportPng = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      printRef.current.classList.add('capturing-png');
      printRef.current.classList.remove('print-only');
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `smashminton-results-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Could not generate image. Please try again.');
    } finally {
      if (printRef.current) {
        printRef.current.classList.remove('capturing-png');
        printRef.current.classList.add('print-only');
      }
      setIsExporting(false);
    }
  };

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the entire tournament? This will clear all names and scores and bring you back to the start.')) {
      setState(getFreshInitialState());
      setActiveTab('groups');
      setResetKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const isTournamentFinished = state.knockoutMatches.final.completed;

  const shared: SharedProps = {
    state,
    standings1,
    standings2,
    updateMatchScore,
    groupStageComplete,
    isTournamentFinished,
    setActiveTab
  };

  const currentFullDateString = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-['Inter']">
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-xl font-bold tracking-tight">Generating Tournament PNG...</p>
          <p className="text-slate-400 text-sm mt-2">Hang tight, capturing high-quality results</p>
        </div>
      )}

      <header className="bg-emerald-600 px-4 sm:px-6 py-4 sm:py-6 shadow-lg no-print">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sky-300">🏸</span> Smashminton Club
            </h1>
            <p className="text-emerald-100 font-medium text-xs sm:text-sm">Tournament Manager</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {state.phase !== 'setup' && (
              <button 
                type="button"
                onClick={handleExportPng}
                disabled={isExporting}
                className="flex-1 sm:flex-none bg-white hover:bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PNG
              </button>
            )}
            <button 
              type="button" 
              onClick={handleReset} 
              className="flex-1 sm:flex-none bg-slate-900/20 hover:bg-slate-900/40 text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl border border-white/10 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 sm:mt-8" key={resetKey}>
        {state.phase === 'setup' ? (
          <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 no-print animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-slate-800 tracking-tight">Setup Doubles Pairs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Group 1 Column */}
              <div className="space-y-6">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Group 1</h3>
                {state.teams.slice(0, 3).map((team, idx) => (
                  <div key={team.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Team {String.fromCharCode(65 + idx)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input 
                        type="text" 
                        placeholder="Player 1 Name" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-all font-semibold text-sm" 
                        value={team.player1} 
                        onChange={(e) => updatePlayerName(team.id, 1, e.target.value)} 
                      />
                      <input 
                        type="text" 
                        placeholder="Player 2 Name" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-all font-semibold text-sm" 
                        value={team.player2} 
                        onChange={(e) => updatePlayerName(team.id, 2, e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Group 2 Column */}
              <div className="space-y-6">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Group 2</h3>
                {state.teams.slice(3, 6).map((team, idx) => (
                  <div key={team.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-sky-600 uppercase tracking-tighter">Team {String.fromCharCode(68 + idx)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input 
                        type="text" 
                        placeholder="Player 1 Name" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none transition-all font-semibold text-sm" 
                        value={team.player1} 
                        onChange={(e) => updatePlayerName(team.id, 1, e.target.value)} 
                      />
                      <input 
                        type="text" 
                        placeholder="Player 2 Name" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none transition-all font-semibold text-sm" 
                        value={team.player2} 
                        onChange={(e) => updatePlayerName(team.id, 2, e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" onClick={handleStartTournament} className="w-full mt-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-[0.98]">Start Tournament</button>
          </section>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl no-print border border-slate-200 overflow-x-auto scrollbar-hide">
              <button type="button" onClick={() => setActiveTab('groups')} className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all whitespace-nowrap text-xs sm:text-sm ${activeTab === 'groups' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500'}`}>
                1. Groups
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('knockout')} 
                className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all whitespace-nowrap text-xs sm:text-sm ${activeTab === 'knockout' ? 'bg-white shadow-md text-sky-600' : 'text-slate-500'}`}
              >
                2. Knockout
              </button>
              {isTournamentFinished && (
                <button 
                  type="button" 
                  onClick={() => setActiveTab('overall')} 
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all whitespace-nowrap text-xs sm:text-sm ${activeTab === 'overall' ? 'bg-white shadow-md text-amber-600' : 'text-slate-500'}`}
                >
                  3. Results
                </button>
              )}
            </div>

            <div className="no-print">
              {activeTab === 'groups' ? (
                <GroupSection {...shared} />
              ) : activeTab === 'knockout' ? (
                <KnockoutSection {...shared} showSummaryBtn={true} />
              ) : (
                <OverallSummary {...shared} />
              )}
            </div>

            <div ref={printRef} id="print-report" className="print-only">
               <div className="text-center mb-10 pb-8 border-b-8 border-emerald-600">
                  <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">🏸 Smashminton Club Official Report</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">Generated on {currentFullDateString} • Smashminton Club Manager</p>
               </div>
               
               <div className="mb-12">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="w-2.5 h-10 bg-emerald-600 rounded-full"></span>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Phase 1: Group Stage</h2>
                  </div>
                  <GroupSection {...shared} isReadOnly={true} />
               </div>

               <div className="pt-10 border-t-2 border-slate-100">
                 <div className="flex items-center gap-4 mb-8">
                   <span className="w-2.5 h-10 bg-sky-600 rounded-full"></span>
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Phase 2: Knockout Results</h2>
                 </div>
                 <KnockoutSection {...shared} isReadOnly={true} />
               </div>

               <div className="mt-20 py-10 border-t-4 border-slate-200 text-center">
                  <p className="text-sm text-slate-400 font-black uppercase tracking-[0.4em]">End of Official Tournament Record</p>
                  <p className="text-[10px] text-slate-300 mt-2 uppercase">Smashminton Club &copy; {currentFullDateString}</p>
               </div>
            </div>
          </div>
        )}
      </main>

      {isTournamentFinished && (
        <div className="fixed bottom-6 right-6 no-print flex flex-col gap-3">
          <button 
            type="button"
            onClick={() => { setActiveTab('overall'); window.scrollTo(0, 0); }}
            className="bg-slate-900 hover:bg-black text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white shadow-slate-200"
            title="View Summary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            type="button"
            onClick={handleExportPng}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white shadow-emerald-200"
            title="Export results as PNG"
          >
            {isExporting ? (
               <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
