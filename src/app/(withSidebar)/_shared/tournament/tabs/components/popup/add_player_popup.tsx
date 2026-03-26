"use client";

import { InputComponents } from "@/app/components/form/input";
import { RadioGroupComponents } from "@/app/components/form/radio_group";
import { SearchBarComponents } from "@/app/components/form/search_bar";
import { useEffect, useState } from "react";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { User, WPUser } from "@/app/types/user.types";
import { useUsers } from "@/app/hook/useUsers";
import { Registration } from "@/app/types";

export const PlayerFormBody = ({
  onUpdate
}: {
  onUpdate: (data: {
    pseudo: string;
    firstName: string;
    lastName: string;
  }) => void;
}) => {
  const [isRegister, setIsRegister] = useState(true);
  const [search, setSearch] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const { tournament, registration } = useTournamentContext();

  const { data: players, isLoading: isPlayersLoading, error } = useUsers();

  useEffect(() => {
    onUpdate({ pseudo, firstName, lastName });
  }, [pseudo, firstName, lastName]);

  useEffect(() => {
    if (!players || !Array.isArray(players)) return;
  
    const filtered = players.filter((p): p is WPUser => {
      // ici p est de type User, mais la fonction sert à affirmer que p est un WPUser si condition vraie
      return (
        "display_name" in p &&
        (
          (p as WPUser).display_name.toLowerCase().startsWith(search.toLowerCase())
        ) &&
        !registration.some(
          (r) => r.wp_users?.display_name === p.display_name)
      );
    });
    
  
    setAvailablePlayers(filtered);
  }, [search, isRegister, registration, players]);
  

  return (
    <div className="flex flex-col gap-6 text-white w-full">
      <RadioGroupComponents
        label="Déjà inscrit au club ?"
        value={String(isRegister)}
        onChange={(e) => {
          setIsRegister(e.target.value === "true");
        }}
      />

      {isRegister ? (
        <div className="flex flex-col gap-4">
          <SearchBarComponents
            label="Rechercher un joueur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.length > 0 && (
            <ul className="bg-default-100 text-primary_brand-50 rounded-lg p-2 max-h-48 overflow-y-auto shadow-md">
              {availablePlayers.map((player) => (
                <li
                  key={player.ID}
                  className="py-1 px-2 rounded hover:bg-default-200 cursor-pointer transition-colors"
                  onClick={() => {
                    setPseudo(player.display_name);
                    setSearch(player.display_name);
                  }}>
                  {player.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <InputComponents
            label="Nom"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <InputComponents
            label="Prénom"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <InputComponents
            label="Pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
