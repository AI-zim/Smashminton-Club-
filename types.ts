
export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
}

export interface SetScore {
  s1: number | null;
  s2: number | null;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  sets: SetScore[];
  completed: boolean;
  type: 'group' | 'semi' | 'final';
  groupId?: 1 | 2;
  winnerId?: string | null;
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
}

export interface TournamentState {
  teams: Team[];
  groupMatches: Match[];
  knockoutMatches: {
    sf1: Match;
    sf2: Match;
    final: Match;
  };
  phase: 'setup' | 'groups' | 'knockout';
}
