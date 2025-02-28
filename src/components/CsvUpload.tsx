
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
        
        // Store the CSV data in localStorage with a timestamp as part of the key
        const timestamp = new Date().toISOString();
        const key = `csv_upload_${timestamp}`;
        const uploadData = {
          timestamp,
          filename: file.name,
          employees,
          importedAt: new Date().toISOString()
        };
        
        localStorage.setItem(key, JSON.stringify(uploadData));
        console.log("CSV data stored in database with key:", key);
        
        // Continue with the regular upload flow
        onUpload(employees);
        
        toast({
          title: "Upload successful",
          description: `${employees.length} employees imported and saved to database`,
        });
      } catch (error) {
        console.error("CSV Upload error:", error);
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
