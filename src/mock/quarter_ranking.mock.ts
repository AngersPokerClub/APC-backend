import { tournamentMocks } from "./tournament.mock";
import { usersMock } from "./user.mock";

export const quarterRankingMocks = [
  {
    id: "1",
    user_id: usersMock[0],
    tournament_id: tournamentMocks[0],
    trimestry_ranking: "Top 10",
    aggregated_score: 510,
    position: 1
  },
  {
    id: "1",
    user_id: usersMock[1],
    tournament_id: tournamentMocks[2],
    trimestry_ranking: "Top 10",
    aggregated_score: 50,
    position: 1
  },
  {
    id: "2",
    user_id: usersMock[2],
    tournament_id: tournamentMocks[1],
    trimestry_ranking: "Top 10",
    aggregated_score: 520,
    position: 2
  },
  {
    id: "3",
    user_id: usersMock[3],
    tournament_id: tournamentMocks[2],
    trimestry_ranking: "Top 10",
    aggregated_score: 530,
    position: 3
  },
  {
    id: "3",
    user_id: usersMock[3],
    tournament_id: tournamentMocks[0],
    trimestry_ranking: "Top 10",
    aggregated_score: 530,
    position: 3
  },
  {
    id: "4",
    user_id: usersMock[4],
    tournament_id: tournamentMocks[3],
    trimestry_ranking: "Top 10",
    aggregated_score: 540,
    position: 4
  },
  {
    id: "5",
    user_id: usersMock[5],
    tournament_id: tournamentMocks[4],
    trimestry_ranking: "Top 10",
    aggregated_score: 550,
    position: 5
  },
  {
    id: "6",
    user_id: usersMock[6],
    tournament_id: tournamentMocks[5],
    trimestry_ranking: "Top 10",
    aggregated_score: 560,
    position: 6
  },
  {
    id: "7",
    user_id: usersMock[7],
    tournament_id: tournamentMocks[6],
    trimestry_ranking: "Top 10",
    aggregated_score: 570,
    position: 7
  },
  {
    id: "8",
    user_id: usersMock[8],
    tournament_id: tournamentMocks[7],
    trimestry_ranking: "Top 10",
    aggregated_score: 580,
    position: 8
  },
  {
    id: "9",
    user_id: usersMock[9],
    tournament_id: tournamentMocks[8],
    trimestry_ranking: "Top 10",
    aggregated_score: 590,
    position: 9
  },
  {
    id: "10",
    user_id: usersMock[10],
    tournament_id: tournamentMocks[9],
    trimestry_ranking: "Top 10",
    aggregated_score: 600,
    position: 10
  }
];
