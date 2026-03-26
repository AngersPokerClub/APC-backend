import {
  DatePicker,
  DateValue,
  Input,
  NumberInput,
  Radio,
  RadioGroup,
  TimeInput
} from "@heroui/react";

type RadioGroupProps = {
  label?: string;
  radioGroupClassName?: string;
  value: string;
  onChange: (e?: any) => void;
};

export const RadioGroupComponents: React.FC<RadioGroupProps> = ({
  label,
  radioGroupClassName,
  value,
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
      <RadioGroup
        defaultValue={value}
        onChange={onChange}
        orientation="horizontal">
        <Radio value="true" color="primary">
          Oui
        </Radio>
        <Radio value="false" color="primary">
          Non
        </Radio>
      </RadioGroup>
    </div>
  );
};
