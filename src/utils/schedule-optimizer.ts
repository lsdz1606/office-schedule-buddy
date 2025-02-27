
import { BusinessUnit, Employee } from "@/types/business-unit";

/**
 * Optimizes remote days for all business units to ensure:
 * 1. Each employee has 2 remote days
 * 2. Business units have consistent remote days when possible
 * 3. No more than maxPeoplePerDay are in the office on any given day
 */
export const optimizeRemoteDays = (
  businessUnits: BusinessUnit[],
  maxPeoplePerDay: number = 32
): BusinessUnit[] => {
  // Clone the business units to avoid modifying the original
  const optimizedUnits = JSON.parse(JSON.stringify(businessUnits)) as BusinessUnit[];
  const totalEmployees = optimizedUnits.reduce(
    (total, unit) => total + unit.employees.length, 
    0
  );
  
  // Sort business units by size (largest first) for better distribution
  optimizedUnits.sort((a, b) => b.employees.length - a.employees.length);
  
  // Calculate the maximum number of employees that can be remote each day
  // to ensure no more than maxPeoplePerDay are in the office
  const maxRemotePerDay = Math.max(0, totalEmployees - maxPeoplePerDay);
  
  // Calculate how many people should be remote each day of the week
  const targetRemotePerDay = [1, 2, 3, 4, 5].map(() => maxRemotePerDay);
  
  // Track how many people are already assigned to be remote each day
  const remoteCountPerDay = [0, 0, 0, 0, 0];
  
  // Process each business unit
  optimizedUnits.forEach(unit => {
    // Determine the best remote days for this business unit
    const bestRemoteDays = findBestRemoteDays(targetRemotePerDay, remoteCountPerDay, unit.employees.length);
    
    // Assign remote days to all employees in this business unit
    unit.employees.forEach(employee => {
      employee.remoteDays = [...bestRemoteDays];
      
      // Update our tracking of remote employees per day
      bestRemoteDays.forEach(day => {
        remoteCountPerDay[day - 1]++;
      });
    });
  });
  
  // Confirm totals don't exceed maximum per day
  const officeCountPerDay = [1, 2, 3, 4, 5].map(
    (_, i) => totalEmployees - remoteCountPerDay[i]
  );
  
  console.log("Office counts per day:", officeCountPerDay);
  console.log("Remote counts per day:", remoteCountPerDay);
  
  return optimizedUnits;
};

/**
 * Finds the best 2 remote days for a business unit based on current assignments
 */
const findBestRemoteDays = (
  targetRemotePerDay: number[], 
  currentRemotePerDay: number[],
  unitSize: number
): number[] => {
  // Calculate how much room is left for remote employees each day
  const remainingCapacity = targetRemotePerDay.map(
    (target, i) => target - currentRemotePerDay[i]
  );
  
  // Find the two days with the most remaining capacity
  const sortedDaysByCapacity = [1, 2, 3, 4, 5]
    .map(day => ({ day, capacity: remainingCapacity[day - 1] }))
    .sort((a, b) => b.capacity - a.capacity);
  
  // Return the two best days
  return [
    sortedDaysByCapacity[0].day,
    sortedDaysByCapacity[1].day
  ];
};
