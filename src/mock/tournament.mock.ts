const now = new Date();
now.setSeconds(0);
now.setMilliseconds(0);

const tournamentStart = new Date(now);
const tournamentEnd = new Date(now.getTime() + 10 * 40 * 60 * 1000); // 10 niveaux de 40 min

const toISOStringWithTZ = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

export const tournamentMocks = [
  {
    id: "1",
    tournament_name: "Tournament 1",
    tournament_description: "Description 1",
    tournament_start_date: toISOStringWithTZ(tournamentStart),
    tournament_end_date: toISOStringWithTZ(tournamentEnd),
    tournament_trimestry: "T1",
    tournament_category: "APT",
    tournament_status: "in_coming"
  },
  {
    id: "2",
    tournament_name: "Tournament 2",
    tournament_description: "Description 2",
    tournament_start_date: "2025-01-03T18:30:00",
    tournament_end_date: "2025-01-04T00:00:00",
    tournament_trimestry: "T1",
    tournament_category: "Sit&Go",
    tournament_status: "finish"
  },
  {
    id: "3",
    tournament_name: "Tournament 3",
    tournament_description: "Description 3",
    tournament_start_date: "2025-01-04T19:00:00",
    tournament_end_date: "2025-01-05T00:30:00",
    tournament_trimestry: "T1",
    tournament_category: "APT",
    tournament_status: "finish"
  },
  {
    id: "4",
    tournament_name: "Tournament 4",
    tournament_description: "Description 4",
    tournament_start_date: "2025-01-05T17:00:00",
    tournament_end_date: "2025-01-06T22:00:00",
    tournament_trimestry: "T3",
    tournament_category: "APT",
    tournament_status: "in_coming"
  },
  {
    id: "5",
    tournament_name: "Tournament 5",
    tournament_description: "Description 5",
    tournament_start_date: "2025-01-06T18:00:00",
    tournament_end_date: "2025-01-07T23:00:00",
    tournament_trimestry: "T2",
    tournament_category: "Superfinale",
    tournament_status: "in_coming"
  },
  {
    id: "6",
    tournament_name: "Tournament 6",
    tournament_description: "Description 6",
    tournament_start_date: "2025-01-07T19:00:00",
    tournament_end_date: "2025-01-08T23:30:00",
    tournament_trimestry: "T2",
    tournament_category: "Special",
    tournament_status: "in_coming"
  },
  {
    id: "7",
    tournament_name: "Tournament 7",
    tournament_description: "Description 7",
    tournament_start_date: "2025-01-08T20:00:00",
    tournament_end_date: "2025-01-09T01:30:00",
    tournament_trimestry: "T3",
    tournament_category: "Solipoker",
    tournament_status: "in_coming"
  },
  {
    id: "8",
    tournament_name: "Tournament 8",
    tournament_description: "Description 8",
    tournament_start_date: "2025-01-09T18:30:00",
    tournament_end_date: "2025-01-10T23:30:00",
    tournament_trimestry: "T3",
    tournament_category: "Special",
    tournament_status: "in_coming"
  },
  {
    id: "9",
    tournament_name: "Tournament 9",
    tournament_description: "Description 9",
    tournament_start_date: "2025-01-10T19:30:00",
    tournament_end_date: "2025-01-11T00:30:00",
    tournament_trimestry: "T3",
    tournament_category: "APT",
    tournament_status: "in_coming"
  },
  {
    id: "10",
    tournament_name: "Tournament 10",
    tournament_description: "Description 10",
    tournament_start_date: "2025-01-11T20:00:00",
    tournament_end_date: "2025-01-12T01:00:00",
    tournament_trimestry: "T2",
    tournament_category: "APT",
    tournament_status: "start"
  }
];
