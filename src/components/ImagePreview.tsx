
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  imageDataUrl: string; // Changed from string | null as it will always be provided
  onClearImage: () => void;
}

export function ImagePreview({ imageDataUrl, onClearImage }: ImagePreviewProps) {
  return (
    <div className="p-2 border border-dashed border-border rounded-lg bg-muted/20 relative group aspect-video flex items-center justify-center">
      <div className="relative w-full h-full max-w-full max-h-full rounded-md overflow-hidden shadow-sm border border-border/50">
        <Image src={imageDataUrl} alt="Selected preview" layout="fill" objectFit="contain" data-ai-hint="document scan" />
      </div>
      <Button 
        onClick={onClearImage} 
        variant="destructive" 
        size="icon" 
        className="absolute top-1 right-1 h-7 w-7 bg-destructive/80 hover:bg-destructive text-destructive-foreground group-hover:opacity-100 opacity-0 transition-opacity duration-200 rounded-full z-10"
        aria-label="Clear image"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
