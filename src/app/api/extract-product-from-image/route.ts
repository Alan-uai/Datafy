// ===== OPÇÃO 1: API ROUTE (Recomendado) =====
// app/api/extract-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from '@genkit-ai/flow';
import extractProductFlow from '@/ai/flows/extract-product-from-image-flow';

export async function POST(request: NextRequest) {
  try {
    const { base64Image, imageType } = await request.json();
    
    if (!base64Image) {
      return NextResponse.json(
        { error: 'Base64 image is required' },
        { status: 400 }
      );
    }
    
    // Usar runFlow para executar o flow
    const result = await runFlow(extractProductFlow, {
      base64Image,
      imageType: imageType || 'image/jpeg'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in extract products API:', error);
    return NextResponse.json(
      { error: 'Failed to extract products from image', details: error.message },
      { status: 500 }
    );
  }
}

// ===== OPÇÃO 2: COMPONENTE REACT =====
// components/AddProductsFromImageDialog.tsx
import { useCallback, useState } from 'react';

export function AddProductsFromImageDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState([]);

  const handleExtractProducts = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      
      // Converter file para base64
      const base64Image = await fileToBase64(file);
      
      // Chamar a API route em vez do flow diretamente
      const response = await fetch('/api/extract-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image,
          imageType: file.type
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract products');
      }
      
      const result = await response.json();
      setExtractedProducts(result.extractedProducts);
      
      console.log('Extracted products:', result.extractedProducts);
      
    } catch (error) {
      console.error('Error extracting products from image:', error);
      // Mostrar erro para o usuário
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div>
      {/* Seu componente aqui */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleExtractProducts(file);
          }
        }}
      />
      {isLoading && <div>Extraindo produtos...</div>}
      {extractedProducts.length > 0 && (
        <div>
          <h3>Produtos encontrados:</h3>
          {extractedProducts.map((product, index) => (
            <div key={index}>
              <p><strong>Produto:</strong> {product.produto}</p>
              <p><strong>Marca:</strong> {product.marca}</p>
              <p><strong>Unidade:</strong> {product.unidade}</p>
              <p><strong>Validade:</strong> {product.validade}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Função auxiliar para converter file para base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// ===== OPÇÃO 3: USO DIRETO DO FLOW (Server-side apenas) =====
// Só funciona em contexto server-side (API routes, server actions, etc.)
import { runFlow } from '@genkit-ai/flow';
import extractProductFlow from '@/ai/flows/extract-product-from-image-flow';

export async function extractProductsServerAction(base64Image: string, imageType: string = 'image/jpeg') {
  'use server';
  
  try {
    const result = await runFlow(extractProductFlow, {
      base64Image,
      imageType
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error extracting products:', error);
    return { success: false, error: error.message };
  }
}

// ===== CONFIGURAÇÃO NECESSÁRIA =====
// genkit.config.ts (na raiz do projeto)
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// .env.local
// GOOGLE_GENAI_API_KEY=sua_api_key_aqui