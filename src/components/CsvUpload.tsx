
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseCSV } from "@/utils/csv-parser";
import { Employee } from "@/types/business-unit";

interface CsvUploadProps {
  onUpload: (employees: Partial<Employee>[]) => void;
}

const CsvUpload = ({ onUpload }: CsvUploadProps) => {
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const employees = parseCSV(content);
        onUpload(employees);
        toast({
          title: "Upload successful",
          description: `${employees.length} employees imported`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please check your CSV format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload">
        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
          <span>
            <Upload className="h-4 w-4 mr-2" />
            Import from CSV
          </span>
        </Button>
      </label>
    </div>
  );
};

export default CsvUpload;
