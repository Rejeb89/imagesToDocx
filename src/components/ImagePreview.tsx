import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';

interface ImagePreviewProps {
  imageDataUrl: string | null;
  onClearImage: () => void;
}

export function ImagePreview({ imageDataUrl, onClearImage }: ImagePreviewProps) {
  if (!imageDataUrl) return null;

  return (
    <div className="mt-4 p-4 border border-dashed border-border rounded-lg bg-muted/20 relative group">
      <h3 className="text-md font-semibold mb-3 text-foreground text-center">Image Preview</h3>
      <div className="relative w-full max-w-md mx-auto aspect-[16/10] rounded-md overflow-hidden shadow-md border border-border">
        <Image src={imageDataUrl} alt="Selected preview" layout="fill" objectFit="contain" data-ai-hint="document scan" />
      </div>
      <Button 
        onClick={onClearImage} 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 bg-card/80 hover:bg-card text-muted-foreground hover:text-destructive group-hover:opacity-100 md:opacity-0 transition-opacity duration-200"
        aria-label="Clear image"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
