'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';

export function DateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const date = searchParams.get('date') || '';
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
            newParams.set('date', e.target.value);
        } else {
            newParams.delete('date');
        }
        // Reset page when filtering
        newParams.delete('page');
        router.push(`?${newParams.toString()}`);
    };

    const handleIconClick = () => {
        if (inputRef.current) {
            try {
                if ('showPicker' in HTMLInputElement.prototype) {
                    inputRef.current.showPicker();
                } else {
                    inputRef.current.click();
                }
            } catch (err) {
                inputRef.current.click();
            }
        }
    };

    return (
        <div className="flex items-center gap-4 text-foreground">
            <div className="grid w-full max-w-sm items-center gap-1.5 relative">
                <Label htmlFor="date-filter">Filtrar por Data de Envio</Label>
                <div className="relative">
                    <Input
                        ref={inputRef}
                        type="date"
                        id="date-filter"
                        value={date}
                        onChange={handleDateChange}
                        className="w-48 pl-10 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                    <CalendarIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={handleIconClick}
                    />
                </div>
            </div>
        </div>
    );
}
