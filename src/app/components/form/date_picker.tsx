type DatePickerProps = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const DatePickerComponents: React.FC<DatePickerProps> = ({
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
        type="datetime-local"
        className="bg-neutral-800 text-white p-2 rounded-md"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
