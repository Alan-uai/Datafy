
"use client"

import { MatrixBackground } from '@/components/shared/MatrixBackground';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function TestePage() {
  // We manually apply the classes and components here for isolated testing.
  return (
    <div className={cn('matrix', 'animate-cintilate')}>
      <MatrixBackground mode="padrão" speed={100} />
      <div className="relative z-10 flex h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
            <h1 className="text-5xl font-bold">Página de Teste Matrix</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Se você vê a "chuva digital" como fundo, o componente está funcionando.
            </p>
        </div>

        <Card className="mt-8 w-full max-w-md animate-rotate">
           <CardHeader>
                <CardTitle>Card de Teste</CardTitle>
           </CardHeader>
           <CardContent>
                <p>Este card deve ter um fundo semitransparente e uma borda animada, permitindo que a animação de fundo seja visível.</p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
