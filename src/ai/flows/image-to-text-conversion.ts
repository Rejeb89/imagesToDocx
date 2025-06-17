'use server';
/**
 * @fileOverview Converts an image containing Arabic text into a digital text format.
 *
 * - imageToTextConversion - A function that handles the image to text conversion process.
 * - ImageToTextConversionInput - The input type for the imageToTextConversion function.
 * - ImageToTextConversionOutput - The return type for the imageToTextConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToTextConversionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing Arabic text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToTextConversionInput = z.infer<typeof ImageToTextConversionInputSchema>;

const ImageToTextConversionOutputSchema = z.object({
  text: z.string().describe('The extracted text from the image.'),
});
export type ImageToTextConversionOutput = z.infer<typeof ImageToTextConversionOutputSchema>;

export async function imageToTextConversion(input: ImageToTextConversionInput): Promise<ImageToTextConversionOutput> {
  return imageToTextConversionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageToTextConversionPrompt',
  input: {schema: ImageToTextConversionInputSchema},
  output: {schema: ImageToTextConversionOutputSchema},
  prompt: `You are an expert OCR reader that specializes in extracting text from images, especially Arabic text. Extract all the text from the image, and output the text in the 'text' field.
If the image contains tables, try to preserve the tabular structure as best as possible in the extracted text, for example by using delimiters like commas or tabs between cell content within a row, and newlines for new rows.

Image: {{media url=photoDataUri}}`,
});

const imageToTextConversionFlow = ai.defineFlow(
  {
    name: 'imageToTextConversionFlow',
    inputSchema: ImageToTextConversionInputSchema,
    outputSchema: ImageToTextConversionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
