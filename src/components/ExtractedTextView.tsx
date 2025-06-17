import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

interface ExtractedTextViewProps {
  extractedText: string | null;
  isExporting: boolean;
  onExportToDocx: () => Promise<void>;
}

export function ExtractedTextView({ extractedText, isExporting, onExportToDocx }: ExtractedTextViewProps) {
  if (!extractedText) return null;

  return (
    <div className="space-y-4 mt-6">
      <Label htmlFor="extracted-text-area" className="text-base font-semibold text-foreground">
        Extracted Text (النص المستخرج)
      </Label>
      <Textarea
        id="extracted-text-area"
        value={extractedText}
        readOnly
        rows={10}
        className="w-full p-3 border-border rounded-md shadow-sm bg-muted/30 text-foreground text-right focus:ring-primary"
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
