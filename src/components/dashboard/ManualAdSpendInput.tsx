import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PencilLine, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManualAdSpendInputProps {
  currentValue: number;
  onSubmit: (value: number) => void;
  isManual: boolean;
}

export function ManualAdSpendInput({ currentValue, onSubmit, isManual }: ManualAdSpendInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const num = parseFloat(value.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onSubmit(num);
      setOpen(false);
      setValue('');
    }
  };

  const handleClear = () => {
    onSubmit(-1); // signal to clear manual override
    setOpen(false);
    setValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 rounded-full',
            isManual ? 'text-warning hover:text-warning' : 'text-muted-foreground hover:text-foreground'
          )}
          title={isManual ? 'Gasto manual ativo — clique para editar' : 'Inserir gasto com ads manual'}
        >
          <PencilLine className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Gasto com Ads Manual</p>
          <p className="text-[10px] text-muted-foreground">
            Insira o valor manualmente caso a integração esteja com problema.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button size="sm" className="h-8 px-2" onClick={handleSubmit}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
          {isManual && (
            <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={handleClear}>
              Remover override — usar integração
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
