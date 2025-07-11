"use client";

import MatrixBackground from '@/components/shared/MatrixBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function MatrixPage() {
  return (
    <div className="relative min-h-screen">
      <MatrixBackground mode="padrão" speed={100} />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="bg-black/60 backdrop-blur-sm border-green-500/50 text-green-400">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot />
                    Matrix Page
                </CardTitle>
                <CardDescription className="text-green-400/70">
                    Esta é uma página de teste para o efeito de fundo Matrix.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>The Matrix has you...</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
