import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PDFExportProps {
  data: any;
  filename: string;
  title: string;
}

export function PDFExport({ data, filename, title }: PDFExportProps) {
  const { toast } = useToast();

  const handleExport = () => {
    // Simple PDF generation using browser print API
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Error", description: "Please allow popups to export PDF", variant: "destructive" });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2563eb; color: white; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          ${generateTable(data)}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    toast({ title: "Success", description: "PDF export initiated" });
  };

  const generateTable = (data: any): string => {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      return `
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map(row => 
              `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join("")}</tr>`
            ).join("")}
          </tbody>
        </table>
      `;
    }
    return "<p>No data to export</p>";
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={handleExport}
        variant="outline"
        className="border-primary/20 hover:bg-primary/5"
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </motion.div>
  );
}

