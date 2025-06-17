import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  imageDataUrl: string | null;
  onClearImage: () => void;
}

export function ImagePreview({ imageDataUrl, onClearImage }: ImagePreviewProps) {
  if (!imageDataUrl) return null;

  return (
    <div className="mt-6 p-4 border border-dashed border-border rounded-lg bg-muted/20">
      <h3 className="text-lg font-semibold mb-2 text-foreground text-center">Image Preview</h3>
      <div className="relative w-full max-w-md mx-auto aspect-video rounded-md overflow-hidden shadow-md">
        <Image src={imageDataUrl} alt="Selected preview" layout="fill" objectFit="contain" data-ai-hint="document scan" />
      </div>
      <Button onClick={onClearImage} variant="outline" size="sm" className="mt-4 mx-auto flex items-center">
        <Trash2 className="mr-2 h-4 w-4" /> Clear Image
      </Button>
    </div>
  );
}
