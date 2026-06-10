'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODEL_CATALOG } from '@/lib/types';

interface Props {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

export function ModelSelect({ value, onValueChange, placeholder = 'Select a model' }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {MODEL_CATALOG.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="font-medium">{m.label}</span>
            <span className="ml-2 text-[10px] uppercase tracking-eyebrow text-muted">
              {m.provider}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
