"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useVoiceCommand } from '@/contexts/VoiceCommandContext';

export default function SettingsPage() {
  const { testMicrophone } = useVoiceCommand();
  
  // State for Visual Experience
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // State for Notification Preferences
  const [attentionHorizonDays, setAttentionHorizonDays] = useState(30);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailSummaries, setEmailSummaries] = useState(false);

  // State for AI Preferences
  const [suggestProductNameAI, setSuggestProductNameAI] = useState(true);
  const [suggestListIconAI, setSuggestListIconAI] = useState(true);
  const [reportFrequency, setReportFrequency] = useState("weekly");

  // State for Voice Command Customization
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(false);
  const [voiceActivationKeyword, setVoiceActivationKeyword] = useState("datafy");

  // State for Display Preferences
  const [defaultSortOrder, setDefaultSortOrder] = useState("expiry_date_asc");
  const [defaultFilters, setDefaultFilters] = useState("none"); // e.g., "none", "hide_expired", "critical_items"

  // State for Location Preferences
  const [language, setLanguage] = useState("pt-BR");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");

  // Effect to load settings from localStorage on mount
  useEffect(() => {
    const loadSetting = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, parser: (value: string) => T, defaultValue: T) => {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        setter(parser(savedValue));
      } else {
        setter(defaultValue);
      }
    };

    loadSetting('datafy-animations-enabled', setAnimationsEnabled, JSON.parse, true);
    loadSetting('datafy-attention-horizon-days', setAttentionHorizonDays, Number, 30);
    loadSetting('datafy-in-app-notifications', setInAppNotifications, JSON.parse, true);
    loadSetting('datafy-push-notifications', setPushNotifications, JSON.parse, false);
    loadSetting('datafy-email-summaries', setEmailSummaries, JSON.parse, false);
    loadSetting('datafy-ai-suggest-product-name', setSuggestProductNameAI, JSON.parse, true);
    loadSetting('datafy-ai-suggest-list-icon', setSuggestListIconAI, JSON.parse, true);
    loadSetting('datafy-ai-report-frequency', setReportFrequency, (v) => v, "weekly");
    loadSetting('datafy-voice-command-enabled', setVoiceCommandEnabled, JSON.parse, false);
    loadSetting('datafy-voice-activation-keyword', setVoiceActivationKeyword, (v) => v, "datafy");
    loadSetting('datafy-default-sort-order', setDefaultSortOrder, (v) => v, "expiry_date_asc");
    loadSetting('datafy-default-filters', setDefaultFilters, (v) => v, "none");
    loadSetting('datafy-language', setLanguage, (v) => v, "pt-BR");
    loadSetting('datafy-date-format', setDateFormat, (v) => v, "dd/mm/yyyy");

  }, []);

  // Effects to save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('datafy-animations-enabled', JSON.stringify(animationsEnabled));
    if (animationsEnabled) {
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.classList.add('no-animations');
    }
  }, [animationsEnabled]);

  useEffect(() => {
    localStorage.setItem('datafy-attention-horizon-days', String(attentionHorizonDays));
  }, [attentionHorizonDays]);

  useEffect(() => {
    localStorage.setItem('datafy-in-app-notifications', JSON.stringify(inAppNotifications));
  }, [inAppNotifications]);

  useEffect(() => {
    localStorage.setItem('datafy-push-notifications', JSON.stringify(pushNotifications));
  }, [pushNotifications]);

  useEffect(() => {
    localStorage.setItem('datafy-email-summaries', JSON.stringify(emailSummaries));
  }, [emailSummaries]);

  useEffect(() => {
    localStorage.setItem('datafy-ai-suggest-product-name', JSON.stringify(suggestProductNameAI));
  }, [suggestProductNameAI]);

  useEffect(() => {
    localStorage.setItem('datafy-ai-suggest-list-icon', JSON.stringify(suggestListIconAI));
  }, [suggestListIconAI]);

  useEffect(() => {
    localStorage.setItem('datafy-ai-report-frequency', reportFrequency);
  }, [reportFrequency]);

  useEffect(() => {
    localStorage.setItem('datafy-voice-command-enabled', JSON.stringify(voiceCommandEnabled));
  }, [voiceCommandEnabled]);

  useEffect(() => {
    localStorage.setItem('datafy-voice-activation-keyword', voiceActivationKeyword);
  }, [voiceActivationKeyword]);

  useEffect(() => {
    localStorage.setItem('datafy-default-sort-order', defaultSortOrder);
  }, [defaultSortOrder]);

  useEffect(() => {
    localStorage.setItem('datafy-default-filters', defaultFilters);
  }, [defaultFilters]);

  useEffect(() => {
    localStorage.setItem('datafy-language', language);
    // Implement actual language change application if needed (e.g., i18n library)
  }, [language]);

  useEffect(() => {
    localStorage.setItem('datafy-date-format', dateFormat);
    // Implement actual date format application if needed
  }, [dateFormat]);

  

  const handleExportData = () => {
    alert("Exportar dados (implementação necessária)");
    // Implement actual data export logic here
  };

  const handleImportData = () => {
    alert("Importar dados (implementação necessária)");
    // Implement actual data import logic here
  };

  const handleConfigure2FA = () => {
    alert("Configurar Autenticação de Dois Fatores (implementação necessária)");
    // Implement 2FA setup logic here
  };

  const handleManageActiveSessions = () => {
    alert("Gerenciar Sessões Ativas (implementação necessária)");
    // Implement active sessions management logic here
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Configurações</h1>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Seção 1: Experiência Visual */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Experiência Visual</h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="animations-toggle">Desativar Animações</Label>
            <Switch
              id="animations-toggle"
              checked={!animationsEnabled} // Switch is checked when animations are DISABLED
              onCheckedChange={(checked) => setAnimationsEnabled(!checked)}
            />
          </div>
        </section>

        {/* Seção 2: Notificações de Validade */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Notificações de Validade</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="attention-horizon">Horizonte de Atenção (dias)</Label>
              <Input
                id="attention-horizon"
                type="number"
                min="1"
                value={attentionHorizonDays}
                onChange={(e) => setAttentionHorizonDays(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="in-app-notifications">Notificações no Aplicativo</Label>
              <Switch
                id="in-app-notifications"
                checked={inAppNotifications}
                onCheckedChange={setInAppNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Notificações Push (Requer Permissão)</Label>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-summaries">Resumos por E-mail</Label>
              <Switch
                id="email-summaries"
                checked={emailSummaries}
                onCheckedChange={setEmailSummaries}
              />
            </div>
          </div>
        </section>

        {/* Seção 3: Preferências de IA (Datafy AI) */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Preferências de IA</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="suggest-product-name-ai">Sugestão de Nome de Produto (IA)</Label>
              <Switch
                id="suggest-product-name-ai"
                checked={suggestProductNameAI}
                onCheckedChange={setSuggestProductNameAI}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="suggest-list-icon-ai">Sugestão de Ícone de Lista (IA)</Label>
              <Switch
                id="suggest-list-icon-ai"
                checked={suggestListIconAI}
                onCheckedChange={setSuggestListIconAI}
              />
            </div>
            <div>
              <Label htmlFor="report-frequency">Frequência de Relatórios de Validade</Label>
              <Select value={reportFrequency} onValueChange={setReportFrequency}>
                <SelectTrigger id="report-frequency" className="w-full mt-1">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Seção 4: Customização de Comando de Voz */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Comando de Voz</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-command-toggle">Ativar Comando de Voz</Label>
              <Switch
                id="voice-command-toggle"
                checked={voiceCommandEnabled}
                onCheckedChange={setVoiceCommandEnabled}
              />
            </div>
            <div>
              <Label htmlFor="voice-keyword">Palavra de Ativação</Label>
              <Input
                id="voice-keyword"
                type="text"
                value={voiceActivationKeyword}
                onChange={(e) => setVoiceActivationKeyword(e.target.value)}
                className="mt-1"
                placeholder="Ex: Datafy, Assistente"
              />
            </div>
            <div>
              <Button 
                onClick={testMicrophone}
                className="w-full"
                variant="outline"
              >
                Testar Microfone e Comandos
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Teste se o microfone está funcionando e se os comandos são reconhecidos corretamente.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 5: Gerenciamento de Dados */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Dados</h2>
          <div className="space-y-4">
            <Button className="w-full" onClick={handleExportData}>Exportar Todos os Dados (CSV/JSON)</Button>
            <Button className="w-full" onClick={handleImportData}>Importar Dados</Button>
          </div>
        </section>

        {/* Seção 6: Segurança e Conta */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Segurança e Conta</h2>
          <div className="space-y-4">
            <Button className="w-full" onClick={handleConfigure2FA}>Configurar Autenticação de Dois Fatores (2FA)</Button>
            <Button className="w-full" onClick={handleManageActiveSessions}>Gerenciar Sessões Ativas</Button>
          </div>
        </section>

        {/* Seção 7: Preferências de Exibição */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Preferências de Exibição</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-sort-order">Ordenação Padrão de Produtos</Label>
              <Select value={defaultSortOrder} onValueChange={setDefaultSortOrder}>
                <SelectTrigger id="default-sort-order" className="w-full mt-1">
                  <SelectValue placeholder="Selecione a ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiry_date_asc">Data de Validade (Crescente)</SelectItem>
                  <SelectItem value="expiry_date_desc">Data de Validade (Decrescente)</SelectItem>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="risk_score_desc">Score de Risco (Decrescente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default-filters">Filtros Padrão ao Abrir Lista</Label>
              <Select value={defaultFilters} onValueChange={setDefaultFilters}>
                <SelectTrigger id="default-filters" className="w-full mt-1">
                  <SelectValue placeholder="Selecione os filtros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="hide_expired">Ocultar Vencidos</SelectItem>
                  <SelectItem value="critical_items">Mostrar Apenas Itens Críticos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Seção 8: Localização */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Localização</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="language-select">Idioma da Interface</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language-select" className="w-full mt-1">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-format-select">Formato de Data e Hora</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="date-format-select" className="w-full mt-1">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Seção 10: Informações e Diagnósticos */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Informações e Diagnósticos</h2>
          <div className="space-y-4">
            <p className="text-sm">Versão do Aplicativo: <span className="font-semibold">1.0.0</span></p> {/* Placeholder version */}
            <Button className="w-full" onClick={() => alert("Limpar cache local (implementação necessária)")}>Limpar Cache Local</Button>
          </div>
        </section>
      </div>
    </div>
  );
}