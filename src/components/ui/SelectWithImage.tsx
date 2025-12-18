import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SafeImage } from "./SafeImage";

interface SelectItemData {
  value: string;
  label: string;
  imageUrl?: string;
  disabled?: boolean;
}

interface SelectWithImageProps {
  items: SelectItemData[];
  placeholder?: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function SelectWithImage({
  items,
  placeholder,
  value,
  onValueChange,
  label,
  className,
}: SelectWithImageProps) {
  const displayValue = value || "";
  const selectedItem = items.find((item) => item.value === displayValue);

  return (
    <Select value={displayValue} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full h-10", className)}>
        <SelectValue>
          {selectedItem?.imageUrl ? (
            <div className="flex items-center gap-3 w-full">
              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 p-0.5 bg-slate-100 border border-slate-200 mr-2">
                <SafeImage
                  src={selectedItem.imageUrl}
                  alt={selectedItem.label}
                  name={selectedItem.label}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="truncate">{selectedItem.label}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              disabled={item.disabled}
            >
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 p-0.5 bg-slate-100 border border-slate-200 mr-2">
                    <SafeImage
                      src={item.imageUrl}
                      alt={`Visualização da opção ${item.label}`}
                      name={item.label}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                {item.label}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
