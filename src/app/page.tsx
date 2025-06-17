'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { imageToTextConversion } from '@/ai/flows/image-to-text-conversion';
import { exportToDocx } from '@/lib/docx-utils';
import { Camera, FileUp, Loader2, AlertTriangle, ScanText } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';

const DynamicImagePreview = dynamic(() => import('@/components/ImagePreview').then(mod => mod.ImagePreview), {
  loading: () => <div className="flex justify-center items-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Preview...</p></div>,
  ssr: false
});

const DynamicExtractedTextView = dynamic(() => import('@/components/ExtractedTextView').then(mod => mod.ExtractedTextView), {
  loading: () => <div className="flex justify-center items-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Text View...</p></div>,
  ssr: false
});


export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Limit file size (e.g., 4MB)
        setErrorMessage("Image size should be less than 4MB.");
        setImageFile(null);
        setImageDataUrl(null);
        setExtractedText(null);
        return;
      }
      setImageFile(file);
      setExtractedText(null);
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleExtractText = useCallback(async () => {
    if (!imageDataUrl) {
      setErrorMessage("Please select an image first.");
      return;
    }
    setIsExtracting(true);
    setExtractedText(null);
    setErrorMessage(null);
    try {
      const result = await imageToTextConversion({ photoDataUri: imageDataUrl });
      setExtractedText(result.text || "No text found in the image.");
      toast({
        title: "Text Extraction Successful",
        description: "Text has been extracted from the image.",
      });
    } catch (error) {
      console.error("Error extracting text:", error);
      setErrorMessage("Failed to extract text. The image might be too complex or not contain clearly visible Arabic text. Please try another image.");
      toast({
        title: "Extraction Error",
        description: "Could not extract text from the image.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }, [imageDataUrl, toast]);

  const handleExportToDocx = useCallback(async () => {
    if (!extractedText) {
      setErrorMessage("No text to export.");
      return;
    }
    setIsExporting(true);
    const success = await exportToDocx(extractedText);
    if (success) {
      toast({
        title: "Export Successful",
        description: "The text has been exported to a DOCX file.",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Could not export the text to DOCX.",
        variant: "destructive",
      });
      setErrorMessage("Failed to generate DOCX file.");
    }
    setIsExporting(false);
  }, [extractedText, toast]);

  const handleClearImage = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setExtractedText(null);
    setErrorMessage(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Reset file input
    }
  };
  
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading App...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200 p-6">
            <CardTitle className="text-2xl font-headline text-center text-primary">Image to Text Converter</CardTitle>
            <CardDescription className="text-center text-muted-foreground mt-1">
              Capture or upload an image with Arabic text to convert it into an editable DOCX file.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image-upload" className="text-base font-semibold text-foreground">
                Upload Image
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Label
                  htmlFor="image-upload"
                  className="w-full sm:w-auto flex-grow cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-input bg-transparent rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors"
                >
                  <FileUp className="mr-2 h-5 w-5" /> Choose File
                </Label>
                <Label
                  htmlFor="image-upload"
                  className="w-full sm:w-auto sm:flex-shrink-0 cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent bg-primary text-primary-foreground rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  onClick={() => document.getElementById('image-upload')?.setAttribute('capture', 'camera')}
                >
                  <Camera className="mr-2 h-5 w-5" /> Use Camera
                </Label>
              </div>
            </div>

            {imageDataUrl && (
              <DynamicImagePreview imageDataUrl={imageDataUrl} onClearImage={handleClearImage} />
            )}
            
            {errorMessage && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            {imageFile && !extractedText && (
              <Button
                onClick={handleExtractText}
                disabled={isExtracting || !imageDataUrl}
                className="w-full mt-4 text-base py-3"
                size="lg"
              >
                {isExtracting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ScanText className="mr-2 h-5 w-5" />}
                {isExtracting ? 'Extracting Text...' : 'Extract Text from Image'}
              </Button>
            )}

            {isExtracting && extractedText === null && ( 
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-lg text-muted-foreground">Processing image, please wait...</p>
              </div>
            )}

            {extractedText && (
               <DynamicExtractedTextView 
                extractedText={extractedText}
                isExporting={isExporting}
                onExportToDocx={handleExportToDocx}
              />
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
            <p className="text-xs text-muted-foreground text-center w-full">
              Ensure the image is clear and text is well-lit for best results.
            </p>
          </CardFooter>
        </Card>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Text Capture Pro. All rights reserved.
      </footer>
    </div>
  );
}
