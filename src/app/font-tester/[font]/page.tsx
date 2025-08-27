
// src/app/font-tester/[font]/page.tsx
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import type { FontName } from '@/lib/types'; // Assuming FontName type exists

const fontClassMap: { [key: string]: string } = {
  default: 'font-sans',
  datafy: 'font-body',
  'royal-inferno': 'font-royal-inferno',
  'who-is-hot': 'font-who-is-hot',
};

export default function FontVisualizerPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, savePreferences } = useUserProfile();
  const { toast } = useToast();
  
  const font = (params.font as string) || 'default';

  if (font === 'monogram') {
      return <div>Carregando...</div>;
  }

  const selectedFontClass = fontClassMap[font] || 'font-sans';
  const fontLabel = font === 'default' ? 'Padrão' : font.replace('-', ' ');

  const handleApplyFont = () => {
    if (userProfile) {
      savePreferences({ activeFont: font as FontName });
      toast({
        title: "Fonte Aplicada!",
        description: `A fonte "${fontLabel}" foi definida como padrão para o site.`,
      });
      router.push('/settings');
    }
  };

  return (
    <div className={cn("flex flex-col min-h-screen bg-background text-foreground", selectedFontClass)}>
      <Header />
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-4xl capitalize">{fontLabel}</CardTitle>
              <CardDescription>The quick brown fox jumps over the lazy dog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-lg">
              <div className="space-y-2">
                <h1 className="text-5xl font-bold">Heading 1</h1>
                <p>This is a paragraph. It illustrates the body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.</p>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-semibold">Heading 2</h2>
                <p>This is a paragraph. It illustrates the body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-medium">Heading 3</h3>
                <blockquote className="border-l-4 pl-4 italic">
                  "This is a blockquote, perfect for highlighting a key phrase or quote."
                </blockquote>
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl">Heading 4</h4>
                <p>An example of <strong>bold text</strong>, <em>italic text</em>, and a <a href="#" className="underline">link</a>.</p>
              </div>
              <div className="font-code bg-muted p-4 rounded-lg">
                <p className="text-sm">This is a code block, using a different font for code:</p>
                <pre><code>{`const greeting = "Hello, World!";\nconsole.log(greeting);`}</code></pre>
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleApplyFont} className="w-full">
                    Aplicar Fonte ao Site
                </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
