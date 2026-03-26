"use client";

import LoadingComponent from "@/app/error/loading/page";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { Card, Divider } from "@heroui/react";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export const ChipTabs: React.FC = () => {
  const { tournament, assignements } = useTournamentContext();
  const { id } = useParams();
  const tournamentId = String(id);

  const [stackTotal, setStackTotal] = useState(0);
  const [stackPerPlayer, setStackPerPlayer] = useState(0);
  const [stackAverage, setStackAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // SOLIPOKER Day 2 special calculation state
  const [day1TotalChips, setDay1TotalChips] = useState<number | null>(null);
  const [isLoadingDay1Data, setIsLoadingDay1Data] = useState(false);

  const stackChips =
    tournament?.stack?.stack_chip?.filter((sc) => sc.chip !== undefined) ?? [];
  const chips = stackChips
    .map((sc) => sc.chip!)
    .sort((a, b) => a.value - b.value);

  const stackPerPlayerValue = tournament?.stack?.stack_total_player ?? 0;
  const aliveAssignements = assignements.filter((a) => !a.eliminated);
  const activePlayersCount = aliveAssignements.length;

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
        console.log("[ChipTabs SOLIPOKER Day 2] Loaded Day 1 data:", data);
      })
      .catch((err) => {
        console.error(
          "[ChipTabs SOLIPOKER Day 2] Error fetching Day 1 data:",
          err,
        );
        setDay1TotalChips(null);
      })
      .finally(() => {
        setIsLoadingDay1Data(false);
      });
  }, [tournament, tournamentId]);

  useEffect(() => {
    // Special calculation for SOLIPOKER Day 2
    if (isSolipokerDay2() && day1TotalChips !== null) {
      const total = day1TotalChips;
      const average =
        activePlayersCount > 0 ? Math.floor(total / activePlayersCount) : 0;

      setStackPerPlayer(stackPerPlayerValue); // Keep classic calculation
      setStackTotal(total); // Use Day 1 total chips
      setStackAverage(average); // Use Day 1 total chips / alive players
      setIsLoading(false);
      return;
    }

    // Classic calculation for all other tournaments
    const total = stackPerPlayerValue * activePlayersCount;
    const average =
      activePlayersCount > 0 ? Math.floor(total / activePlayersCount) : 0;

    setStackPerPlayer(stackPerPlayerValue);
    setStackTotal(total);
    setStackAverage(average);
    setIsLoading(false);
  }, [
    stackPerPlayerValue,
    aliveAssignements,
    day1TotalChips,
    activePlayersCount,
  ]);

  if (isLoading || isLoadingDay1Data) return <LoadingComponent />;

  if (chips.length === 0) {
    return (
      <div className="text-center text-white mt-10">
        Aucun jeton n&apos;a encore été défini pour ce tournoi.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col">
          <p className="p-5 font-satoshiBold text-l">
            {tournament?.stack?.stack_name}
          </p>
          <Divider />
          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-start items-center">
            {chips.map((chip, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col p-5 gap-2 items-center">
                  <img
                    src={chip.chip_image}
                    alt={`Jeton ${chip.value}`}
                    className="w-20 h-20 md:w-32 md:h-32"
                  />
                  <p className="text-center font-satoshiBlack text-2xl md:text-4xl">
                    {chip.value}
                  </p>
                </div>
                {index < chips.length - 1 && (
                  <div className="hidden md:block">
                    <Divider orientation="vertical" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row justify-between gap-6">
        {[
          { title: "Stack Total", value: stackTotal },
          { title: "Stack initial par joueur", value: stackPerPlayer },
          { title: "Stack moyen", value: stackAverage },
        ].map((card, index) => (
          <Card
            key={index}
            className="rounded-xl bg-background_card p-5 w-full"
          >
            <div className="flex flex-col justify-between self-stretch">
              <p className="text-primary_brand-50 font-satoshiBold text-l">
                {card.title}
              </p>
              <p className="text-xl text-right md:text-xl4 text-primary_brand-50 font-satoshiBlack">
                {card.value}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
