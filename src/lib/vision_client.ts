import vision from '@google-cloud/vision';

export const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_EMAIL,
    private_key: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_KEY?.replace(/\\n/g, '\n'),
  },
});