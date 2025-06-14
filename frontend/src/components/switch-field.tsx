import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const SwitchField = ({ className, label, checked, disabled, onChange, description }: {
    label: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (val: boolean) => void;
    description?: string;
    className?: string
}) => (
    <div className="flex w-full items-center justify-between">
        <div className={cn('w-full', className)}>
            <Label title={label} className="text-xs">{label}</Label>
            {description && <p title={description} className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
        <Switch disabled={disabled} checked={checked} onCheckedChange={onChange} />
    </div>
);

const NumberField = ({ className, label, value, min, max, disabled, onChange, description }: {
    label: string;
    value: number;
    min: number;
    max: number;
    disabled?: boolean;
    onChange: (val: number) => void;
    description?: string;
    className?: string
}) => (
    <div className="space-y-2">
        <Label className={cn('text-xs', className)}>{label}</Label>
        <Input
            type="number"
            disabled={disabled}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24"
        />
        {description && <p title={description} className="text-xs text-muted-foreground">{description}</p>}
    </div>
);

const SelectField = ({ className, label, disabled, value, options, onChange, description }: {
    label: string;
    value: string;
    disabled?: boolean;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    description?: string;
    className?: string
}) => (
    <div className="space-y-2">
        <Label className={cn('text-xs', className)}>{label}</Label>
        <Select disabled={disabled} value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        {description && <p title={description} className="text-xs text-muted-foreground">{description}</p>}
    </div>
);

export {
    SwitchField,
    NumberField,
    SelectField
}