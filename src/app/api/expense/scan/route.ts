import { supabase } from '@/lib/supabase_client';
import { ExpenseService } from '@/services/expense_service';
import { VisionService } from '@/services/vision_service';
import multer from 'multer';


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const expenseService = new ExpenseService();

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const body = Object.fromEntries(formData.entries());

        const files = formData.getAll('files') as File[];
        const uploadedFiles = await Promise.all(
            files.map(async (fileBlob: Blob) => ({
                buffer: Buffer.from(await fileBlob.arrayBuffer()),
                mimetype: fileBlob.type,
                originalname: (fileBlob as any).name, // TypeScript mungkin tidak tahu `name` di Blob
            }))
            );

        const userId = body.userId as string;

        if (!uploadedFiles || !userId) {
            return new Response(JSON.stringify({ message: 'Missing file or userId' }), { status: 400 });
        }

        // Validate file type
        uploadedFiles.forEach(file => {
            if (!file.mimetype.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }
        }
        );

        const visionService = new VisionService();
        let extractedText = '';
        for (const file of uploadedFiles) {
            // Step 1: Extract text from image
            const text = await visionService.extractTextFromImage(file.buffer);
            extractedText += text + '\n';
        }


        // Step 2: Structure data with LLM
        const structuredData = await visionService.structureReceiptData(extractedText);

        // Add userId to structured data
        structuredData.user_id = userId;

        return new Response(JSON.stringify({
            success: true,
            message: 'Receipt scanned successfully',
            data: structuredData,
        }), { status: 200 });

    } catch (error) {
        console.error('Receipt scan error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error.message || 'Internal server error'
        }), { status: 500 });
    }
}




export const config = {
  api: {
    bodyParser: false,
  },
};