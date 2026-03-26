import { tournamentMocks } from "./tournament.mock";
import { usersMock } from "./user.mock";

const possibleStatus = ["Confirmed", "Pending", "Cancelled"] as const;

export const registrationMocks = Array.from({ length: 24 }, (_, i) => {
  const id = (i + 1).toString();
  const randomStatus =
    possibleStatus[Math.floor(Math.random() * possibleStatus.length)];

  return {
    id,
    user_id: usersMock[i + 1],
    tournament_id: tournamentMocks[0],
    inscription_date: `2025-01-${String(i + 1).padStart(2, "0")}`,
    statut: randomStatus
  };
});
