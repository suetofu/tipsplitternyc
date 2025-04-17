import { ShiftEmployeeInput } from "@shared/schema";

/**
 * Calculate total points for a shift
 */
export function calculateTotalPoints(employees: ShiftEmployeeInput[]): number {
  return employees.reduce((sum, employee) => sum + (employee.points || 0), 0);
}

/**
 * Calculate tips for each employee based on their points
 */
export function calculateEmployeeTips(
  employees: ShiftEmployeeInput[],
  digitalTipsTotal: number,
  cashTipsTotal: number
) {
  const totalPoints = calculateTotalPoints(employees);
  
  if (totalPoints === 0) {
    return {
      results: [],
      validation: { digital: true, cash: true }
    };
  }
  
  const results = employees.map(employee => {
    const pointShare = employee.points / totalPoints;
    const digitalTips = digitalTipsTotal * pointShare;
    const cashTips = cashTipsTotal * pointShare;
    
    return {
      employeeId: employee.employeeId,
      position: employee.position,
      hours: employee.hoursWorked,
      points: employee.points,
      digitalTips,
      cashTips
    };
  });
  
  // Validate that the sum of distributed tips matches the input totals
  const distributedDigital = results.reduce((sum, r) => sum + r.digitalTips, 0);
  const distributedCash = results.reduce((sum, r) => sum + r.cashTips, 0);
  
  return {
    results,
    validation: {
      digital: Math.abs(digitalTipsTotal - distributedDigital) < 0.02,
      cash: Math.abs(cashTipsTotal - distributedCash) < 0.02
    }
  };
}
