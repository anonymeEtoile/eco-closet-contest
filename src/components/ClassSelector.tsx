import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const CLASS_TYPES = ['Seconde', 'Première', 'Terminale'];

interface ClassSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ value, onChange, className }) => {
  // Parse existing value
  const parseValue = (v: string) => {
    const parts = v.trim().split(' ');
    const type = CLASS_TYPES.find(t => parts[0]?.toLowerCase() === t.toLowerCase()) || '';
    const num = parts[1] || '';
    return { type, num };
  };

  const { type: initType, num: initNum } = parseValue(value);
  const [selectedType, setSelectedType] = useState(initType);
  const [num, setNum] = useState(initNum);

  const update = (t: string, n: string) => {
    const newType = t;
    const newNum = n.replace(/[^0-9]/g, '');
    setSelectedType(newType);
    setNum(newNum);
    if (newType && newNum) {
      onChange(`${newType} ${newNum}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Class type selector */}
      <div className="grid grid-cols-3 gap-2">
        {CLASS_TYPES.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => update(t, num)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              selectedType === t
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {/* Number input */}
      {selectedType && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{selectedType}</span>
          <input
            type="number"
            min="1"
            placeholder="N°"
            value={num}
            onChange={e => update(selectedType, e.target.value)}
            className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
      {value && <p className="text-xs text-muted-foreground">Classe : <span className="font-medium text-foreground">{value}</span></p>}
    </div>
  );
};

export default ClassSelector;
