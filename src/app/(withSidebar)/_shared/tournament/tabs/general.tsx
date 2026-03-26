import { Card, Divider } from "@heroui/react";
import { BackgroundComponent } from "./components/background_components";
import { ClassementComponent } from "./components/classement_components";
import { formatDate, formatDateFr, formatDateFR, formatDurationFromMinutes, formatHour, formatHourFr, formatHourFR, formatHourUTC, parseLocalDateTime, toLocalISOString } from "@/app/utils/date";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";

export const GeneralTabs = () => {
  const { tournament, levels, registration, classement } =
    useTournamentContext();
    
    const startDate = tournament?.tournament_start_date
    ? new Date(tournament.tournament_start_date)
    : null;

  const openDate = tournament?.tournament_open_date
    ? new Date(tournament.tournament_open_date)
    : null;

  // Formattage des dates en UTC pour afficher l'heure brute telle qu'en DB
  const startDateString = startDate ? formatDateFr(startDate) : "";
  const startTimeString = startDate ? formatHourFr(startDate) : "";

  const openDateString = openDate ? formatDateFr(openDate) : "";
  const openTimeString = openDate ? formatHourFr(openDate) : "";

  const durationFormatted = tournament?.estimate_duration
    ? formatDurationFromMinutes(tournament.estimate_duration)
    : "";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex flex-col gap-5 w-full md:w-2/3">
        <div className="flex flex-col md:flex-row gap-6">
          <Card
            className="rounded-xl bg-background_card w-full md:w-3/4"
            fullWidth>
            <div className="flex flex-col gap-3">
              <p className="text-primary_brand-50 font-satoshiBold text-l px-5 py-3">
                Début du tournoi
              </p>
              <Divider />
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex flex-col px-5 py-3 gap-2 w-full">
                  <div className="flex flex-col justify-between w-full">
                    <p className="text-primary_brand-50 font-satoshiBold text-l">
                      Date
                    </p>
                    <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
                      {startDateString}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Divider orientation="vertical" />
                </div>
                <div className="flex flex-col px-5 py-3 gap-2 w-full">
                  <div className="flex flex-col justify-between w-full">
                    <p className="text-primary_brand-50 font-satoshiBold text-l">
                      Heure
                    </p>
                    <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
                      {startTimeString}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl bg-background_card p-5 w-full md:w-1/4 flex flex-col justify-between">
            <p className="text-primary_brand-50 font-satoshiBold text-l">
              Durée estimée
            </p>
            <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
              {durationFormatted}
            </p>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Card
            className="rounded-xl bg-background_card w-full md:w-3/4"
            fullWidth>
            <div className="flex flex-col gap-3">
              <p className="text-primary_brand-50 font-satoshiBold text-l px-5 py-3">
                Ouverture des inscriptions
              </p>
              <Divider />
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex flex-col px-5 py-3 gap-2 w-full">
                  <div className="flex flex-col justify-between w-full">
                    <p className="text-primary_brand-50 font-satoshiBold text-l">
                      Date
                    </p>
                    <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
                      {openDateString}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Divider orientation="vertical" />
                </div>
                <div className="flex flex-col px-5 py-3 gap-2 w-full">
                  <div className="flex flex-col justify-between w-full">
                    <p className="text-primary_brand-50 font-satoshiBold text-l">
                      Heure
                    </p>
                    <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
                      {openTimeString}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl bg-background_card p-5 w-full md:w-1/4 flex flex-col justify-between">
            <p className="text-primary_brand-50 font-satoshiBold text-l">
              Participants
            </p>
            <p className="text-xl text-right sm:text-xl4 text-primary_brand-50 font-satoshiBlack">
              {registration.length > 0
                ? `${
                    registration.filter((r) => r.statut == "Confirmed").length
                  }/${registration.length}`
                : "0"}
            </p>
          </Card>
        </div>

        {tournament && (
          <div className="hidden sm:block">
            <BackgroundComponent tournament={tournament} />
          </div>
        )}
      </div>

      <div className="w-full md:w-1/3">
        <ClassementComponent
          tournament_status={tournament?.tournament_status ?? "in_coming"}
          classement={classement}
        />
      </div>
    </div>
  );
};
