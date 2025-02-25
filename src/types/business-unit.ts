
export interface Employee {
  id: string;
  name: string;
  email: string;
  remoteDays: number[];
}

export interface BusinessUnit {
  id: string;
  name: string;
  employees: Employee[];
}

export interface Schedule {
  date: Date;
  presentEmployees: Employee[];
  remoteEmployees: Employee[];
}
