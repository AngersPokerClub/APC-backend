"use client";
import React, { useState } from "react";
import { GenericTable } from "../../components/table/generic_table";
import { seasonColumns } from "../../components/table/presets/season.config";
import { SeasonRow } from "../../components/table/table.types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { useCreateSeason } from "@/app/hook/useCreateSeason";
import TabBar from "../../components/tabBar";
import { ButtonComponents } from "../../components/button";
import { GenericModal } from "../../components/popup";
import { InputComponents } from "../../components/form/input";
import { useDisclosure } from "@heroui/react";
import { useAllSeasons } from "@/app/hook/useSeasonData";
import { useUpdateSeason } from "@/app/hook/useUpdateSeason";
import { useDeleteSeason } from "@/app/hook/useDeleteSeason";

type TrimesterInput = {
  name: string;
  start_date: string;
  end_date: string;
};

export default function SeasonsHome() {
  const { data, isLoading } = useAllSeasons();

  // Modales
  const {
    isOpen: createOpen,
    onOpen: createOnOpen,
    onClose: createOnClose,
  } = useDisclosure();

  const {
    isOpen: detailOpen,
    onOpen: detailOnOpen,
    onClose: detailOnClose,
  } = useDisclosure();

  const {
    isOpen: deleteOpen,
    onOpen: deleteOnOpen,
    onClose: deleteOnClose,
  } = useDisclosure();

  // Etats création/édition
  const [seasonName, setSeasonName] = useState("");
  const [seasonStartDate, setSeasonStartDate] = useState("");
  const [seasonEndDate, setSeasonEndDate] = useState("");
  const [seasonStatus, setSeasonStatus] = useState<"draft" | "in_progress" | "past">("draft");
  const [trimesters, setTrimesters] = useState<TrimesterInput[]>([
    { name: "T1", start_date: "", end_date: "" },
    { name: "T2", start_date: "", end_date: "" },
    { name: "T3", start_date: "", end_date: "" },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSeasonId, setEditSeasonId] = useState<number | null>(null);

  // Etats détail
  const [detailSeasonName, setDetailSeasonName] = useState("");
  const [detailSeasonStartDate, setDetailSeasonStartDate] = useState("");
  const [detailSeasonEndDate, setDetailSeasonEndDate] = useState("");
  const [detailSeasonStatus, setDetailSeasonStatus] = useState<"draft" | "in_progress" | "past">("draft");
  const [detailTrimesters, setDetailTrimesters] = useState<TrimesterInput[]>([]);

  // Suppression
  const [deleteSeasonId, setDeleteSeasonId] = useState<number | null>(null);

  // Mutations
  const createSeasonMutation = useCreateSeason();
  const updateSeasonMutation = useUpdateSeason();
  const deleteSeasonMutation = useDeleteSeason();

  // Handlers trimestres
  const handleTrimesterChange = (
    index: number,
    field: keyof TrimesterInput,
    value: string
  ) => {
    setTrimesters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Création / édition

  const resetForm = () => {
    setSeasonName("");
    setSeasonStartDate("");
    setSeasonEndDate("");
    setSeasonStatus("draft");
    setTrimesters([
      { name: "T1", start_date: "", end_date: "" },
      { name: "T2", start_date: "", end_date: "" },
      { name: "T3", start_date: "", end_date: "" },
    ]);
    setIsEditMode(false);
    setEditSeasonId(null);
  };

  const handleSubmitSeason = async () => {
    if (!seasonName || !seasonStartDate || !seasonEndDate) {
      alert("Veuillez remplir tous les champs de la saison.");
      return;
    }
  
    // Vérifier s'il y a déjà une saison en cours dans les données
    const seasonInProgressExists = data?.some(
      (season) => season.status === "in_progress" && editSeasonId !== null && season.id !== String(editSeasonId)
    );
  
    if (seasonInProgressExists && seasonStatus === "in_progress") {
      alert("Il ne peut y avoir qu'une seule saison en cours à la fois.");
      return;
    }
  
    try {
      if (!isEditMode) {
        await createSeasonMutation.mutateAsync({
          data: {
            name: seasonName,
            start_date: seasonStartDate,
            end_date: seasonEndDate,
            status: seasonStatus,
            trimesters,
          },
        });
      } else {
        await updateSeasonMutation.mutateAsync({
          id: editSeasonId!,
          data: {
            name: seasonName,
            start_date: seasonStartDate,
            end_date: seasonEndDate,
            status: seasonStatus,
            trimesters,
          },
        });
      }
      resetForm();
      createOnClose();
    } catch (error) {
      console.error("Erreur (création/édition) de saison :", error);
      alert("Une erreur est survenue lors de l'enregistrement de la saison.");
    }
  };
  

  // Edition
  const handleEditSeason = (item: SeasonRow & { trimester?: TrimesterInput[] }) => {
    setIsEditMode(true);
    setEditSeasonId(Number(item.id));
    setSeasonName(item.name);
    setSeasonStartDate(new Date(item.start_date).toISOString().substring(0, 10));
    setSeasonEndDate(new Date(item.end_date).toISOString().substring(0, 10));
    setSeasonStatus(
      item.status === "in_progress"
        ? "in_progress"
        : item.status === "draft"
        ? "draft"
        : "past"
    );
    setTrimesters(
      item.trimester || [
        { name: "T1", start_date: "", end_date: "" },
        { name: "T2", start_date: "", end_date: "" },
        { name: "T3", start_date: "", end_date: "" },
      ]
    );
    createOnOpen();
  };

  // Visualisation détail
  const handleViewSeason = (item: SeasonRow & { trimester?: TrimesterInput[] }) => {
    setDetailSeasonName(item.name);
    setDetailSeasonStartDate(new Date(item.start_date).toISOString().substring(0, 10));
    setDetailSeasonEndDate(new Date(item.end_date).toISOString().substring(0, 10));
    setDetailSeasonStatus(
      item.status === "in_progress"
        ? "in_progress"
        : item.status === "draft"
        ? "draft"
        : "past"
    );
    setDetailTrimesters(item.trimester || []);
    detailOnOpen();
  };

  // Suppression
  const handleDeleteSeasonPrompt = (id: number) => {
    setDeleteSeasonId(id);
    deleteOnOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deleteSeasonId) return;
    try {
      await deleteSeasonMutation.mutateAsync(deleteSeasonId);
      setDeleteSeasonId(null);
      deleteOnClose();
    } catch (error) {
      alert("Erreur lors de la suppression de la saison.");
    }
  };

  // Actions du tableau
  const getConditionalActions = (item: SeasonRow & { trimester?: TrimesterInput[] }) => [
    {
      tooltip: "Voir",
      icon: <HugeiconsIcon icon={ViewIcon} size={20} strokeWidth={1.5} />,
      onClick: () => handleViewSeason(item),
    },
    {
      tooltip: "Éditer",
      icon: <HugeiconsIcon icon={PencilEdit02Icon} size={20} strokeWidth={1.5} />,
      onClick: () => handleEditSeason(item),
    },
    {
      tooltip: "Supprimer",
      icon: <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.5} />,
      onClick: () => handleDeleteSeasonPrompt(Number(item.id)),
      color: "danger" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-white text-xl font-semibold">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:gap-6 w-full px-4 sm:px-6 md:px-10">
      <div className="block md:hidden mb-2">
        <TabBar />
      </div>
      <div className="flex justify-start mb-4">
        <ButtonComponents
          text="Nouvelle saison"
          buttonClassName="bg-primary_brand-500"
          textClassName="text-primary_brand-50"
          onClick={createOnOpen}
        />
      </div>

      {!data || data.length === 0 ? (
        <div className="text-center items-center justify-center text-white text-xl font-semibold">
          Aucune saison disponible pour le moment.
        </div>
      ) : (
        <div className="hidden md:flex flex-col gap-3">
          <h2 className="font-satoshiMedium text-l sm:text-xl3p2 leading-8 sm:leading-10">
            Saisons
          </h2>
          <div className="w-full overflow-x-auto">
            <GenericTable<SeasonRow & { trimester?: TrimesterInput[] }>
              items={data}
              columns={seasonColumns}
              ariaLabel="Liste des saisons"
              showActions
              actions={getConditionalActions}
              getDetailUrl={(id) => `/seasons/${id}`}
            />
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      <GenericModal
        isOpen={createOpen}
        onClose={() => {
          createOnClose();
          resetForm();
        }}
        title={isEditMode ? "Modifier la saison" : "Créer une nouvelle saison"}
        confirmLabel={isEditMode ? "Enregistrer les modifications" : "Créer la saison"}
        onConfirm={handleSubmitSeason}
        loading={isEditMode ? updateSeasonMutation.isLoading : createSeasonMutation.isLoading}
      >
        <div className="flex flex-col gap-4">
          <InputComponents
            label="Nom de la saison"
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
          />
          <InputComponents
            label="Date de début"
            type="date"
            value={seasonStartDate}
            onChange={(e) => setSeasonStartDate(e.target.value)}
          />
          <InputComponents
            label="Date de fin"
            type="date"
            value={seasonEndDate}
            onChange={(e) => setSeasonEndDate(e.target.value)}
          />
          <label className="flex flex-col gap-1">
            <span>Status de la saison</span>
            <select
              value={seasonStatus}
              onChange={(e) => setSeasonStatus(e.target.value as "draft" | "in_progress" | "past")}
              className="p-2 rounded bg-neutral-800 text-white"
            >
              <option value="draft">Brouillon</option>
              <option value="in_progress">En cours</option>
              <option value="past">Terminée</option>
            </select>
          </label>
          <hr className="my-4 border-neutral-700" />
          <div className="space-y-4">
            {trimesters.map((t, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 items-end">
                <InputComponents
                  label={`Nom du trimestre #${i + 1}`}
                  type="text"
                  value={t.name}
                  onChange={(e) => handleTrimesterChange(i, "name", e.target.value)}
                />
                <InputComponents
                  label="Date de début"
                  type="date"
                  value={t.start_date}
                  onChange={(e) => handleTrimesterChange(i, "start_date", e.target.value)}
                />
                <InputComponents
                  label="Date de fin"
                  type="date"
                  value={t.end_date}
                  onChange={(e) => handleTrimesterChange(i, "end_date", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </GenericModal>

      {/* Modal détail */}
      <GenericModal
        isOpen={detailOpen}
        onClose={detailOnClose}
        title="Détails de la saison"
        confirmLabel="Fermer"
        onConfirm={detailOnClose}
      >
        <div className="flex flex-col gap-4">
          <InputComponents
            label="Nom de la saison"
            type="text"
            value={detailSeasonName}
            disabled
            onChange={() => {}}
          />
          <InputComponents
            label="Date de début"
            type="date"
            value={detailSeasonStartDate}
            disabled
            onChange={() => {}}
          />
          <InputComponents
            label="Date de fin"
            type="date"
            value={detailSeasonEndDate}
            disabled
            onChange={() => {}}
          />
          <label className="flex flex-col gap-1">
            <span>Status de la saison</span>
            <select
              value={detailSeasonStatus}
              disabled
              className="p-2 rounded bg-neutral-700 text-white cursor-default"
              onChange={() => {}}
            >
              <option value="draft">Brouillon</option>
              <option value="in_progress">En cours</option>
              <option value="past">Terminée</option>
            </select>
          </label>
          <hr className="my-4 border-neutral-700" />
          <div className="space-y-4">
            {detailTrimesters.map((t, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 items-end">
                <InputComponents
                  label={`Nom du trimestre #${i + 1}`}
                  type="text"
                  value={t.name}
                  disabled
                  onChange={() => {}}
                />
                <InputComponents
                  label="Date de début"
                  type="date"
                  value={t.start_date}
                  disabled
                  onChange={() => {}}
                />
                <InputComponents
                  label="Date de fin"
                  type="date"
                  value={t.end_date}
                  disabled
                  onChange={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      </GenericModal>

      {/* Modal suppression */}
      <GenericModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteSeasonId(null);
          deleteOnClose();
        }}
        title="Supprimer la saison"
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        loading={deleteSeasonMutation.isLoading}
      >
        <p>Voulez-vous vraiment supprimer cette saison ? Cette action est irréversible.</p>
      </GenericModal>
    </div>
  );
}
