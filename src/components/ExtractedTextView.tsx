import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedTextViewProps {
  extractedText: string | null;
  isExporting: boolean;
  onExportToDocx: () => Promise<void>;
}

export function ExtractedTextView({ extractedText, isExporting, onExportToDocx }: ExtractedTextViewProps) {
  const { toast } = useToast();

  if (!extractedText) return null;

  const handleCopyToClipboard = async () => {
    if (extractedText) {
      try {
        await navigator.clipboard.writeText(extractedText);
        toast({
          title: "Text Copied!",
          description: "The extracted text has been copied to your clipboard.",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Could not copy text to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <Label htmlFor="extracted-text-area" className="text-md font-medium text-foreground">
          Extracted Text (النص المستخرج)
        </Label>
        <Button variant="ghost" size="sm" onClick={handleCopyToClipboard} aria-label="Copy text to clipboard">
          <Copy className="h-4 w-4 mr-1.5" />
          Copy
        </Button>
      </div>
      <Textarea
        id="extracted-text-area"
        value={extractedText}
        readOnly
        rows={12}
        className="w-full p-3 border-input rounded-md shadow-sm bg-muted/50 text-foreground text-right focus:ring-primary text-base"
        dir="rtl"
        lang="ar"
        aria-label="Extracted Arabic text"
      />
      <Button
        onClick={onExportToDocx}
        disabled={isExporting || !extractedText}
        className="w-full text-base py-3"
        variant="default"
        size="lg"
      >
        {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
        {isExporting ? 'Exporting...' : 'Download as DOCX'}
      </Button>
    </div>
  );
}
