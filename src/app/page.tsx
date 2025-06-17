
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
import { Camera, FileUp, Loader2, AlertTriangle, Trash2, UploadCloud } from 'lucide-react';
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
  const [imageFilesList, setImageFilesList] = useState<File[]>([]);
  const [imageDataUrlsList, setImageDataUrlsList] = useState<string[]>([]);
  const [extractedTextsList, setExtractedTextsList] = useState<string[]>([]);
  const [extractionCount, setExtractionCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCameraFeed, setShowCameraFeed] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  const isExtracting = extractionCount > 0;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExtractText = useCallback(async (dataUrlToProcess: string) => {
    if (!dataUrlToProcess) {
      // This case should ideally not be hit if called correctly
      return;
    }
    setExtractionCount(prev => prev + 1);
    setErrorMessage(null);
    try {
      const result = await imageToTextConversion({ photoDataUri: dataUrlToProcess });
      setExtractedTextsList(prev => [...prev, result.text || "لم يتم العثور على نص في الصورة."]);
    } catch (error) {
      console.error("Error extracting text:", error);
      // Add a placeholder for the failed extraction to maintain list order
      setExtractedTextsList(prev => [...prev, "فشل استخراج النص لهذه الصورة."]);
      setErrorMessage("فشل استخراج النص لبعض الصور. قد تكون الصورة معقدة جدًا أو لا تحتوي على نص عربي واضح.");
      toast({
        title: "خطأ في الاستخراج",
        description: "تعذر استخراج النص من إحدى الصور.",
        variant: "destructive",
      });
    } finally {
      setExtractionCount(prev => prev - 1);
    }
  }, [toast]);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCameraFeed(false);
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      // Clear previous errors when new files are uploaded
      setErrorMessage(null); 
      
      // Optionally clear previous images, or append. For now, let's append.
      // setImageFilesList([]);
      // setImageDataUrlsList([]);
      // setExtractedTextsList([]);

      newFilesArray.forEach(file => {
        if (file.size > 4 * 1024 * 1024) {
          setErrorMessage(prevError => (prevError ? prevError + "\n" : "") + `حجم الملف ${file.name} كبير جدًا (الحد الأقصى 4 ميجابايت).`);
          return;
        }
        setImageFilesList(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setImageDataUrlsList(prev => [...prev, dataUrl]);
          handleExtractText(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    }
     // Reset file input to allow re-uploading the same file(s) if needed
    if (event.target) {
        event.target.value = '';
    }
  }, [handleExtractText]);


  const handleExportToDocx = useCallback(async () => {
    if (extractedTextsList.length === 0) {
      setErrorMessage("لا يوجد نص لتصديره.");
      return;
    }
    setIsExporting(true);
    setErrorMessage(null);
    const combinedText = extractedTextsList
      .map((text, index) => `--- صورة ${index + 1} ---\n${text}`)
      .join('\n\n');
      
    const success = await exportToDocx(combinedText, 'النصوص_المستخرجة.docx');
    if (!success) {
      toast({
        title: "فشل التصدير",
        description: "تعذر تصدير النص إلى DOCX.",
        variant: "destructive",
      });
      setErrorMessage("فشل في إنشاء ملف DOCX.");
    }
    setIsExporting(false);
  }, [extractedTextsList, toast]);

  const handleClearSingleImage = (indexToRemove: number) => {
    setImageDataUrlsList(prev => prev.filter((_, index) => index !== indexToRemove));
    setImageFilesList(prev => prev.filter((_, index) => index !== indexToRemove));
    setExtractedTextsList(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleClearAllImages = () => {
    setImageFilesList([]);
    setImageDataUrlsList([]);
    setExtractedTextsList([]);
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
    // Don't clear all images when enabling camera, allow adding to existing
    setShowCameraFeed(true);
    setHasCameraPermission(null); 

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
        setErrorMessage("تم رفض الوصول إلى الكاميرا أو أنها غير متوفرة. يرجى التحقق من أذونات المتصفح.");
        toast({
          variant: "destructive",
          title: "تم رفض الوصول إلى الكاميرا",
          description: "يرجى تمكين أذونات الكاميرا في إعدادات المتصفح.",
        });
        setShowCameraFeed(false);
      }
    } else {
      setHasCameraPermission(false);
      setErrorMessage("متصفحك لا يدعم الوصول إلى الكاميرا.");
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
        
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const capturedFile = new File([blob], `capture-${Date.now()}.png`, { type: "image/png" });
                setImageFilesList(prev => [...prev, capturedFile]);
            });

        setImageDataUrlsList(prev => [...prev, dataUrl]);
        
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCameraFeed(false);
        handleExtractText(dataUrl);
      }
    }
  }, [hasCameraPermission, handleExtractText]);
  
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">جاري تحميل التطبيق...</p>
      </div>
    );
  }

  const handleCopyToClipboard = async (textToCopy: string, imageNumber: number) => {
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast({
          title: `تم نسخ نص الصورة ${imageNumber}!`,
          description: "تم نسخ النص المستخرج إلى الحافظة الخاصة بك.",
        });
      } catch (err) {
        toast({
          title: "فشل النسخ",
          description: "تعذر نسخ النص إلى الحافظة.",
          variant: "destructive",
        });
      }
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-10 flex justify-center items-start">
        <Card className="w-full max-w-3xl shadow-xl rounded-lg bg-card">
          <CardHeader className="p-6 text-center">
            <CardTitle className="text-3xl font-bold text-foreground">
              استخراج النص من الصور
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-base">
              قم بتحميل أو التقاط صور تحتوي على نص عربي. سنقوم باستخراجه لك.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!showCameraFeed && (
              <div className="space-y-4">
                <Label htmlFor="image-upload" className="text-md font-semibold text-foreground text-center block w-full">
                  اختر صورة أو عدة صور
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple // Allow multiple file selection
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="w-full py-3 text-base border-primary text-primary hover:bg-primary/10 hover:text-foreground"
                    size="lg"
                  >
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                    >
                      <UploadCloud className="mr-2 h-5 w-5" /> تحميل ملفات
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
                {imageDataUrlsList.length > 0 && (
                    <Button
                        onClick={handleClearAllImages}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> مسح جميع الصور
                    </Button>
                )}
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
                    <Button onClick={handleCaptureImage} disabled={!hasCameraPermission || !videoRef.current?.srcObject} className="w-full" size="lg">
                        <Camera className="mr-2 h-5 w-5" /> التقاط صورة
                    </Button>
                    <Button onClick={() => {
                        setShowCameraFeed(false);
                        if (videoRef.current && videoRef.current.srcObject) {
                            const stream = videoRef.current.srcObject as MediaStream;
                            stream.getTracks().forEach(track => track.stop());
                            videoRef.current.srcObject = null;
                        }
                    }} variant="outline" className="w-full" size="lg">
                        إلغاء
                    </Button>
                </div>
              </div>
            )}

            {errorMessage && !showCameraFeed && ( 
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md flex items-center text-destructive text-sm whitespace-pre-line">
                <AlertTriangle className="h-5 w-5 mr-2.5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}
            
            {imageDataUrlsList.length > 0 && !showCameraFeed && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">الصور المحددة:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {imageDataUrlsList.map((url, index) => (
                    <DynamicImagePreview 
                        key={index} 
                        imageDataUrl={url} 
                        onClearImage={() => handleClearSingleImage(index)} 
                    />
                    ))}
                </div>
              </div>
            )}
            
            {isExtracting && ( 
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-md bg-card shadow-inner border border-border/50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-lg font-medium text-foreground">جاري معالجة الصور ({imageDataUrlsList.length - extractedTextsList.length} متبقية)...</p>
                <p className="text-sm text-muted-foreground mt-1">قد يستغرق هذا بضع لحظات.</p>
              </div>
            )}

            {extractedTextsList.length > 0 && !isExtracting && (
               <DynamicExtractedTextView 
                extractedTexts={extractedTextsList}
                isExporting={isExporting}
                onExportToDocx={handleExportToDocx}
                onCopyText={handleCopyToClipboard}
              />
            )}
          </CardContent>
          <CardFooter className="p-6 border-t mt-6">
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

