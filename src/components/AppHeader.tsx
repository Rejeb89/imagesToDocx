
import { FileText } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="w-full py-5 bg-card shadow-sm border-b border-border">
      <div className="container mx-auto flex items-center justify-center">
        <FileText className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Textify
        </h1>
      </div>
    </header>
  );
}
