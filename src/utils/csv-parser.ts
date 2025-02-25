
import { Employee } from "@/types/business-unit";

export const parseCSV = (csvContent: string): Partial<Employee>[] => {
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",").map(header => header.trim());

  return lines.slice(1)
    .filter(line => line.trim() !== "")
    .map(line => {
      const values = line.split(",").map(value => value.trim());
      const employee: Partial<Employee> = {
        name: values[headers.indexOf("name")],
        email: values[headers.indexOf("email")],
        remoteDays: values[headers.indexOf("remoteDays")]
          ?.split(";")
          .map(day => parseInt(day))
          .filter(day => !isNaN(day)) || [],
      };
      return employee;
    });
};
