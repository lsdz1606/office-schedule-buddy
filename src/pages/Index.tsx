
import { useState } from "react";
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
import { Edit, UserPlus, Users } from "lucide-react";
import { BusinessUnit, Employee } from "@/types/business-unit";

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

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [businessUnits] = useState<BusinessUnit[]>(mockBusinessUnits);

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
            <CardDescription>32 seats available</CardDescription>
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
                  In Office: 24
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  Remote: 8
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up [animation-delay:200ms]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Business Units</CardTitle>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
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
                {businessUnits.flatMap((unit) =>
                  unit.employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>
                        {employee.remoteDays
                          .map((day) =>
                            ["Mon", "Tue", "Wed", "Thu", "Fri"][day - 1]
                          )
                          .join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            employee.remoteDays.includes(
                              selectedDate.getDay()
                            )
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }
                        >
                          {employee.remoteDays.includes(
                            selectedDate.getDay()
                          )
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
