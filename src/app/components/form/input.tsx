import { Input } from "@heroui/react";

type InputProps = {
  label?: string;
  type: string;
  disabled?: boolean;
  inputClassName?: string;
  value: string;
  onChange: (e?: any) => void;
};

export const InputComponents: React.FC<InputProps> = ({
  label,
  type,
  inputClassName,
  value,
  disabled = false,
  onChange
}) => {
  return (
    <div className="flex flex-col gap-3">
      {label ? (
        <span className="text-l font-satoshiRegular text-primary_brand-50">
          {label}
        </span>
      ) : (
        <></>
      )}
      <Input
        isDisabled={disabled}
        className={"text-primary_brand-50"}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
