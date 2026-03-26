import { registrationMocks } from "./registration.mock";
import { tournamentTableMocks } from "./tournament_table.mock";

export const tableAssignementMocks = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 1}`,
    registration_id: registrationMocks[i],
    table_id: tournamentTableMocks[0],
    table_seat_number: i + 1
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 9}`,
    registration_id: registrationMocks[i + 8],
    table_id: tournamentTableMocks[1],
    table_seat_number: i + 1
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 17}`,
    registration_id: registrationMocks[i + 16],
    table_id: tournamentTableMocks[2],
    table_seat_number: i + 1
  }))
];
