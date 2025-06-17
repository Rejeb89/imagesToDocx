
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Copy, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExtractedTextViewProps {
  extractedTexts: string[];
  isExporting: boolean;
  onExportToDocx: () => Promise<void>;
  onCopyText: (text: string, imageNumber: number) => Promise<void>;
}

export function ExtractedTextView({ extractedTexts, isExporting, onExportToDocx, onCopyText }: ExtractedTextViewProps) {
  if (!extractedTexts || extractedTexts.length === 0) return null;

  return (
    <Card className="mt-6 shadow-inner bg-muted/20 border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            النصوص المستخرجة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {extractedTexts.map((text, index) => (
          <div key={index} className="space-y-2 p-3 border rounded-md bg-card">
            <div className="flex justify-between items-center">
              <Label htmlFor={`extracted-text-${index}`} className="text-sm font-medium text-foreground">
                النص من الصورة {index + 1}
              </Label>
              <Button variant="ghost" size="sm" onClick={() => onCopyText(text, index + 1)} aria-label={`Copy text from image ${index + 1}`}>
                <Copy className="h-4 w-4 mr-1.5" />
                نسخ
              </Button>
            </div>
            <Textarea
              id={`extracted-text-${index}`}
              value={text}
              readOnly
              rows={8}
              className="w-full p-2.5 border-input rounded-md shadow-sm bg-muted/50 text-foreground text-right focus:ring-primary text-sm"
              dir="rtl"
              lang="ar"
              aria-label={`Extracted Arabic text from image ${index + 1}`}
            />
          </div>
        ))}
        {extractedTexts.length > 0 && (
          <Button
            onClick={onExportToDocx}
            disabled={isExporting}
            className="w-full text-base py-3 mt-4"
            variant="default"
            size="lg"
          >
            {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
            {isExporting ? 'جاري التصدير...' : 'تحميل كل النصوص كـ DOCX'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
