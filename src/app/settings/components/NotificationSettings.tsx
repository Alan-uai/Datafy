
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertTriangle, CalendarDays, Trophy } from 'lucide-react';
import type { UserPreferences, NotificationPreferences } from '@/lib/types';

interface NotificationSettingsProps {
    preferences: UserPreferences;
    onPreferencesChange: (prefs: Partial<UserPreferences>) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ preferences, onPreferencesChange }) => {
    
    const handleNotificationChange = (
        section: keyof NotificationPreferences,
        field: string,
        value: any
    ) => {
        const newNotifications = {
            ...preferences.notifications,
            [section]: {
                ...preferences.notifications[section],
                [field]: value
            }
        };
        onPreferencesChange({ notifications: newNotifications });
    };

    const notifs = preferences.notifications;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell />
                    Configurações de Notificação
                </CardTitle>
                <CardDescription>Gerencie como e quando você recebe alertas do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Estoque Baixo */}
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="low-stock-enabled" className="flex items-center gap-2 text-base font-medium">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Alertas de Estoque Baixo
                        </Label>
                        <Switch
                            id="low-stock-enabled"
                            checked={notifs.lowStock.enabled}
                            onCheckedChange={(checked) => handleNotificationChange('lowStock', 'enabled', checked)}
                        />
                    </div>
                    {notifs.lowStock.enabled && (
                        <div className="space-y-2 pl-7">
                            <Label htmlFor="low-stock-frequency">Frequência</Label>
                             <Select
                                value={notifs.lowStock.frequency}
                                onValueChange={(value) => handleNotificationChange('lowStock', 'frequency', value)}
                             >
                                <SelectTrigger id="low-stock-frequency">
                                    <SelectValue placeholder="Selecione a frequência..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Diariamente</SelectItem>
                                    <SelectItem value="weekly">Semanalmente</SelectItem>
                                    <SelectItem value="monthly">Mensalmente</SelectItem>
                                    <SelectItem value="custom" disabled>Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Validade Próxima */}
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="expiry-enabled" className="flex items-center gap-2 text-base font-medium">
                            <CalendarDays className="w-5 h-5 text-red-500" />
                            Alertas de Validade Próxima
                        </Label>
                        <Switch
                            id="expiry-enabled"
                            checked={notifs.expiry.enabled}
                            onCheckedChange={(checked) => handleNotificationChange('expiry', 'enabled', checked)}
                        />
                    </div>
                     {notifs.expiry.enabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                            <div className="space-y-2">
                                <Label htmlFor="expiry-threshold">Alertar com</Label>
                                 <Select
                                    value={notifs.expiry.thresholdDays.toString()}
                                    onValueChange={(value) => handleNotificationChange('expiry', 'thresholdDays', parseInt(value))}
                                >
                                    <SelectTrigger id="expiry-threshold">
                                        <SelectValue placeholder="Selecione o tempo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 dia de antecedência</SelectItem>
                                        <SelectItem value="7">7 dias de antecedência</SelectItem>
                                        <SelectItem value="15">15 dias de antecedência</SelectItem>
                                        <SelectItem value="30">30 dias de antecedência</SelectItem>
                                        <SelectItem value="custom" disabled>Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiry-frequency">Frequência</Label>
                                <Select
                                    value={notifs.expiry.frequency}
                                    onValueChange={(value) => handleNotificationChange('expiry', 'frequency', value)}
                                >
                                    <SelectTrigger id="expiry-frequency">
                                        <SelectValue placeholder="Selecione a frequência..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Diariamente</SelectItem>
                                        <SelectItem value="weekly">Semanalmente</SelectItem>
                                        <SelectItem value="monthly">Mensalmente</SelectItem>
                                        <SelectItem value="custom" disabled>Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Conquistas */}
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="achievements-enabled" className="flex items-center gap-2 text-base font-medium">
                            <Trophy className="w-5 h-5 text-green-500" />
                            Notificações de Conquistas
                        </Label>
                        <Switch
                            id="achievements-enabled"
                            checked={notifs.achievements.enabled}
                            onCheckedChange={(checked) => handleNotificationChange('achievements', 'enabled', checked)}
                        />
                    </div>
                     {notifs.achievements.enabled && (
                        <div className="space-y-2 pl-7">
                            <Label htmlFor="achievements-tier">Alertar para</Label>
                             <Select
                                value={notifs.achievements.tier}
                                onValueChange={(value) => handleNotificationChange('achievements', 'tier', value)}
                             >
                                <SelectTrigger id="achievements-tier">
                                    <SelectValue placeholder="Selecione o tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Qualquer conquista</SelectItem>
                                    <SelectItem value="silver">Apenas Prata+</SelectItem>
                                    <SelectItem value="gold">Apenas Ouro+</SelectItem>
                                    <SelectItem value="diamond">Apenas Diamante+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
