
import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { Edit, UserPlus, Users, Search, ChevronDown } from "lucide-react";
import { BusinessUnit, Employee } from "@/types/business-unit";
import CsvUpload from "@/components/CsvUpload";
import { useToast } from "@/components/ui/use-toast";
import { optimizeRemoteDays } from "@/utils/schedule-optimizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { loadBusinessUnits, saveBusinessUnits, saveCSVUpload } from "@/services/database";

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

// Creating a separate standalone SearchInput component
interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onChange, placeholder = "Search...", id }, ref) {
    return (
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          type="text"
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pl-9 w-full md:w-64 rounded-full shadow-sm focus:ring-2 focus:ring-blue-400 border-none"
          ref={ref}
        />
        {value.trim().length > 0 && value.trim().length < 3 && (
          <div className="text-xs text-gray-500 mt-1 ml-2">
            Type at least 3 characters to search
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [employeeView, setEmployeeView] = useState<EmployeeView>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllUnits, setShowAllUnits] = useState<boolean>(false);
  const { toast } = useToast();
  const MAX_OFFICE_CAPACITY = 32;
  
  const INITIAL_UNITS_DISPLAYED = 3;

  useEffect(() => {
    const loadedBusinessUnits = loadBusinessUnits();
    if (loadedBusinessUnits && loadedBusinessUnits.length > 0) {
      setBusinessUnits(loadedBusinessUnits);
      toast({
        title: "Data loaded",
        description: "Loaded employee data from database",
      });
    } else {
      setBusinessUnits(mockBusinessUnits);
    }
  }, [toast]);

  const convertDayOfWeek = (dayOfWeek: number): number | null => {
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    return dayOfWeek;
  };

  const isEmployeeRemoteOnDate = (employee: Employee, date: Date): boolean => {
    const dayOfWeek = convertDayOfWeek(date.getDay());
    if (dayOfWeek === null || !employee.remoteDays) return false;
    return employee.remoteDays.includes(dayOfWeek);
  };

  const formatRemoteDays = (remoteDays: number[]): string => {
    if (!remoteDays || remoteDays.length === 0) return "None";
    
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return remoteDays
      .sort((a, b) => a - b)
      .map(day => {
        const index = day - 1;
        return index >= 0 && index < dayNames.length ? dayNames[index] : null;
      })
      .filter(Boolean)
      .join(", ");
  };

  const calculateCounts = () => {
    const dayOfWeek = convertDayOfWeek(selectedDate.getDay());
    if (dayOfWeek === null) {
      return { officeCount: 0, remoteCount: 0 };
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

  const totalEmployees = businessUnits.reduce(
    (total, unit) => total + unit.employees.length, 0
  );

  const visibleBusinessUnits = showAllUnits
    ? businessUnits
    : businessUnits.slice(0, INITIAL_UNITS_DISPLAYED);

  const allEmployeesWithUnit = useCallback(() => 
    businessUnits.flatMap(unit => 
      unit.employees.map(employee => ({
        ...employee,
        businessUnit: unit.name,
        businessUnitId: unit.id
      }))
    ),
    [businessUnits]
  );

  const applyStatusFilter = useCallback(
    (employees) => {
      if (employeeView === "all") return employees;
      
      return employees.filter(employee => {
        const isRemote = isEmployeeRemoteOnDate(employee, selectedDate);
        return employeeView === "remote" ? isRemote : !isRemote;
      });
    },
    [employeeView, selectedDate]
  );

  const applySearchFilter = useCallback(
    (employees) => {
      if (!searchQuery || searchQuery.trim().length < 3) return employees;
      
      const query = searchQuery.toLowerCase().trim();
      console.log("Applying search filter with query:", query); 
      return employees.filter(employee => 
        employee.name.toLowerCase().includes(query) || 
        (employee.businessUnit && employee.businessUnit.toLowerCase().includes(query))
      );
    },
    [searchQuery]
  );

  const getFilteredEmployees = useCallback(() => {
    console.log("Getting filtered employees with search query:", searchQuery);
    const baseEmployees = allEmployeesWithUnit();
    const statusFiltered = applyStatusFilter(baseEmployees);
    return applySearchFilter(statusFiltered);
  }, [allEmployeesWithUnit, applyStatusFilter, applySearchFilter, searchQuery]);

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
    
    const employeesByBusinessUnit: Record<string, Partial<Employee>[]> = {};
    
    employees.forEach(emp => {
      const businessUnitName = emp.businessUnit || "Unknown";
      if (!employeesByBusinessUnit[businessUnitName]) {
        employeesByBusinessUnit[businessUnitName] = [];
      }
      employeesByBusinessUnit[businessUnitName].push(emp);
    });
    
    Object.entries(employeesByBusinessUnit).forEach(([unitName, unitEmployees]) => {
      let businessUnit = updatedBusinessUnits.find(
        unit => unit.name.toLowerCase() === unitName.toLowerCase()
      );
      
      if (!businessUnit) {
        businessUnit = {
          id: `bu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: unitName,
          employees: []
        };
        updatedBusinessUnits.push(businessUnit);
      }
      
      const newEmployees = unitEmployees.map((emp, index) => ({
        id: `imported-${Date.now()}-${index}`,
        name: emp.name || "Unknown",
        email: emp.email || "",
        remoteDays: emp.remoteDays || [],
      }));
      
      businessUnit.employees = [...businessUnit.employees, ...newEmployees];
    });
    
    const optimizedBusinessUnits = optimizeRemoteDays(updatedBusinessUnits, MAX_OFFICE_CAPACITY);
    
    saveBusinessUnits(optimizedBusinessUnits);
    
    saveCSVUpload({
      timestamp: new Date().toISOString(),
      filename: "CSV Import",
      employees,
      importedAt: new Date().toISOString()
    });
    
    setBusinessUnits(optimizedBusinessUnits);
    
    toast({
      title: "Schedule optimized",
      description: `Remote days assigned to maintain max ${MAX_OFFICE_CAPACITY} people in office per day`,
    });
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Search query changed to:", newValue);
    setSearchQuery(newValue);
  };

  const toggleShowAllUnits = () => {
    setShowAllUnits(prev => !prev);
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Office Schedule</h1>
        <p className="text-gray-600">Manage office presence and remote work schedules</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 animate-slide-up card-glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700">Schedule Overview</CardTitle>
            <CardDescription className="text-blue-500">{MAX_OFFICE_CAPACITY} seats available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="calendar-enhanced mx-auto"
              />
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="badge-office py-1 px-3">
                  In Office: {counts.officeCount}
                </Badge>
                <Badge variant="outline" className="badge-remote py-1 px-3">
                  Remote: {counts.remoteCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up [animation-delay:200ms] card-glass card-hover">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-purple-700">Business Units</CardTitle>
              <div className="flex flex-wrap gap-2">
                <CsvUpload onUpload={handleEmployeeImport} />
                <Button variant="outline" size="sm" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none hover:from-purple-600 hover:to-indigo-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visibleBusinessUnits.map((unit, index) => (
                <div
                  key={unit.id}
                  className="unit-card"
                  style={{
                    background: index % 2 === 0 
                      ? "linear-gradient(90deg, rgba(245,152,168,0.1) 0%, rgba(246,237,178,0.1) 100%)" 
                      : "linear-gradient(90deg, rgba(139,210,246,0.1) 0%, rgba(178,237,246,0.1) 100%)"
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{unit.name}</h3>
                    <Button variant="ghost" size="sm" className="hover:bg-white/30">
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {unit.employees.length} employees
                  </div>
                </div>
              ))}
              
              {businessUnits.length > INITIAL_UNITS_DISPLAYED && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleShowAllUnits}
                  className="w-full mt-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/60 transition-colors flex items-center justify-center"
                >
                  {showAllUnits ? (
                    <span className="flex items-center">Show Less <ChevronDown className="h-4 w-4 ml-1 rotate-180" /></span>
                  ) : (
                    <span className="flex items-center">See More <ChevronDown className="h-4 w-4 ml-1" /></span>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 animate-slide-up [animation-delay:400ms] card-glass card-hover">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-indigo-700">Employee Schedule</CardTitle>
              <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none hover:from-blue-600 hover:to-indigo-600">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={employeeView} onValueChange={(value) => setEmployeeView(value as EmployeeView)} className="w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <TabsList className="rounded-full p-1 bg-blue-50">
                  <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">All Employees</TabsTrigger>
                  <TabsTrigger value="in-office" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">In Office</TabsTrigger>
                  <TabsTrigger value="remote" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-sky-500 data-[state=active]:text-white">Remote</TabsTrigger>
                </TabsList>
                <div className="text-sm text-gray-500 italic">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <SearchInput 
                  id="employee-search-all" 
                  value={searchQuery} 
                  onChange={handleSearchInputChange} 
                  placeholder="Search by name or team..."
                />
                <EmployeeTable 
                  employees={filteredEmployees} 
                  selectedDate={selectedDate} 
                  isRemoteFn={isEmployeeRemoteOnDate} 
                  formatRemoteDaysFn={formatRemoteDays}
                />
              </TabsContent>
              
              <TabsContent value="in-office" className="mt-0">
                <SearchInput 
                  id="employee-search-office" 
                  value={searchQuery} 
                  onChange={handleSearchInputChange} 
                  placeholder="Search by name or team..."
                />
                <EmployeeTable 
                  employees={filteredEmployees} 
                  selectedDate={selectedDate} 
                  isRemoteFn={isEmployeeRemoteOnDate} 
                  formatRemoteDaysFn={formatRemoteDays}
                />
              </TabsContent>
              
              <TabsContent value="remote" className="mt-0">
                <SearchInput 
                  id="employee-search-remote" 
                  value={searchQuery} 
                  onChange={handleSearchInputChange} 
                  placeholder="Search by name or team..."
                />
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-slide-up [animation-delay:600ms] card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-lg"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xl text-green-700">Total In Office</CardTitle>
            <CardDescription className="text-green-600">
              Employees present on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center">
              <div className="text-5xl font-bold text-green-600">{counts.officeCount}</div>
              <div className="ml-4 text-sm text-gray-600">
                {Math.round((counts.officeCount / totalEmployees) * 100) || 0}% of total workforce
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up [animation-delay:700ms] card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-lg"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xl text-blue-700">Total Remote</CardTitle>
            <CardDescription className="text-blue-600">
              Employees working remotely on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center">
              <div className="text-5xl font-bold text-blue-600">{counts.remoteCount}</div>
              <div className="ml-4 text-sm text-gray-600">
                {Math.round((counts.remoteCount / totalEmployees) * 100) || 0}% of total workforce
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface EmployeeTableProps {
  employees: (Employee & { businessUnit: string, businessUnitId: string })[];
  selectedDate: Date;
  isRemoteFn: (employee: Employee, date: Date) => boolean;
  formatRemoteDaysFn: (remoteDays: number[]) => string;
}

const EmployeeTable = ({ employees, selectedDate, isRemoteFn, formatRemoteDaysFn }: EmployeeTableProps) => {
  return (
    <Table className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
      <TableHeader className="bg-blue-50">
        <TableRow className="table-header-row">
          <TableHead className="text-blue-700 font-semibold">Name</TableHead>
          <TableHead className="text-blue-700 font-semibold">Business Unit</TableHead>
          <TableHead className="text-blue-700 font-semibold">Remote Days</TableHead>
          <TableHead className="text-blue-700 font-semibold">Status</TableHead>
          <TableHead className="text-blue-700 font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12 text-gray-500">
              No employees match the selected criteria
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee, index) => (
            <TableRow key={employee.id} className={`table-row-hover ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.businessUnit}</TableCell>
              <TableCell>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-sm inline-block">
                  {formatRemoteDaysFn(employee.remoteDays)}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    isRemoteFn(employee, selectedDate)
                      ? "badge-remote"
                      : "badge-office"
                  }
                >
                  {isRemoteFn(employee, selectedDate)
                    ? "Remote"
                    : "In Office"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <Edit className="h-4 w-4 text-blue-600" />
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
