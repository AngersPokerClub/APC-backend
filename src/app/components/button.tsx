import { Button } from "@heroui/react";
import React from "react";

type ButtonProps = {
  text?: string;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  onClick?: () => void;
  buttonClassName?: string;
  textClassName?: string;
  disabled?: boolean;
  loading?: boolean;  // Nouvelle prop pour indiquer si en chargement
};

export const ButtonComponents: React.FC<ButtonProps> = ({
  text,
  icon,
  iconOnly = false,
  onClick,
  buttonClassName = "",
  textClassName = "",
  disabled = false,
  loading = false,
}) => {
  return (
    <Button
      onPress={onClick}
      radius="lg"
      variant="light"
      isIconOnly={iconOnly}
      disabled={disabled || loading} // désactiver pendant chargement
      className={`flex items-center justify-center gap-2 sm:gap-3 rounded-xl cursor-pointer transition-all duration-200
        ${iconOnly ? "p-2" : "px-3 py-2 sm:px-4 sm:py-2"} 
        ${buttonClassName}`}
    >
      {loading ? (
        // Affiche un loader ici - par exemple un spinner simple
        <span className="loader">Loading...</span>
      ) : (
        <>
          {!iconOnly && text && (
            <span className={`text-sm sm:text-base md:text-lg font-satoshiRegular ${textClassName}`}>
              {text}
            </span>
          )}
          {icon}
        </>
      )}
    </Button>
  );
};
