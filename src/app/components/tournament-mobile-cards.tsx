"use client";

import { useState } from "react";
import { TournamentRow } from "./table/table.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { STRINGS } from "../constants/string";
import { formatDate, formatDateFr } from "../utils/date";
import { ButtonComponents } from "./button";

interface TournamentMobileCardsProps {
  tournaments: TournamentRow[];
  onViewTournament: (id: string) => void;
}

export function TournamentMobileCards({ 
  tournaments, 
  onViewTournament 
}: TournamentMobileCardsProps) {
  const [sortBy, setSortBy] = useState("Date de tournoi");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "start":
        return "bg-purple-950";
      case "in_coming":
        return "bg-green-950";
      case "finish":
        return "bg-red-950";
      default:
        return "bg-green-950";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header avec tri */}
      <div className="flex items-center gap-2 text-white px-4">
        <span className="text-sm">Trier par</span>
        <div className="flex items-center gap-1">
          <span className="text-sm">{sortBy}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
        </div>
      </div>

      {/* Cartes des tournois */}
      <div className="flex flex-col gap-4 px-4 pb-4">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-ligth/10 rounded-lg p-4 flex flex-col gap-3"
          >
            {/* En-tête de la carte */}
            <div className="flex justify-between items-start pb-3 border-b border-ligth/30">
              <h3 className="font-bold text-white text-base">
                {tournament.name}
              </h3>
              <span className={`${getStatusColor(tournament.status)} text-white text-xs px-2 py-1 rounded-full`}>
                {tournament.status === "finish"
                          ? STRINGS.status.finish
                          : tournament.status === "in_coming"
                          ? STRINGS.status.in_coming
                          : STRINGS.status.start}
              </span>
            </div>

            {/* Informations du tournoi */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center pb-3 border-b border-ligth/30">
                <span className="text-white text-sm">Participants</span>
                <span className="text-white text-sm">{tournament.players}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-ligth/30">
                <span className="text-white text-sm">Date du tournoi</span>
                <span className="text-white text-sm">{formatDateFr(tournament.tournament_date)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-white text-sm">Date d&apos;ouverture</span>
                <span className="text-white text-sm">{formatDateFr(tournament.open_tournament_date)}</span>
              </div>
            </div>

            {/* Bouton d'action */}
            <ButtonComponents buttonClassName="bg-ligth/20 text-neutral-50" text="Voir le tournoi" onClick={() => onViewTournament(tournament.id)}/>
          </div>
        ))}
      </div>
    </div>
  );
} 