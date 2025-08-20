
// src/app/font-tester/[font]/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const fontClassMap: { [key: string]: string } = {
  datafy: 'font-body',
  'royal-inferno': 'font-royal-inferno',
  'who-is-hot': 'font-who-is-hot',
};

export default function FontVisualizerPage() {
  const params = useParams();
  const font = (params.font as string) || 'datafy';

  // Redirect to monogram page if that's the param
  if (font === 'monogram') {
      // This page is handled by /font-tester/monogram/page.tsx
      // We render a simple loading/redirecting state
      return <div>Carregando...</div>;
  }

  const selectedFontClass = fontClassMap[font] || 'font-body';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className={cn("flex-1 p-4 md:p-8 flex items-center justify-center", selectedFontClass)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-4xl capitalize">{font.replace('-', ' ')}</CardTitle>
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
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
