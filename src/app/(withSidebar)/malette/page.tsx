"use client";

import { Stack } from "@/app/types";
import { Card, Input, useDisclosure } from "@heroui/react";
import React, { useState } from "react";
import { ButtonComponents } from "../../components/button";
import Link from "next/link";
import { GenericModal } from "../../components/popup";
import { InputComponents } from "../../components/form/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { useCreateStack, useDeleteStack, useStacks } from "@/app/hook/useStack";
import TabBar from "../../components/tabBar";

export default function StackPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newStackName, setNewStackName] = useState("");
  const [newStackTotalPlayer, setNewStackTotalPlayer] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stackToDelete, setStackToDelete] = useState<Stack | null>(null);

  // Hooks React Query
  const { data: stacks = [], isLoading: isStacksLoading } = useStacks();
  const createStackMutation = useCreateStack();
  const deleteStackMutation = useDeleteStack();

  const handleCreateStack = async () => {
    try {
      await createStackMutation.mutateAsync({
        stack_name: newStackName,
        stack_total_player: newStackTotalPlayer
      });

      setNewStackName("");
      setNewStackTotalPlayer(0);
      onClose();
    } catch (error) {
      console.error("Erreur création stack :", error);
      alert("Une erreur est survenue lors de la création du stack.");
    }
  };

  const handleDeleteStack = async () => {
    if (!stackToDelete) return;

    try {
      await deleteStackMutation.mutateAsync(stackToDelete.id);
      setStackToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erreur suppression stack :", error);
      alert("Une erreur est survenue.");
    }
  };

  if (isStacksLoading) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 md:px-10">
      {/* TabBar mobile */}
      <div className="block md:hidden mb-2">
        <TabBar />
      </div>

      {/* Bouton création stack */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <ButtonComponents
          text="Nouveau Stack"
          buttonClassName="bg-primary_brand-500 w-full sm:w-auto"
          textClassName="text-primary_brand-50"
          onClick={onOpen}
          // Ici pas de mutation → pas de loading direct
        />
      </div>

      {/* Grid des stacks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {stacks.map((stack) => {
          const sortedChips =
            stack.stack_chip
              ?.filter((sc) => sc.chip !== undefined)
              .map((sc) => sc.chip!)
              .sort((a, b) => a.value - b.value)
              .slice(0, 5) ?? [];

          return (
            <div key={stack.id} className="relative group">
              <Link href={`/malette/${stack.id}`}>
                <Card className="flex flex-col items-center justify-center gap-4 p-4 sm:p-6 bg-background_card rounded-2xl hover:cursor-pointer">
                  <div className="flex flex-row -space-x-4 sm:-space-x-6">
                    {sortedChips.map((chip, index) => (
                      <img
                        key={index}
                        src={chip.chip_image}
                        alt={`Jeton ${chip.value}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-1 border-black"
                      />
                    ))}
                  </div>
                  <p className="text-neutral-50 font-satoshi text-m sm:text-l">
                    {stack.stack_name}
                  </p>
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStackToDelete(stack);
                      setIsDeleteModalOpen(true);
                    }}
                    className="absolute top-2 right-2 text-lg p-1 rounded-full bg-danger-500 cursor-pointer active:opacity-50 text-white z-10 hover:bg-danger-700"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={20}
                      strokeWidth={1.5}
                    />
                  </span>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Modal création */}
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Nouveau stack"
        confirmLabel="Créer le stack"
        onConfirm={handleCreateStack}
        loading={createStackMutation.isLoading} // ✅ Loader activé sur le bouton de confirmation
      >
        <div className="flex flex-col gap-4">
          <InputComponents
            label="Nom du stack"
            type="text"
            value={newStackName}
            onChange={(e) => setNewStackName(e.target.value)}
          />
          <Input
            label="Stack par joueur"
            type="number"
            value={String(newStackTotalPlayer)}
            onChange={(e) =>
              setNewStackTotalPlayer(parseInt(e.target.value) || 0)
            }
            min={0}
          />
        </div>
      </GenericModal>

      {/* Modal suppression */}
      <GenericModal
        isOpen={isDeleteModalOpen}
        onClose={() => setStackToDelete(null)}
        title="Supprimer le stack"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleDeleteStack}
        loading={deleteStackMutation.isLoading} // ✅ Loader suppression
      >
        <p>
          Es-tu sûr de vouloir supprimer le stack{" "}
          <span className="font-semibold">{stackToDelete?.stack_name}</span> ?
        </p>
      </GenericModal>
    </div>
  );
}
