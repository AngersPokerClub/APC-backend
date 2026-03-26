import { NumberInput } from "@heroui/react";

type NumberInputProps = {
  label?: string;
  type: string;
  numberInputClassName?: string;
  value: number;
  onChange: ((value: number) => void) &
    React.ChangeEventHandler<HTMLInputElement>;
};

export const NumberInputComponents: React.FC<NumberInputProps> = ({
  label,
  numberInputClassName,
  value,
  onChange
}) => {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className="text-l font-satoshiRegular text-primary_brand-50">
          {label}
        </span>
      )}
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
};
