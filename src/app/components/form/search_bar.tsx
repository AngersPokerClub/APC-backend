import { Input } from "@heroui/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type SearchBarProps = {
  label?: string;
  searchBarClassName?: string;
  value: string;
  onChange: (e?: any) => void;
};

export const SearchBarComponents: React.FC<SearchBarProps> = ({
  label,
  searchBarClassName,
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
      <Input
        endContent={
          <HugeiconsIcon
            icon={Search01Icon}
            className="text-2xl text-default-400 pointer-events-none flex-shrink-0"
          />
        }
        value={value}
        onChange={onChange}
        type="search"
      />
    </div>
  );
};
