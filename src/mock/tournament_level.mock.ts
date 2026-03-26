import { tournamentMocks } from "./tournament.mock";

const now = new Date();
now.setSeconds(0);
now.setMilliseconds(0);

const formatTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}h${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

const generateLevels = (count: number) => {
  const levels = [];
  const duration = 1; // minutes

  for (let i = 0; i < count; i++) {
    const start = new Date(now.getTime() + i * duration * 60 * 1000);
    const end = new Date(now.getTime() + (i + 1) * duration * 60 * 1000);
    levels.push({
      id: (i + 1).toString(),
      tournament_id: tournamentMocks[0],
      level_number: i + 1,
      level_start: formatTime(start),
      level_end: formatTime(end),
      level_small_blinde: 50 * (i + 1),
      level_big_blinde: 100 * (i + 1),
      level_pause: i % 2 === 1,
      level_chip_race: i % 3 === 0
    });
  }

  return levels;
};

export const tournamentLevelMocks = generateLevels(10);
