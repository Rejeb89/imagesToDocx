
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { imageToTextConversion } from '@/ai/flows/image-to-text-conversion';
import { exportToDocx } from '@/lib/docx-utils';
import { Camera, FileUp, Loader2, AlertTriangle, ScanText, Copy } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCameraFeed, setShowCameraFeed] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExtractText = useCallback(async (dataUrlToProcess: string) => {
    if (!dataUrlToProcess) {
      setErrorMessage("Please select or capture an image first.");
      return;
    }
    setIsExtracting(true);
    setExtractedText(null); 
    setErrorMessage(null);
    try {
      const result = await imageToTextConversion({ photoDataUri: dataUrlToProcess });
      setExtractedText(result.text || "No text found in the image.");
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
  }, [toast, setErrorMessage, setExtractedText, setIsExtracting]);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCameraFeed(false); // Hide camera feed if a file is uploaded
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
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
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);
        if (dataUrl) {
          handleExtractText(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [handleExtractText, setErrorMessage, setImageFile, setImageDataUrl, setExtractedText]);


  const handleExportToDocx = useCallback(async () => {
    if (!extractedText) {
      setErrorMessage("No text to export.");
      return;
    }
    setIsExporting(true);
    const success = await exportToDocx(extractedText);
    if (!success) {
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
    setShowCameraFeed(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; 
    }
  };

  const enableCamera = async () => {
    handleClearImage(); // Clear any existing image
    setShowCameraFeed(true);
    setHasCameraPermission(null); // Reset permission status

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
        setErrorMessage("Camera access was denied or is unavailable. Please check your browser permissions.");
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings.",
        });
        setShowCameraFeed(false);
      }
    } else {
      setHasCameraPermission(false);
      setErrorMessage("Camera access is not supported by your browser.");
      setShowCameraFeed(false);
    }
  };

  const handleCaptureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImageDataUrl(dataUrl);
        setImageFile(new File([dataUrl], "capture.png", { type: "image/png" })); 
        setExtractedText(null);
        
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCameraFeed(false);
        if (dataUrl) {
            handleExtractText(dataUrl);
        }
      }
    }
  }, [hasCameraPermission, handleExtractText]);
  
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
      <main className="flex-grow container mx-auto px-4 py-10 flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-xl rounded-lg bg-card">
          <CardHeader className="p-6">
            <CardTitle className="text-3xl font-bold text-center text-foreground">
              استخراج النص من الصور
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground mt-2 text-base">
              قم بتحميل أو التقاط صورة تحتوي على نص عربي. سنقوم باستخراجه لك.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!showCameraFeed && (
              <div className="space-y-3">
                <Label htmlFor="image-upload" className="text-md font-semibold text-foreground text-center block w-full">
                  اختر صورة
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="w-full py-3 text-base border-primary text-primary hover:bg-primary/10"
                    size="lg"
                  >
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                    >
                      <FileUp className="mr-2 h-5 w-5" /> تحميل ملف
                    </Label>
                  </Button>
                  <Button
                    onClick={enableCamera}
                    variant="default"
                    className="w-full py-3 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" /> استخدام الكاميرا
                  </Button>
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden"></canvas>

            {showCameraFeed && (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border bg-muted/30">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                </div>
                {hasCameraPermission === false && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>فشل الوصول إلى الكاميرا</AlertTitle>
                    <AlertDescription>
                      {errorMessage || "يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح."}
                    </AlertDescription>
                  </Alert>
                )}
                 {hasCameraPermission === null && !errorMessage && (
                    <div className="flex items-center justify-center p-4 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        جاري طلب إذن الكاميرا...
                    </div>
                )}
                <div className="flex gap-3">
                    <Button onClick={handleCaptureImage} disabled={!hasCameraPermission} className="w-full" size="lg">
                        <Camera className="mr-2 h-5 w-5" /> التقاط صورة
                    </Button>
                    <Button onClick={() => {
                        setShowCameraFeed(false);
                        if (videoRef.current && videoRef.current.srcObject) {
                            const stream = videoRef.current.srcObject as MediaStream;
                            stream.getTracks().forEach(track => track.stop());
                        }
                    }} variant="outline" className="w-full" size="lg">
                        إلغاء
                    </Button>
                </div>
              </div>
            )}


            {imageDataUrl && !showCameraFeed && (
              <DynamicImagePreview imageDataUrl={imageDataUrl} onClearImage={handleClearImage} />
            )}
            
            {errorMessage && !showCameraFeed && ( 
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md flex items-center text-destructive text-sm">
                <AlertTriangle className="h-5 w-5 mr-2.5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}
            
            {isExtracting && ( 
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-md bg-card shadow-inner border border-border/50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-lg font-medium text-foreground">جاري معالجة الصورة...</p>
                <p className="text-sm text-muted-foreground mt-1">قد يستغرق هذا بضع لحظات.</p>
              </div>
            )}

            {extractedText && !isExtracting && (
               <DynamicExtractedTextView 
                extractedText={extractedText}
                isExporting={isExporting}
                onExportToDocx={handleExportToDocx}
              />
            )}
          </CardContent>
          <CardFooter className="p-6">
            <p className="text-xs text-muted-foreground text-center w-full">
              للحصول على أفضل النتائج، استخدم صورًا واضحة ذات نص جيد الإضاءة.
            </p>
          </CardFooter>
        </Card>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border bg-card">
        © {new Date().getFullYear()} Text Capture Pro. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
