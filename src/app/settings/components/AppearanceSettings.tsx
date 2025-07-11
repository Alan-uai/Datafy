
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Minimize2, Maximize2 } from 'lucide-react';

interface AppearanceSettingsProps {
    dashboardScale: 'normal' | 'compact';
    onScaleChange: (value: 'normal' | 'compact') => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ dashboardScale, onScaleChange }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Ajuste como o dashboard é exibido.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <Label className="text-base font-medium">Tamanho da Interface (Dashboard)</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                           O modo compacto exibe mais informações na tela, ideal para visualização rápida.
                        </p>
                        <RadioGroup
                          value={dashboardScale || 'normal'}
                          onValueChange={(value) => onScaleChange(value as 'normal' | 'compact')}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex-1">
                            <RadioGroupItem value="normal" id="scale-normal" className="peer sr-only" />
                            <Label 
                              htmlFor="scale-normal" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Maximize2 className="mb-3 h-6 w-6" />
                              Normal
                            </Label>
                          </div>
                          <div className="flex-1">
                            <RadioGroupItem value="compact" id="scale-compact" className="peer sr-only" />
                            <Label 
                              htmlFor="scale-compact" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Minimize2 className="mb-3 h-6 w-6" />
                                Compacto
                            </Label>
                          </div>
                        </RadioGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
