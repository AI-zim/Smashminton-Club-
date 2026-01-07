
import { Team, Match, StandingsRow, SetScore } from '../types';

export const getMatchWinner = (match: Match): string | null => {
  let setsWon1 = 0;
  let setsWon2 = 0;

  match.sets.forEach((set) => {
    if (set.s1 !== null && set.s2 !== null) {
      if (set.s1 > set.s2) setsWon1++;
      else if (set.s2 > set.s1) setsWon2++;
    }
  });

  if (setsWon1 >= 2) return match.team1Id;
  if (setsWon2 >= 2) return match.team2Id;
  return null;
};

export const isMatchComplete = (match: Match): boolean => {
  let setsWon1 = 0;
  let setsWon2 = 0;

  for (const set of match.sets) {
    if (set.s1 !== null && set.s2 !== null) {
      if (set.s1 > set.s2) setsWon1++;
      else if (set.s2 > set.s1) setsWon2++;
    }
    if (setsWon1 >= 2 || setsWon2 >= 2) return true;
  }
  return false;
};

export const calculateStandings = (teams: Team[], matches: Match[]): StandingsRow[] => {
  const standings: Record<string, StandingsRow> = {};

  teams.forEach((team) => {
    standings[team.id] = {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
    };
  });

  matches.forEach((match) => {
    const winnerId = getMatchWinner(match);
    if (!isMatchComplete(match) || !winnerId) return;

    const t1 = standings[match.team1Id];
    const t2 = standings[match.team2Id];

    if (!t1 || !t2) return;

    t1.played += 1;
    t2.played += 1;

    // Aggregate points from all sets
    match.sets.forEach(set => {
        if (set.s1 !== null && set.s2 !== null) {
            t1.pointsFor += set.s1;
            t1.pointsAgainst += set.s2;
            t2.pointsFor += set.s2;
            t2.pointsAgainst += set.s1;
        }
    });

    if (winnerId === match.team1Id) {
      t1.won += 1;
      t2.lost += 1;
    } else {
      t2.won += 1;
      t1.lost += 1;
    }

    t1.diff = t1.pointsFor - t1.pointsAgainst;
    t2.diff = t2.pointsFor - t2.pointsAgainst;
  });

  return Object.values(standings).sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.pointsFor - a.pointsFor;
  });
};

const emptySets = (): SetScore[] => [
  { s1: null, s2: null },
  { s1: null, s2: null },
  { s1: null, s2: null }
];

export const generateGroupMatches = (teams: Team[], groupId: 1 | 2): Match[] => {
  const t1 = teams[0];
  const t2 = teams[1];
  const t3 = teams[2];

  return [
    { id: `g${groupId}-m1`, team1Id: t1.id, team2Id: t2.id, sets: emptySets(), completed: false, type: 'group', groupId },
    { id: `g${groupId}-m2`, team1Id: t2.id, team2Id: t3.id, sets: emptySets(), completed: false, type: 'group', groupId },
    { id: `g${groupId}-m3`, team1Id: t3.id, team2Id: t1.id, sets: emptySets(), completed: false, type: 'group', groupId },
  ];
};
