
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

      const employee: Partial<Employee> = {
        name: nameIndex >= 0 ? values[nameIndex] : "Unknown",
        email: emailIndex >= 0 ? values[emailIndex] : "",
        remoteDays: remoteDaysIndex >= 0 ? values[remoteDaysIndex]
          ?.split(";")
          .map(day => parseInt(day))
          .filter(day => !isNaN(day)) : [],
        businessUnit: businessUnitIndex >= 0 ? values[businessUnitIndex] : undefined
      };

      console.log("Parsed employee:", employee); // Debug log
      return employee;
    });
};
