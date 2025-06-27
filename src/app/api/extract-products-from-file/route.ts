
import { NextRequest, NextResponse } from 'next/server';
import { addProduct } from '@/services/productService';

// Dynamic imports for file parsing libraries
const getPdfParse = () => import('pdf-parse').then(mod => mod.default);
const getXlsx = () => import('xlsx');
const getMammoth = () => import('mammoth');
const getCsvParser = () => import('csv-parser').then(mod => mod.default);

interface ExtractedProduct {
  produto: string;
  marca?: string;
  unidade?: string;
  validade?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const listId = formData.get('listId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !listId || !userId) {
      return NextResponse.json(
        { error: 'Arquivo, listId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedProducts: ExtractedProduct[] = [];
    const buffer = await file.arrayBuffer();

    try {
      if (file.type === 'application/pdf') {
        extractedProducts = await extractFromPDF(buffer);
      } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        extractedProducts = await extractFromExcel(buffer);
      } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
        extractedProducts = await extractFromWord(buffer);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        extractedProducts = await extractFromCSV(buffer);
      } else {
        return NextResponse.json(
          { error: 'Tipo de arquivo não suportado' },
          { status: 400 }
        );
      }

      console.log(`Extracted ${extractedProducts.length} products from ${file.name}`);

      // Add products to Firebase
      const addedProducts = [];
      for (const productData of extractedProducts) {
        if (productData.produto && productData.produto.trim()) {
          try {
            const newProduct = await addProduct(userId, listId, {
              produto: productData.produto.trim(),
              marca: productData.marca?.trim() || '',
              unidade: productData.unidade?.trim() || '1',
              validade: productData.validade || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
            addedProducts.push(newProduct);
          } catch (error) {
            console.error(`Error adding product ${productData.produto}:`, error);
          }
        }
      }

      return NextResponse.json({
        products: addedProducts,
        message: `${addedProducts.length} produto(s) adicionado(s) de ${file.name}`,
      });

    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return NextResponse.json(
        { error: `Erro ao processar arquivo: ${parseError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function extractFromPDF(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const pdfParse = await getPdfParse();
  const data = await pdfParse(Buffer.from(buffer));
  const text = data.text;
  
  return extractProductsFromText(text);
}

async function extractFromExcel(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const products: ExtractedProduct[] = [];
  
  // Skip header row and process data
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0 && row[0]) {
      products.push({
        produto: String(row[0]).trim(),
        marca: row[1] ? String(row[1]).trim() : '',
        unidade: row[2] ? String(row[2]).trim() : '1',
        validade: row[3] ? formatDate(String(row[3])) : '',
      });
    }
  }
  
  return products;
}

async function extractFromWord(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const mammoth = await getMammoth();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  const text = result.value;
  
  return extractProductsFromText(text);
}

async function extractFromCSV(buffer: ArrayBuffer): Promise<ExtractedProduct[]> {
  const csvParser = await getCsvParser();
  const text = Buffer.from(buffer).toString('utf-8');
  const lines = text.split('\n');
  const products: ExtractedProduct[] = [];
  
  // Skip header and process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      if (columns[0]) {
        products.push({
          produto: columns[0],
          marca: columns[1] || '',
          unidade: columns[2] || '1',
          validade: columns[3] ? formatDate(columns[3]) : '',
        });
      }
    }
  }
  
  return products;
}

function extractProductsFromText(text: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const lines = text.split('\n');
  
  // Common product keywords to help identify products
  const productKeywords = ['leite', 'pão', 'arroz', 'feijão', 'açúcar', 'sal', 'óleo', 'farinha', 'macarrão', 'biscoito', 'café', 'refrigerante', 'suco', 'água', 'carne', 'frango', 'peixe', 'queijo', 'presunto', 'margarina', 'manteiga', 'iogurte', 'verdura', 'fruta', 'tomate', 'cebola', 'alho', 'batata', 'cenoura'];
  
  // Date patterns
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})|(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 3) continue;
    
    // Check if line contains product-like content
    const lowerLine = cleanLine.toLowerCase();
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const hasProductPattern = /[a-záéíóúçàãõ\s]+(kg|g|ml|l|un|unid|pct|pacote|caixa|lata|garrafa|litro|quilo)/i.test(lowerLine);
    
    if (hasProductKeyword || hasProductPattern || (cleanLine.length > 3 && /^[a-záéíóúçàãõ\s\d\.]+$/i.test(cleanLine))) {
      // Extract date if present
      let validade = '';
      const dateMatch = cleanLine.match(datePattern);
      if (dateMatch) {
        validade = formatDate(dateMatch[0]);
      }
      
      // Extract product name (remove dates and common non-product words)
      let productName = cleanLine
        .replace(datePattern, '')
        .replace(/\b(validade|venc|exp|data|prazo)\b/gi, '')
        .replace(/\b\d+[\/\-]\d+[\/\-]\d+\b/g, '')
        .trim();
      
      if (productName && productName.length > 2) {
        products.push({
          produto: productName,
          marca: '',
          unidade: '1',
          validade: validade || '',
        });
      }
    }
  }
  
  return products;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Remove extra characters
  const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
  
  // Try to parse different date formats
  const dateFormats = [
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, // DD/MM/YY or DD-MM-YY
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
  ];
  
  for (const format of dateFormats) {
    const match = cleanDate.match(format);
    if (match) {
      if (format === dateFormats[2]) { // YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else { // DD/MM/YYYY or DD/MM/YY
        let year = match[3];
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  }
  
  return '';
}
