import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright';

// Extend Window interface for PDF.js properties
declare global {
  interface Window {
    pdfRendered?: boolean;
    pdfError?: Error | string;
  }
}

const convertPdfToImages = async (pdfBuffer: Buffer): Promise<string[]> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  
  try {
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: white;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #pdf-container {
            width: 794px;
            height: 1123px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        canvas {
            max-width: 100%;
            max-height: 100%;
            border: 1px solid #ccc;
        }
        #loading {
            font-family: Arial, sans-serif;
            color: #666;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
    <div id="pdf-container">
        <div id="loading">Loading PDF...</div>
        <canvas id="pdf-canvas" style="display: none;"></canvas>
    </div>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        async function renderPDF() {
            try {
                const pdfData = '${pdfBase64}';
                const binaryString = atob(pdfData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
                
                if (pdf.numPages === 0) {
                    throw new Error('PDF has no pages');
                }
                
                const page = await pdf.getPage(1);
                
                const canvas = document.getElementById('pdf-canvas');
                const context = canvas.getContext('2d');
                
                const viewport = page.getViewport({ scale: 1 });
                const scaleX = 794 / viewport.width;
                const scaleY = 1123 / viewport.height;
                const scale = Math.min(scaleX, scaleY, 2);
                
                const scaledViewport = page.getViewport({ scale });
                
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };
                
                await page.render(renderContext).promise;
                
                document.getElementById('loading').style.display = 'none';
                canvas.style.display = 'block';
                
                document.body.setAttribute('data-pdf-rendered', 'true');
                
            } catch (error) {
                document.getElementById('loading').textContent = 'Error loading PDF: ' + error.message;
                document.body.setAttribute('data-pdf-error', 'true');
            }
        }
        
        window.addEventListener('load', renderPDF);
    </script>
</body>
</html>`;
    
    const htmlPath = path.join(tempDir, 'pdf-viewer.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 }
    });
    
    const page = await context.newPage();
    
    const base64Data = pdfBuffer.toString('base64');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; background: white; }
            #pdf-container { width: 100%; }
            canvas { display: block; margin: 20px 0; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div id="pdf-container"></div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            async function renderPDF() {
              try {
                const pdfData = atob('${base64Data}');
                const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;
                const container = document.getElementById('pdf-container');
                
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  const viewport = page.getViewport({scale: 2.0});
                  
                  const canvas = document.createElement('canvas');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  canvas.id = 'page-' + pageNum;
                  
                  const context = canvas.getContext('2d');
                  await page.render({canvasContext: context, viewport: viewport}).promise;
                  
                  container.appendChild(canvas);
                }
                
                window.pdfRendered = true;
              } catch (error) {
                console.error('PDF rendering error:', error);
                window.pdfError = error;
              }
            }
            
            renderPDF();
          </script>
        </body>
      </html>
    `);

    await page.waitForFunction(() => window.pdfRendered || window.pdfError, { timeout: 30000 });
    
    const pdfError = await page.evaluate(() => window.pdfError);
    if (pdfError) {
      throw new Error(`PDF rendering failed: ${pdfError}`);
    }

    const canvasElements = await page.$$('canvas');
    const images: string[] = [];
    
    for (const canvas of canvasElements) {
      try {
        const screenshot = await canvas.screenshot({ 
          type: 'png'
        });
        images.push(screenshot.toString('base64'));
      } catch {
        console.warn('Failed to screenshot canvas, skipping');
        continue;
      }
    }

    await browser.close();

    if (images.length === 0) {
      throw new Error('No images were generated from the PDF');
    }

    console.log(`Successfully converted PDF to ${images.length} images`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please extract all invoice data from these images and return a JSON object with the following structure:

{
  "seller": {
    "name": "Company Name",
    "address": "Full Address",
    "tax_id": "Tax ID if available",
    "email": "Email if available",
    "phone": "Phone if available"
  },
  "buyer": {
    "name": "Buyer Name",
    "address": "Buyer Address",
    "tax_id": "Buyer Tax ID if available"
  },
  "invoice_number": "Invoice Number",
  "issue_date": "Issue Date",
  "fulfillment_date": "Fulfillment Date if available",
  "due_date": "Due Date if available", 
  "payment_method": "Payment Method if available",
  "currency": "Currency (e.g., HUF, EUR, USD)",
  "invoice_data": [
    {
      "name": "Item/Service Name",
      "quantity": "Quantity",
      "unit_price": "Unit Price",
      "net": "Net Amount",
      "gross": "Gross Amount",
      "currency": "Item Currency"
    }
  ]
}

Extract all line items from the invoice. If any field is not available, use an empty string. Return only the JSON object, no additional text.`
            },
            ...images.map((image) => ({
              type: "image_url" as const,
              image_url: {
                url: `data:image/png;base64,${image}`,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    const content = openaiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      parsedData = JSON.parse(jsonString);
    } catch {
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    if (!parsedData.seller || !parsedData.buyer || !Array.isArray(parsedData.invoice_data)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return parsedData;

  } catch (error) {
    console.error('PDF processing error:', error);
    throw error;
  }
};

const encodeImageToBase64 = (imagePath: string): { base64: string; mimeType: string } => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  
  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = 'image/png';
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      mimeType = 'image/jpeg';
      break;
    case '.png':
      mimeType = 'image/png';
      break;
    case '.gif':
      mimeType = 'image/gif';
      break;
    case '.webp':
      mimeType = 'image/webp';
      break;
  }
  
  return { base64, mimeType };
};

const cleanupTempFiles = (paths: string[]) => {
  if (!paths || paths.length === 0) return;
  
  const dir = path.dirname(paths[0]);
  
  const isTempDir = dir.includes('tmp') || 
                   dir.includes('temp') || 
                   dir.includes('Temp') ||
                   dir.includes('AppData\\Local\\Temp') ||
                   dir.includes('AppData/Local/Temp');
  
  if (!isTempDir) {
    return;
  }
  
  try {
    paths.forEach((p) => {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    });
    
    if (fs.existsSync(dir)) {
      const remainingFiles = fs.readdirSync(dir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(dir);
      }
    }
  } catch {
    // Silent cleanup failure
  }
};

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  let imagePaths: string[] = [];
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (buffer.length === 0) {
      throw new Error('Uploaded file is empty');
    }
    
    if (buffer.length > 50 * 1024 * 1024) {
      throw new Error('File too large (max 50MB)');
    }
    
    imagePaths = await convertPdfToImages(buffer);
    
    if (!imagePaths.length) {
      throw new Error('No images extracted from PDF - the PDF might be corrupted or contain no convertible pages');
    }

    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Generated image file does not exist: ${imagePath}`);
      }
      const stats = fs.statSync(imagePath);
      if (stats.size === 0) {
        throw new Error(`Generated image file is empty: ${imagePath}`);
      }
    }

    const content: ChatCompletionContentPart[] = [
      { type: 'text', text: getGuidelinesImage() },
      ...imagePaths.map(
        (p): ChatCompletionContentPart => {
          const { base64, mimeType } = encodeImageToBase64(p);
          return {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          };
        }
      ),
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from OpenAI API');
    }

    const responseText = response.choices[0].message?.content ?? '';
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response received from OpenAI API');
    }
    
    let cleanedResponse = responseText;
    
    if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(7, -3).trim();
    } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3, -3).trim();
    }
    
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in OpenAI response');
    }

    try {
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.seller || !parsed.buyer || !Array.isArray(parsed.invoice_data)) {
        throw new Error('OpenAI response missing required fields (seller, buyer, or invoice_data)');
      }
      
      const output = { id: crypto.randomUUID(), ...parsed };

      cleanupTempFiles(imagePaths);
      return NextResponse.json(output);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON from OpenAI response: ${(parseError as Error).message}`);
    }
  } catch (_) {
    if (imagePaths && imagePaths.length > 0) {
      cleanupTempFiles(imagePaths);
    }
    
    const errorMessage = (_ as Error).message || 'Unexpected server error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        fallbackData: {
          id: crypto.randomUUID(),
          seller: { name: '', address: '', tax_id: '', email: '', phone: '' },
          buyer: { name: '', address: '', tax_id: '' },
          invoice_number: '',
          issue_date: '',
          fulfillment_date: '',
          due_date: '',
          payment_method: '',
          currency: 'HUF',
          invoice_data: []
        }
      },
      { status: 500 }
    );
  }
}