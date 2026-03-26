"use client";

import { useEffect, useState, useRef } from "react";
import { ChipLegend } from "@/app/components/chipLegend";
import InfoItem from "@/app/components/infoItem";
import { Chip, TournamentLevel } from "@/app/types";
import { useParams } from "next/navigation";
import { useTournamentData } from "@/app/hook/useTournamentData";
import LoadingComponent from "@/app/error/loading/page";
import { DateTime } from "luxon";

export default function Game() {
  const { id } = useParams();
  const tournamentId = String(id);
  const { data, refetch, refetchStatusOnly } = useTournamentData(tournamentId);

  const tournament = data?.tournament;
  const levels = data?.levels ?? [];
  const registration = data?.registrations ?? [];
  const assignements = data?.assignements ?? [];

  // Track client-server time offset for synchronization
  const [timeOffset, setTimeOffset] = useState<number>(0); // milliseconds
  const [now, setNow] = useState(new Date());
  const [frozenNow, setFrozenNow] = useState<Date | null>(null);
  const [currentLevel, setCurrentLevel] = useState<TournamentLevel | null>(
    null,
  );
  const [nextLevel, setNextLevel] = useState<TournamentLevel | null>(null);
  const [nextPause, setNextPause] = useState<TournamentLevel | null>(null);
  const [hasPlayedOneAliveSound, setHasPlayedOneAliveSound] = useState(false);

  const [bgIndex, setBgIndex] = useState(0);
  const previousLevelId = useRef<number | null>(null);

  // SOLIPOKER Day 2 special calculation state
  const [day1TotalChips, setDay1TotalChips] = useState<number | null>(null);
  const [isLoadingDay1Data, setIsLoadingDay1Data] = useState(false);

  const isPaused = tournament?.tournament_pause === true;

  // Get synchronized time (adjusted for server offset)
  const getSyncedNow = () => {
    if (isPaused && frozenNow) return frozenNow;
    // Subtract offset to get server-equivalent time
    return new Date(now.getTime() - timeOffset);
  };

  let chips = (tournament?.stack?.stack_chip ?? [])
    .map((sc) => sc?.chip)
    .filter((chip): chip is Chip => chip !== undefined);

  const chipRaceCount = levels.filter((level) => {
    const levelEnd = DateTime.fromISO(level.level_end, { zone: "utc" })
      .setZone("Europe/Paris")
      .toJSDate();
    return levelEnd <= getSyncedNow() && Number(level.level_chip_race) === 1;
  }).length;

  for (let i = 0; i < chipRaceCount; i++) {
    if (chips.length > 0) {
      const minValue = Math.min(...chips.map((c) => c.value));
      chips = chips.filter((c) => c.value !== minValue);
    }
  }

  const getDurationSince = (startISO: string) => {
    const start = DateTime.fromISO(startISO, { zone: "utc" })
      .setZone("Europe/Paris")
      .toJSDate();
    const diff = getSyncedNow().getTime() - start.getTime();
    const total = Math.max(0, Math.floor(diff / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  };

  const getTimeLeft = (end: string | Date) => {
    const endDate =
      typeof end === "string"
        ? DateTime.fromISO(end, { zone: "utc" })
            .setZone("Europe/Paris")
            .toJSDate()
        : end;
    const diff = endDate.getTime() - getSyncedNow().getTime();
    const total = Math.max(0, Math.floor(diff / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
      m % 60,
    ).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getTimeUntilNextPause = () => {
    if (currentLevel?.level_pause) {
      console.log(
        "⏸ [DEBUG] On est actuellement en pause, pas de timer affiché.",
      );
      return "-";
    }

    if (!nextPause) return "Aucune autre pause";

    const nowParis =
      DateTime.fromJSDate(getSyncedNow()).setZone("Europe/Paris");
    const pauseParis = DateTime.fromISO(nextPause.level_start, {
      zone: "utc",
    }).setZone("Europe/Paris");
    const diff = pauseParis
      .diff(nowParis, ["hours", "minutes", "seconds"])
      .toObject();

    return `${String(diff.hours ?? 0).padStart(2, "0")}:${String(
      diff.minutes ?? 0,
    ).padStart(2, "0")}:${String(Math.floor(diff.seconds ?? 0)).padStart(
      2,
      "0",
    )}`;
  };

  const getConfirmedPlayers = () =>
    registration.filter((r) => r.statut === "Confirmed");
  const getAlivePlayers = () =>
    assignements.filter(
      (r) => !r.eliminated && r.registration?.statut === "Confirmed",
    );

  useEffect(() => {
    const aliveCount = getAlivePlayers().length;
    if (aliveCount === 1 && !hasPlayedOneAliveSound) {
      const audio = new Audio("/sounds/victory.mp3");
      audio.play().catch((err) => {
        console.warn("Audio victory failed to play:", err);
      });
      setHasPlayedOneAliveSound(true);
    }
    if (aliveCount > 1 && hasPlayedOneAliveSound) {
      setHasPlayedOneAliveSound(false);
    }
  }, [getAlivePlayers, hasPlayedOneAliveSound]);

  // Helper to detect if current tournament is SOLIPOKER Day 2
  const isSolipokerDay2 = () => {
    if (tournament?.tournament_category !== "SOLIPOKER") return false;
    const name = tournament?.tournament_name?.toLowerCase() ?? "";
    return (
      name.includes("dimanche") ||
      name.includes("sunday") ||
      name.includes("DIMANCHE") ||
      name.includes("SUNDAY")
    );
  };

  const getAverageStackAlive = () => {
    const alivePlayersCount = getAlivePlayers().length;

    if (alivePlayersCount === 0) return "0";

    // Special calculation for SOLIPOKER Day 2
    if (isSolipokerDay2() && day1TotalChips !== null) {
      const averageStack = day1TotalChips / alivePlayersCount;
      return Math.round(averageStack).toString();
    }

    // Classic calculation for all other tournaments
    const confirmedPlayersCount = getConfirmedPlayers().length;
    const stackTotalPerPlayer = tournament?.stack?.stack_total_player ?? 0;
    const totalChipsInitial = stackTotalPerPlayer * confirmedPlayersCount;
    const averageStack = totalChipsInitial / alivePlayersCount;

    return Math.round(averageStack).toString();
  };

  // Ref pour le son
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasPlayedBeep, setHasPlayedBeep] = useState(false);

  // Calculate time offset when server time is received
  useEffect(() => {
    if (data?.serverTime) {
      const serverTime = new Date(data.serverTime).getTime();
      const clientTime = Date.now();
      const offset = clientTime - serverTime;
      setTimeOffset(offset);

      console.log("[SYNC] Server time:", data.serverTime);
      console.log("[SYNC] Client time:", new Date().toISOString());
      console.log(
        "[SYNC] Time offset:",
        offset,
        "ms (",
        Math.round(offset / 1000),
        "seconds )",
      );
    }
  }, [data?.serverTime]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refetchStatusOnly(), 5000);
    return () => clearInterval(interval);
  }, [refetchStatusOnly]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch Day 1 data for SOLIPOKER Day 2 tournaments
  useEffect(() => {
    if (!tournament || !isSolipokerDay2()) {
      setDay1TotalChips(null);
      return;
    }

    setIsLoadingDay1Data(true);
    fetch(`/api/tournament/${tournamentId}/day2-stack`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Day 1 data");
        return res.json();
      })
      .then((data) => {
        setDay1TotalChips(data.totalChips ?? 0);
        console.log("[SOLIPOKER Day 2] Loaded Day 1 data:", data);
      })
      .catch((err) => {
        console.error("[SOLIPOKER Day 2] Error fetching Day 1 data:", err);
        setDay1TotalChips(null);
      })
      .finally(() => {
        setIsLoadingDay1Data(false);
      });
  }, [tournament, tournamentId]);

  useEffect(() => {
    if (isPaused && !frozenNow) setFrozenNow(getSyncedNow());
    if (!isPaused && frozenNow) setFrozenNow(null);
  }, [isPaused, frozenNow, timeOffset]);

  useEffect(() => {
    const refDate = getSyncedNow();

    const cl = levels.find((level) => {
      const start = DateTime.fromISO(level.level_start, { zone: "utc" })
        .setZone("Europe/Paris")
        .toJSDate();
      const end = DateTime.fromISO(level.level_end, { zone: "utc" })
        .setZone("Europe/Paris")
        .toJSDate();
      return refDate >= start && refDate < end;
    });

    let next: TournamentLevel | undefined = undefined;
    if (currentLevel) {
      const currentIndex = levels.findIndex(
        (lvl) => lvl.id === currentLevel.id,
      );
      for (let i = currentIndex + 1; i < levels.length; i++) {
        if (!levels[i].level_pause) {
          next = levels[i];
          break;
        }
      }
    }

    const np = levels
      .filter((level) => level.level_pause)
      .find(
        (pauseLevel) =>
          DateTime.fromISO(pauseLevel.level_start, { zone: "utc" })
            .setZone("Europe/Paris")
            .toJSDate() > refDate,
      );

    setNextPause(np ?? null);

    if (cl && cl.id !== previousLevelId.current) {
      previousLevelId.current = cl.id;
      setBgIndex((prev) => (prev === 0 ? 1 : 0));
    }

    setCurrentLevel(cl ?? null);
    setNextLevel(next ?? null);
    setNextPause(np ?? null);
  }, [levels, now, frozenNow, isPaused, timeOffset]);

  // UseEffect pour jouer le son 10s avant fin niveau
  useEffect(() => {
    if (!currentLevel) return;

    const nowTime = getSyncedNow().getTime();
    const levelEndTime = DateTime.fromISO(currentLevel.level_end, {
      zone: "utc",
    })
      .setZone("Europe/Paris")
      .toJSDate()
      .getTime();

    const secondsLeft = Math.floor((levelEndTime - nowTime) / 1000);

    if (secondsLeft <= 2 && secondsLeft > 1 && !hasPlayedBeep) {
      const audio = new Audio("/sounds/alert_level.mp3");
      audio.play().catch((err) => {
        console.warn("Audio beep failed to play:", err);
      });
      setHasPlayedBeep(true);
    }

    if (secondsLeft > 10 && hasPlayedBeep) {
      setHasPlayedBeep(false);
    }
  }, [currentLevel, now, frozenNow, timeOffset]);

  if (!tournament || !Array.isArray(levels)) return <LoadingComponent />;

  const nowTime = getSyncedNow();
  const localNowStr = DateTime.fromJSDate(nowTime)
    .setZone("Europe/Paris")
    .toFormat("dd/MM/yyyy HH:mm");

  const backgroundUrl =
    bgIndex === 0
      ? tournament.tournament_background_1 || "/images/background_dashboard.svg"
      : tournament.tournament_background_2 ||
        "/images/background_dashboard.svg";

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center transition-all duration-500 overflow-auto"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-4 md:p-8 max-h-full overflow-auto">
        <div className="text-center text-white">
          <h1 className="text-7xl font-satoshiBold text-primary_brand-50">
            {tournament.tournament_name}
          </h1>
          <p className="font-satoshi text-5xl text-primary_brand-50">
            {localNowStr}
          </p>
        </div>

        <div className="flex justify-between">
          <div className="space-y-4">
            <InfoItem
              label="Niveau"
              value={currentLevel?.level_number.toString() ?? "-"}
            />
            <InfoItem
              label="Durée totale"
              value={
                tournament ? (
                  <span className="font-satoshiBold tabular-nums">
                    {getDurationSince(String(tournament.tournament_start_date))}
                  </span>
                ) : (
                  "--:--:--"
                )
              }
            />
            <InfoItem
              label="Pause"
              value={
                <span className="font-satoshiBold tabular-nums">
                  {getTimeUntilNextPause()}
                </span>
              }
            />
          </div>

          <div className="text-center text-primary_brand-50">
            <div className="text-xl12 font-satoshiBold tabular-nums">
              {currentLevel
                ? getTimeLeft(
                    DateTime.fromISO(currentLevel.level_end, { zone: "utc" })
                      .setZone("Europe/Paris")
                      .toJSDate(),
                  )
                : "--:--"}
            </div>
            <div className="text-xl7 font-satoshiBold">
              {currentLevel?.level_pause
                ? "PAUSE"
                : currentLevel && !currentLevel.level_pause
                  ? `${currentLevel.level_small_blinde}/${currentLevel.level_big_blinde}/${currentLevel.level_ante}`
                  : nextLevel
                    ? `${nextLevel.level_small_blinde}/${nextLevel.level_big_blinde}`
                    : "-/-"}
            </div>
            <div className="text-xl4 font-satoshiBold">
              {nextLevel
                ? `${nextLevel.level_small_blinde}/${nextLevel.level_big_blinde}/${nextLevel.level_ante}`
                : "-/-"}
            </div>
          </div>

          <div className="space-y-4 text-right">
            <InfoItem
              label="Stack moyen"
              value={isLoadingDay1Data ? "-" : getAverageStackAlive()}
            />
            <InfoItem
              label="Joueurs"
              value={`${getAlivePlayers().length}/${
                getConfirmedPlayers().length
              }`}
            />
          </div>
        </div>

        <ChipLegend chips={chips ?? []} />
      </div>
    </div>
  );
}
