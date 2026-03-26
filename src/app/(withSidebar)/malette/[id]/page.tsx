"use client";

import { useParams } from "next/navigation";
import { useDisclosure, Card } from "@heroui/react";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { ButtonComponents } from "@/app/components/button";
import { GenericModal } from "@/app/components/popup";
import { InputComponents } from "@/app/components/form/input";
import { useStackById } from "@/app/hook/useStack";
import {
  useAllChips,
  useAddChipToStack,
  useCreateChipInStack,
  useRemoveChipFromStack,
} from "@/app/hook/useChips";
import { Chip } from "@/app/types";
import { useWpJetonImages } from "@/app/hook/useImages";
import { useUpdateChipImage } from "@/app/hook/useUpdateChipImages";
import { useCreateChipInStackWithImage } from "@/app/hook/useCreateChip";

export default function StackPage() {
  const { id } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedChipId, setSelectedChipId] = useState("");
  const [newJetonName, setNewJetonName] = useState("");
  const [chipToDelete, setChipToDelete] = useState<Chip | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // État pour gestion d'image WordPress uniquement
  const [isChangeImageOpen, setIsChangeImageOpen] = useState(false);
  const [imageSource, setImageSource] = useState<"wordpress" | null>(null);
  const { data: wpJetonImages = [], isLoading, error } = useWpJetonImages();
  const [selectedWpImageId, setSelectedWpImageId] = useState<number | null>(null);

  const { data: stack, isLoading: isChipLoading } = useStackById(String(id));
  const { data: allChips = [] } = useAllChips(isOpen);
  const addChipToStack = useAddChipToStack();
  const createChipInStack = useCreateChipInStack();
  const removeChipFromStack = useRemoveChipFromStack();
  const updateChipImage = useUpdateChipImage();
  const createChipInStackWithImage = useCreateChipInStackWithImage();

  const [pendingChipImage, setPendingChipImage] = useState<{ type: "wordpress", url: string } | null>(null);

  const sortedChips =
    stack?.stack_chip
      ?.filter((sc) => sc.chip !== undefined)
      .map((sc) => sc.chip!)
      .sort((a, b) => a.value - b.value) ?? [];

  const existingChipIds = new Set(sortedChips.map((chip) => chip.id));
  const availableChips = allChips.filter((chip: Chip) => !existingChipIds.has(chip.id));

  useEffect(() => {
    console.log("Données images récupérées depuis WordPress/FileBird:", wpJetonImages);
  }, [wpJetonImages]);

  const handleAddChip = async () => {
    if (!stack) return;
    if (selectedChipId) {
      // Cas ajout d’un chip existant
      await addChipToStack.mutateAsync({
        stackId: stack.id,
        chip_id: Number(selectedChipId),
      });
      setSelectedChipId("");
      setNewJetonName("");
      setPendingChipImage(null);
      onClose();
    } else {
      // Cas création nouveau chip
      if (!newJetonName || !pendingChipImage) {
        alert("Tu dois choisir une valeur et une image.");
        return;
      }
      try {
        await createChipInStackWithImage.mutateAsync({
          stackId: stack.id,
          value: Number(newJetonName),
          chipImage: pendingChipImage
        });
        setSelectedChipId("");
        setNewJetonName("");
        setPendingChipImage(null);
        onClose();
      } catch (error) {
        alert("Erreur lors de la création du jeton.");
      }
    }
  };

  const handleDeleteChip = async () => {
    if (!chipToDelete || !stack) return;

    try {
      await removeChipFromStack.mutateAsync({
        stackId: stack.id,
        chipId: chipToDelete.id,
      });
      setChipToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      alert("Erreur lors de la suppression du jeton.");
    }
  };

  const openChangeImage = () => {
    setIsChangeImageOpen(true);
    setImageSource(null);
    setSelectedWpImageId(null);
  };

  const handleConfirmChangeImage = async () => {
    if (imageSource === "wordpress" && selectedWpImageId !== null) {
      const selectedImage = wpJetonImages.find(img => img.ID === selectedWpImageId);
      if (!selectedImage) {
        alert("Image sélectionnée introuvable");
        return;
      }
      setPendingChipImage({
        type: "wordpress",
        url: selectedImage.guid.replace("angers-poker-club.local", "angers-poker-club.fr")
      });
      setIsChangeImageOpen(false);
    }
  };

  if (isChipLoading) {
    return <div className="text-center text-white">Chargement des jetons...</div>;
  }
  

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="font-satoshiBlack text-3xl sm:text-4xl text-primary_brand-50">Stacks</p>
        <ButtonComponents
          text="Nouveau jeton"
          buttonClassName="bg-primary_brand-500 w-full sm:w-auto"
          textClassName="text-primary_brand-50"
          onClick={onOpen}
        />
      </div>

      <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
        {sortedChips.map((chip: Chip) => (
          <Card
            key={chip.id}
            className="flex flex-col items-center p-4 gap-2 bg-background_card rounded-2xl w-28 sm:w-32"
          >
            <img
              className="rounded-lg w-20 h-20 sm:w-24 sm:h-24 object-contain"
              src={chip.chip_image}
              alt={`jeton ${chip.value}`}
            />
            <p className="text-neutral-50 font-satoshi text-m sm:text-l">{chip.value}</p>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setChipToDelete(chip);
                setIsDeleteModalOpen(true);
              }}
              className="text-lg px-3xs rounded-xl cursor-pointer active:opacity-50 text-neutral-50"
            >
              <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.5} />
            </span>
          </Card>
        ))}
      </div>

      {/* Modal Nouveau jeton */}
      <GenericModal isOpen={isOpen} onClose={onClose} title="Nouveau jeton" confirmLabel="Créer le jeton" onConfirm={handleAddChip}>
        <div className="flex flex-col gap-4 w-full">
          <label className="text-neutral-200">Sélectionner un jeton existant</label>
          <select
            value={selectedChipId}
            onChange={(e) => setSelectedChipId(e.target.value)}
            className="rounded border p-2 bg-neutral-50 text-black"
          >
            <option value="">Créer un nouveau jeton</option>
            {availableChips.map((chip: Chip) => (
              <option key={chip.id} value={chip.id}>
                {chip.value}
              </option>
            ))}
          </select>

          {!selectedChipId && (
            <>
              <div className="flex flex-col gap-3 justify-center items-center">
                {pendingChipImage ? (
                  <img className="rounded-lg" src={pendingChipImage.url} alt="jeton" width={155} height={155} />
                ) : (
                  <img
                    className="rounded-lg"
                    src="/images/ellipseAvatar.png"
                    alt="jeton"
                    width={155}
                    height={155}
                  />
                )}
                <ButtonComponents
                  text="Changer l'image"
                  buttonClassName="bg-primary_brand-500"
                  textClassName="text-primary_brand-50"
                  onClick={openChangeImage}
                />
              </div>
              <InputComponents
                label="valeur du jeton"
                type="text"
                value={newJetonName}
                onChange={(e) => setNewJetonName(e.target.value)}
              />
            </>
          )}
        </div>
      </GenericModal>

      {/* Modal Suppression jeton */}
      <GenericModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setChipToDelete(null);
          setIsDeleteModalOpen(false);
        }}
        title="Supprimer le chip"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleDeleteChip}
      >
        <p>
          Es-tu sûr de vouloir supprimer le chip <span className="font-semibold">{chipToDelete?.value}</span> ?
        </p>
      </GenericModal>

      {/* Modal Choix source image */}
      <GenericModal
        isOpen={isChangeImageOpen}
        onClose={() => setIsChangeImageOpen(false)}
        title="Choisir la source de l'image"
        cancelLabel="Annuler"
        confirmLabel={imageSource === "wordpress" && selectedWpImageId !== null ? "Utiliser" : undefined}
        onConfirm={handleConfirmChangeImage}
      >
        {!imageSource && (
          <div className="flex flex-col gap-3">
            {/* SUPPRESSION DU BOUTON LOCAL */}
            <ButtonComponents text="Depuis WordPress" buttonClassName="bg-primary_brand-500" onClick={() => setImageSource("wordpress")} />
          </div>
        )}

        {imageSource === "wordpress" && (
          <div className="max-h-60 overflow-auto flex flex-wrap gap-2 mt-3">
            {isLoading && <p className="text-neutral-200">Chargement…</p>}
            {error && <p className="text-red-400">Erreur lors du chargement.</p>}
            {!isLoading && !error && wpJetonImages.length === 0 && (
              <p className="text-neutral-200">Aucune image disponible</p>
            )}
            {!isLoading && !error && wpJetonImages.map((img) => {
              const imageUrl = img.guid.replace("angers-poker-club.local", "angers-poker-club.fr");
              return (
                <img
                  key={img.ID}
                  src={imageUrl}
                  alt={`jeton ${img.post_title ?? img.ID}`}
                  className={`cursor-pointer rounded border-4 ${
                    selectedWpImageId === img.ID ? "border-primary_brand-500" : "border-transparent"
                  }`}
                  onClick={() => setSelectedWpImageId(img.ID)}
                  style={{ width: 80, height: 80, objectFit: "contain" }}
                />
              );
            })}
          </div>
        )}
      </GenericModal>
    </div>
  );
}
