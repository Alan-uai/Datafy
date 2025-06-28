
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const { base64Image, imageType } = await request.json();
    
    if (!base64Image) {
      return NextResponse.json(
        { error: 'Base64 image is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.log('No API key configured, using basic text patterns');
      
      // Try to decode and analyze the image for basic patterns
      const extractedProducts = await extractProductsFromImageBasic(base64Image);
      
      return NextResponse.json({
        extractedProducts,
        message: extractedProducts.length > 0 
          ? `${extractedProducts.length} produto(s) identificado(s) usando análise básica`
          : 'Configure GEMINI_API_KEY para melhor extração de imagens'
      });
    }

    // TODO: Implement actual Gemini API call when key is available
    // For now, return the basic extraction
    const extractedProducts = await extractProductsFromImageBasic(base64Image);
    
    return NextResponse.json({
      extractedProducts,
      message: `${extractedProducts.length} produto(s) extraído(s)`
    });
    
  } catch (error) {
    console.error('Error in extract products API:', error);
    return NextResponse.json(
      { error: 'Failed to extract products from image', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

async function extractProductsFromImageBasic(base64Image: string) {
  try {
    console.log('Starting OCR text extraction from image...');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Initialize Tesseract worker with proper configuration for Next.js
    const worker = await createWorker({
      logger: m => console.log(m),
      workerPath: 'https://unpkg.com/tesseract.js@latest/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://unpkg.com/tesseract.js-core@latest/tesseract-core.wasm.js',
    });
    
    try {
      // Load Portuguese language
      await worker.loadLanguage('por');
      await worker.initialize('por');
      
      // Perform OCR
      const { data: { text } } = await worker.recognize(imageBuffer);
      console.log('OCR extracted text:', text);
      
      // Parse the extracted text for products
      const products = parseTextForProducts(text);
      
      await worker.terminate();
      return products;
      
    } catch (ocrError) {
      console.error('OCR error:', ocrError);
      await worker.terminate();
      return [];
    }
    
  } catch (error) {
    console.error('Error in basic image extraction:', error);
    return [];
  }
}

function parseTextForProducts(text: string) {
  const products = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common product keywords in Portuguese (expanded)
  const productKeywords = [
    'leite', 'pão', 'arroz', 'feijão', 'açúcar', 'sal', 'óleo', 'farinha', 
    'macarrão', 'biscoito', 'café', 'refrigerante', 'suco', 'água', 'carne', 
    'frango', 'peixe', 'queijo', 'presunto', 'margarina', 'manteiga', 'iogurte', 
    'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'banana', 'maçã', 'laranja',
    'detergente', 'sabão', 'shampoo', 'pasta', 'escova', 'coca', 'pepsi',
    'guaraná', 'sprite', 'fanta', 'heinz', 'nestlé', 'danone', 'vigor',
    'sadia', 'perdigão', 'seara', 'aurora', 'friboi', 'swift'
  ];
  
  // Date patterns (more flexible)
  const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
  
  console.log('Analyzing lines for products:', lines);
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip lines that are clearly not products
    if (line.length < 2 || /^\d+$/.test(line) || /^[R$]+\s*\d/.test(line)) {
      continue;
    }
    
    // Check if line contains product-like content
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const hasProductPattern = /[a-záéíóúçàãõ\s]+(kg|g|ml|l|un|unid|pct|pacote|caixa|lata|garrafa|litro|quilo|gramas)/i.test(lowerLine);
    const hasListStructure = /^[\-\*\•]\s*/.test(line); // Lines starting with bullets or dashes
    const containsLetters = /[a-záéíóúçàãõ]/i.test(line);
    
    const isProductLine = hasProductKeyword || hasProductPattern || hasListStructure || 
                         (containsLetters && line.length > 2 && !/^(data|valor|total|subtotal)/i.test(line));
    
    if (isProductLine) {
      console.log('Processing product line:', line);
      
      // Extract date if present
      let validade = '';
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        validade = formatDate(dateMatch[0]);
      }
      
      // Clean product name
      let productName = line
        .replace(/^[\-\*\•]\s*/, '') // Remove bullets
        .replace(datePattern, '') // Remove dates
        .replace(/\b(validade|venc|exp|data|prazo|val)\b/gi, '') // Remove date keywords
        .replace(/\b\d+[\/\-\.]\d+[\/\-\.]\d+\b/g, '') // Remove date patterns
        .replace(/\d+[.,]\d+/g, '') // Remove decimal numbers
        .replace(/R\$\s*\d+/gi, '') // Remove currency
        .replace(/\b(kg|g|ml|l|un|unid|pct|pacote|caixa|lata|garrafa|litro|quilo|gramas)\b/gi, '') // Remove units
        .replace(/\d+\s*(kg|g|ml|l)/gi, '') // Remove quantity + unit
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      // Extract unit information
      let unidade = '1';
      const unitMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|un|unid|pct|pacote|caixa|lata|garrafa|litro|quilo|gramas)/i);
      if (unitMatch) {
        unidade = `${unitMatch[1]}${unitMatch[2]}`;
      }
      
      // Clean up common OCR errors
      productName = productName
        .replace(/[|!@#$%^&*()_+={}[\]:";'<>?,./\\]/g, '') // Remove special chars
        .replace(/\b\d+\b/g, '') // Remove standalone numbers
        .trim();
      
      if (productName && productName.length > 2 && productName.length < 50) {
        products.push({
          produto: productName,
          marca: '',
          unidade: unidade,
          validade: validade || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }
  }
  
  console.log('Extracted products before deduplication:', products);
  
  // Remove duplicates and filter
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => 
      p.produto.toLowerCase().trim() === product.produto.toLowerCase().trim()
    )
  );
  
  return uniqueProducts.slice(0, 10); // Limit to 10 products
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
  const dateFormats = [
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, // DD/MM/YY
  ];
  
  for (const format of dateFormats) {
    const match = cleanDate.match(format);
    if (match) {
      let year = match[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
  }
  
  return '';
}
