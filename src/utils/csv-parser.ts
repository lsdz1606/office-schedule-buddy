import { Employee } from "@/types/business-unit";

export const parseCSV = (csvContent: string): Partial<Employee>[] => {
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",").map(header => header.trim().toLowerCase());

  console.log("CSV Headers:", headers); // Debug log

  return lines.slice(1)
    .filter(line => line.trim() !== "")
    .map((line, index) => {
      const values = line.split(",").map(value => value.trim());
      console.log(`Processing line ${index + 1}:`, values); // Debug log

      const nameIndex = headers.indexOf("name");
      const emailIndex = headers.indexOf("email");
      const remoteDaysIndex = headers.indexOf("remotedays");
      const businessUnitIndex = headers.indexOf("main business unit");

      console.log("Indices:", { 
        nameIndex, 
        emailIndex, 
        remoteDaysIndex,
        businessUnitIndex 
      }); // Debug log

      if (nameIndex === -1) {
        console.error("Name column not found in CSV"); // Debug log
      }

      // Parse remote days
      let remoteDays: number[] = [];
      if (remoteDaysIndex >= 0 && values[remoteDaysIndex]) {
        // Handle different potential formats (semicolon-separated, comma-separated)
        const dayStrings = values[remoteDaysIndex].includes(';') 
          ? values[remoteDaysIndex].split(';') 
          : values[remoteDaysIndex].split(/[,\s]+/);
          
        remoteDays = dayStrings
          .map(day => {
            // Convert text day names to numbers (1-5 for Monday-Friday)
            const dayLower = day.trim().toLowerCase();
            if (dayLower === 'monday' || dayLower === 'mon') return 1;
            if (dayLower === 'tuesday' || dayLower === 'tue') return 2;
            if (dayLower === 'wednesday' || dayLower === 'wed') return 3;
            if (dayLower === 'thursday' || dayLower === 'thu') return 4;
            if (dayLower === 'friday' || dayLower === 'fri') return 5;
            // Otherwise try to parse as number
            return parseInt(day);
          })
          .filter(day => !isNaN(day) && day >= 1 && day <= 5);
      }
      
      console.log("Parsed remote days:", remoteDays); // Debug log

      const employee: Partial<Employee> = {
        name: nameIndex >= 0 ? values[nameIndex] : "Unknown",
        email: emailIndex >= 0 ? values[emailIndex] : "",
        remoteDays: remoteDays,
        businessUnit: businessUnitIndex >= 0 ? values[businessUnitIndex] : undefined
      };

      console.log("Parsed employee:", employee); // Debug log
      return employee;
    });
};
