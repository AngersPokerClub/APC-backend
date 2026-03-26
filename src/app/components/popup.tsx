import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalContent
} from "@heroui/react";
import { ButtonComponents } from "./button";

type GenericModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
};


export const GenericModal: React.FC<GenericModalProps> = ({
  isOpen,
  onClose,
  title,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  children,
  loading = false,    // par défaut false
  disabled = false,   // par défaut false
}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg" className="p-4">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="text-primary_brand-50 font-satoshiBold text-l sm:text-xl">
              {title}
            </ModalHeader>
            <ModalBody className="bg-zinc-900 text-primary_brand-50 space-y-4 text-sm sm:text-base">
              {children}
            </ModalBody>
            <ModalFooter className="bg-zinc-900 flex flex-col sm:flex-row gap-2 justify-end sm:items-center">
              <ButtonComponents
                onClick={onCancel || onClose}
                buttonClassName="w-full sm:w-auto bg-transparent hover:bg-ligth/30"
                textClassName="text-danger-500"
                text={cancelLabel}
                disabled={loading || disabled}      // Empêche fermeture pendant chargement
              />
              <ButtonComponents
                onClick={onConfirm}
                buttonClassName="w-full sm:w-auto bg-primary_background hover:bg-primary_hover_background"
                textClassName="text-primary_brand-50"
                text={confirmLabel}
                loading={loading}                 // LE LOADER EST BRANCHÉ ICI
                disabled={loading || disabled}    // Empêche double clic/fermeture
              />
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

