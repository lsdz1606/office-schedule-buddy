import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, UserPlus, Users, Search } from "lucide-react";
import { BusinessUnit, Employee } from "@/types/business-unit";
import CsvUpload from "@/components/CsvUpload";
import { useToast } from "@/components/ui/use-toast";
import { optimizeRemoteDays } from "@/utils/schedule-optimizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const mockBusinessUnits: BusinessUnit[] = [
  {
    id: "1",
    name: "Engineering",
    employees: [
      { id: "1", name: "John Doe", email: "john@example.com", remoteDays: [1, 3] },
      { id: "2", name: "Jane Smith", email: "jane@example.com", remoteDays: [2, 4] },
    ],
  },
  {
    id: "2",
    name: "Design",
    employees: [
      { id: "3", name: "Mike Johnson", email: "mike@example.com", remoteDays: [1, 4] },
    ],
  },
];

type EmployeeView = "all" | "remote" | "in-office";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>(mockBusinessUnits);
  const [employeeView, setEmployeeView] = useState<EmployeeView>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();
  const MAX_OFFICE_CAPACITY = 32;

  // Convert day of week (0-6, Sunday-Saturday) to our 1-5 (Monday-Friday) format
  const convertDayOfWeek = (dayOfWeek: number): number | null => {
    // Sunday (0) and Saturday (6) return null
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    // Monday (1) to Friday (5) stay the same
    return dayOfWeek;
  };

  const isEmployeeRemoteOnDate = (employee: Employee, date: Date): boolean => {
    const dayOfWeek = convertDayOfWeek(date.getDay());
    // If weekend or no remote days set, return false
    if (dayOfWeek === null || !employee.remoteDays) return false;
    return employee.remoteDays.includes(dayOfWeek);
  };

  const formatRemoteDays = (remoteDays: number[]): string => {
    if (!remoteDays || remoteDays.length === 0) return "None";
    
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return remoteDays
      .sort((a, b) => a - b) // Sort days in order
      .map(day => {
        // Convert 1-5 to 0-4 for array index
        const index = day - 1;
        return index >= 0 && index < dayNames.length ? dayNames[index] : null;
      })
      .filter(Boolean) // Remove any null values
      .join(", ");
  };

  // Calculate office and remote counts for the selected date
  const calculateCounts = () => {
    const dayOfWeek = convertDayOfWeek(selectedDate.getDay());
    if (dayOfWeek === null) {
      return { officeCount: 0, remoteCount: 0 }; // Weekend
    }
    
    let officeCount = 0;
    let remoteCount = 0;
    
    businessUnits.forEach(unit => {
      unit.employees.forEach(employee => {
        if (employee.remoteDays.includes(dayOfWeek)) {
          remoteCount++;
        } else {
          officeCount++;
        }
      });
    });
    
    return { officeCount, remoteCount };
  };

  const counts = calculateCounts();

  // Calculate total employees
  const totalEmployees = businessUnits.reduce(
    (total, unit) => total + unit.employees.length, 0
  );

  // Get filtered employees based on selected view, date, and search query
  const getFilteredEmployees = useCallback(() => {
    // Flatten all employees from all business units into one array, keeping track of their business unit
    const allEmployeesWithUnit = businessUnits.flatMap(unit => 
      unit.employees.map(employee => ({
        ...employee,
        businessUnit: unit.name,
        businessUnitId: unit.id
      }))
    );
    
    // First filter by remote status if needed
    let filteredByStatus = allEmployeesWithUnit;
    if (employeeView !== "all") {
      filteredByStatus = allEmployeesWithUnit.filter(employee => {
        const isRemote = isEmployeeRemoteOnDate(employee, selectedDate);
        return employeeView === "remote" ? isRemote : !isRemote;
      });
    }
    
    // Then filter by search query if one exists
    if (!searchQuery.trim()) {
      return filteredByStatus;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return filteredByStatus.filter(employee => 
      employee.name.toLowerCase().includes(query) || 
      employee.businessUnit.toLowerCase().includes(query)
    );
  }, [businessUnits, employeeView, selectedDate, searchQuery]);

  const filteredEmployees = getFilteredEmployees();

  const handleEmployeeImport = (employees: Partial<Employee>[]) => {
    if (employees.length === 0) {
      toast({
        title: "No employees found",
        description: "The CSV file appears to be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedBusinessUnits = [...businessUnits];
    
    // Group employees by business unit
    const employeesByBusinessUnit: Record<string, Partial<Employee>[]> = {};
    
    employees.forEach(emp => {
      const businessUnitName = emp.businessUnit || "Unknown";
      if (!employeesByBusinessUnit[businessUnitName]) {
        employeesByBusinessUnit[businessUnitName] = [];
      }
      employeesByBusinessUnit[businessUnitName].push(emp);
    });
    
    // Add employees to existing business units or create new ones
    Object.entries(employeesByBusinessUnit).forEach(([unitName, unitEmployees]) => {
      // Find existing business unit
      let businessUnit = updatedBusinessUnits.find(
        unit => unit.name.toLowerCase() === unitName.toLowerCase()
      );
      
      // Create new business unit if it doesn't exist
      if (!businessUnit) {
        businessUnit = {
          id: `bu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: unitName,
          employees: []
        };
        updatedBusinessUnits.push(businessUnit);
      }
      
      // Add employees to the business unit
      const newEmployees = unitEmployees.map((emp, index) => ({
        id: `imported-${Date.now()}-${index}`,
        name: emp.name || "Unknown",
        email: emp.email || "",
        remoteDays: emp.remoteDays || [],
      }));
      
      businessUnit.employees = [...businessUnit.employees, ...newEmployees];
    });
    
    // Optimize remote days to ensure all employees have 2 remote days
    // and no more than MAX_OFFICE_CAPACITY people are in office any day
    const optimizedBusinessUnits = optimizeRemoteDays(updatedBusinessUnits, MAX_OFFICE_CAPACITY);
    
    setBusinessUnits(optimizedBusinessUnits);
    
    toast({
      title: "Schedule optimized",
      description: `Remote days assigned to maintain max ${MAX_OFFICE_CAPACITY} people in office per day`,
    });
  };

  // Debounce search input to prevent blocking
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Using setTimeout to prevent blocking the UI
    setTimeout(() => {
      setSearchQuery(value);
    }, 0);
  };

  // Custom search component for reuse in each tab
  const SearchInput = () => (
    <div className="relative mb-4">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder="Search by name or team..."
        value={searchQuery}
        onChange={handleSearchInputChange}
        className="pl-9 w-full md:w-64"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-app-light p-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">Office Schedule</h1>
        <p className="text-gray-600">Manage office presence and remote work schedules</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 animate-slide-up">
          <CardHeader>
            <CardTitle>Schedule Overview</CardTitle>
            <CardDescription>{MAX_OFFICE_CAPACITY} seats available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border shadow-sm"
              />
              <div className="space-x-2">
                <Badge variant="outline" className="bg-green-50">
                  In Office: {counts.officeCount}
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  Remote: {counts.remoteCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up [animation-delay:200ms]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Business Units</CardTitle>
              <div className="flex space-x-2">
                <CsvUpload onUpload={handleEmployeeImport} />
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{unit.name}</h3>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {unit.employees.length} employees
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 animate-slide-up [animation-delay:400ms]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Schedule</CardTitle>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={employeeView} onValueChange={(value) => setEmployeeView(value as EmployeeView)}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <TabsList>
                  <TabsTrigger value="all">All Employees</TabsTrigger>
                  <TabsTrigger value="in-office">In Office</TabsTrigger>
                  <TabsTrigger value="remote">Remote</TabsTrigger>
                </TabsList>
                <div className="text-sm text-gray-500">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <SearchInput />
                <EmployeeTable 
                  employees={filteredEmployees} 
                  selectedDate={selectedDate} 
                  isRemoteFn={isEmployeeRemoteOnDate} 
                  formatRemoteDaysFn={formatRemoteDays}
                />
              </TabsContent>
              
              <TabsContent value="in-office" className="mt-0">
                <SearchInput />
                <EmployeeTable 
                  employees={filteredEmployees} 
                  selectedDate={selectedDate} 
                  isRemoteFn={isEmployeeRemoteOnDate} 
                  formatRemoteDaysFn={formatRemoteDays}
                />
              </TabsContent>
              
              <TabsContent value="remote" className="mt-0">
                <SearchInput />
                <EmployeeTable 
                  employees={filteredEmployees} 
                  selectedDate={selectedDate} 
                  isRemoteFn={isEmployeeRemoteOnDate} 
                  formatRemoteDaysFn={formatRemoteDays}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Total Employees Counters */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-slide-up [animation-delay:600ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total In Office</CardTitle>
            <CardDescription>
              Employees present on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-5xl font-bold text-green-600">{counts.officeCount}</div>
              <div className="ml-4 text-sm text-gray-500">
                {Math.round((counts.officeCount / totalEmployees) * 100) || 0}% of total workforce
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up [animation-delay:700ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Remote</CardTitle>
            <CardDescription>
              Employees working remotely on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-5xl font-bold text-blue-600">{counts.remoteCount}</div>
              <div className="ml-4 text-sm text-gray-500">
                {Math.round((counts.remoteCount / totalEmployees) * 100) || 0}% of total workforce
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Extracted component for the employee table
interface EmployeeTableProps {
  employees: (Employee & { businessUnit: string, businessUnitId: string })[];
  selectedDate: Date;
  isRemoteFn: (employee: Employee, date: Date) => boolean;
  formatRemoteDaysFn: (remoteDays: number[]) => string;
}

const EmployeeTable = ({ employees, selectedDate, isRemoteFn, formatRemoteDaysFn }: EmployeeTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Business Unit</TableHead>
          <TableHead>Remote Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No employees match the selected criteria
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.businessUnit}</TableCell>
              <TableCell>
                {formatRemoteDaysFn(employee.remoteDays)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    isRemoteFn(employee, selectedDate)
                      ? "bg-blue-50"
                      : "bg-green-50"
                  }
                >
                  {isRemoteFn(employee, selectedDate)
                    ? "Remote"
                    : "In Office"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default Index;
