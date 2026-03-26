type TimeInputProps = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TimeInputComponents: React.FC<TimeInputProps> = ({
  label,
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
      <input
        type="time"
        step="60"
        className=" bg-default-100 hover:bg-default-200 text-white p-2 rounded-md"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
