import { 
  RestaurantConfig, InsertRestaurantConfig, 
  ShiftType, InsertShiftType, 
  Position, InsertPosition, 
  Employee, InsertEmployee, 
  Shift, InsertShift, 
  ShiftEmployee, InsertShiftEmployee,
  ShiftInput, TipDistributionResult, ShiftResult
} from "@shared/schema";

export interface IStorage {
  // Restaurant Configuration
  getRestaurantConfig(): Promise<RestaurantConfig | undefined>;
  saveRestaurantConfig(config: InsertRestaurantConfig): Promise<RestaurantConfig>;
  updateRestaurantConfig(id: number, config: Partial<InsertRestaurantConfig>): Promise<RestaurantConfig>;

  // Shift Types
  getShiftTypes(): Promise<ShiftType[]>;
  addShiftType(shiftType: InsertShiftType): Promise<ShiftType>;
  updateShiftType(id: number, shiftType: InsertShiftType): Promise<ShiftType>;
  deleteShiftType(id: number): Promise<void>;

  // Positions
  getPositions(): Promise<Position[]>;
  addPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: InsertPosition): Promise<Position>;
  deletePosition(id: number): Promise<void>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: number): Promise<Employee | undefined>;
  addEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Shifts
  getShifts(): Promise<Shift[]>;
  getShiftWithEmployeeCount(): Promise<Array<Shift & { employeeCount: number }>>;
  getShift(id: number): Promise<Shift | undefined>;
  addShift(shift: InsertShift, employees: InsertShiftEmployee[]): Promise<ShiftResult>;
  updateShift(id: number, shift: Partial<InsertShift>, employees: InsertShiftEmployee[]): Promise<ShiftResult>;
  deleteShift(id: number): Promise<void>;

  // Shift Employees
  getShiftEmployees(shiftId: number): Promise<ShiftEmployee[]>;
  getShiftResults(shiftId: number): Promise<TipDistributionResult[]>;
}

export class MemStorage implements IStorage {
  private restaurantConfig: Map<number, RestaurantConfig>;
  private shiftTypes: Map<number, ShiftType>;
  private positions: Map<number, Position>;
  private employees: Map<number, Employee>;
  private shifts: Map<number, Shift>;
  private shiftEmployees: Map<number, ShiftEmployee>;
  private currentIds: {
    restaurantConfig: number;
    shiftType: number;
    position: number;
    employee: number;
    shift: number;
    shiftEmployee: number;
  };

  constructor() {
    this.restaurantConfig = new Map();
    this.shiftTypes = new Map();
    this.positions = new Map();
    this.employees = new Map();
    this.shifts = new Map();
    this.shiftEmployees = new Map();
    this.currentIds = {
      restaurantConfig: 1,
      shiftType: 1,
      position: 1,
      employee: 1,
      shift: 1,
      shiftEmployee: 1
    };

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default restaurant config
    this.saveRestaurantConfig({
      name: "My Restaurant"
    });

    // Default shift types
    ["Lunch", "Dinner", "Brunch"].forEach(name => {
      this.addShiftType({ name });
    });

    // Default positions
    [
      { name: "Server", pointValue: 1.0 },
      { name: "Bartender", pointValue: 1.0 },
      { name: "Busser", pointValue: 0.55 },
      { name: "Runner", pointValue: 0.65 },
      { name: "Expo", pointValue: 0.75 }
    ].forEach(position => {
      this.addPosition(position);
    });

    // Default employees
    [
      { employeeId: 3, firstName: "Johnny", lastName: "M", positions: ["Bartender"] },
      { employeeId: 15, firstName: "Harold", lastName: "Z", positions: ["Server"] },
      { employeeId: 30, firstName: "Andrew", lastName: "P", positions: ["Server"] },
      { employeeId: 21, firstName: "Drake", lastName: "S", positions: ["Server"] },
      { employeeId: 4, firstName: "Nick", lastName: "A", positions: ["Server"] },
      { employeeId: 36, firstName: "Diana", lastName: "M", positions: ["Expo"] },
      { employeeId: 16, firstName: "Fred", lastName: "P", positions: ["Runner"] },
      { employeeId: 29, firstName: "Deblyn", lastName: "N", positions: ["Busser"] },
      { employeeId: 5, firstName: "Louis", lastName: "C", positions: ["Busser"] }
    ].forEach(employee => {
      this.addEmployee(employee);
    });
  }

  // Restaurant Configuration
  async getRestaurantConfig(): Promise<RestaurantConfig | undefined> {
    // Return the first config (there should only be one)
    for (const config of this.restaurantConfig.values()) {
      return config;
    }
    return undefined;
  }

  async saveRestaurantConfig(config: InsertRestaurantConfig): Promise<RestaurantConfig> {
    const id = this.currentIds.restaurantConfig++;
    const newConfig: RestaurantConfig = { ...config, id };
    this.restaurantConfig.set(id, newConfig);
    return newConfig;
  }

  async updateRestaurantConfig(id: number, config: Partial<InsertRestaurantConfig>): Promise<RestaurantConfig> {
    const existingConfig = this.restaurantConfig.get(id);
    if (!existingConfig) throw new Error(`Restaurant config with id ${id} not found`);
    
    const updatedConfig = { ...existingConfig, ...config };
    this.restaurantConfig.set(id, updatedConfig);
    return updatedConfig;
  }

  // Shift Types
  async getShiftTypes(): Promise<ShiftType[]> {
    return Array.from(this.shiftTypes.values());
  }

  async addShiftType(shiftType: InsertShiftType): Promise<ShiftType> {
    const id = this.currentIds.shiftType++;
    const newShiftType: ShiftType = { ...shiftType, id };
    this.shiftTypes.set(id, newShiftType);
    return newShiftType;
  }

  async updateShiftType(id: number, shiftType: InsertShiftType): Promise<ShiftType> {
    const existingShiftType = this.shiftTypes.get(id);
    if (!existingShiftType) throw new Error(`Shift type with id ${id} not found`);
    
    const updatedShiftType = { ...existingShiftType, ...shiftType };
    this.shiftTypes.set(id, updatedShiftType);
    return updatedShiftType;
  }

  async deleteShiftType(id: number): Promise<void> {
    this.shiftTypes.delete(id);
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async addPosition(position: InsertPosition): Promise<Position> {
    const id = this.currentIds.position++;
    const newPosition: Position = { ...position, id };
    this.positions.set(id, newPosition);
    return newPosition;
  }

  async updatePosition(id: number, position: InsertPosition): Promise<Position> {
    const existingPosition = this.positions.get(id);
    if (!existingPosition) throw new Error(`Position with id ${id} not found`);
    
    const updatedPosition = { ...existingPosition, ...position };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<void> {
    this.positions.delete(id);
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmployeeId(employeeId: number): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      employee => employee.employeeId === employeeId
    );
  }

  async addEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.currentIds.employee++;
    const newEmployee: Employee = { ...employee, id };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const existingEmployee = this.employees.get(id);
    if (!existingEmployee) throw new Error(`Employee with id ${id} not found`);
    
    const updatedEmployee = { ...existingEmployee, ...employee };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    this.employees.delete(id);
  }

  // Shifts
  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }
  
  async getShiftWithEmployeeCount(): Promise<Array<Shift & { employeeCount: number }>> {
    const shifts = await this.getShifts();
    const results = [];
    
    for (const shift of shifts) {
      const employees = await this.getShiftEmployees(shift.id);
      results.push({
        ...shift,
        employeeCount: employees.length
      });
    }
    
    return results;
  }

  async addShift(shiftData: InsertShift, shiftEmployeesData: InsertShiftEmployee[]): Promise<ShiftResult> {
    const id = this.currentIds.shift++;
    const timestamp = new Date();
    
    const newShift: Shift = { 
      ...shiftData, 
      id, 
      createdAt: timestamp
    };
    
    this.shifts.set(id, newShift);
    
    // Save shift employees
    const results: TipDistributionResult[] = [];
    
    for (const employeeData of shiftEmployeesData) {
      const seId = this.currentIds.shiftEmployee++;
      const shiftEmployee: ShiftEmployee = {
        ...employeeData,
        id: seId,
        shiftId: id
      };
      
      this.shiftEmployees.set(seId, shiftEmployee);
      
      // Get employee details for results
      const employee = await this.getEmployeeByEmployeeId(employeeData.employeeId);
      if (employee) {
        results.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employeeData.position,
          hours: employeeData.hoursWorked,
          points: employeeData.points,
          digitalTips: employeeData.digitalTips,
          cashTips: employeeData.cashTips
        });
      }
    }
    
    return {
      shift: newShift,
      results
    };
  }

  async updateShift(id: number, shiftData: Partial<InsertShift>, shiftEmployeesData: InsertShiftEmployee[]): Promise<ShiftResult> {
    // Find existing shift
    const existingShift = this.shifts.get(id);
    if (!existingShift) throw new Error(`Shift with id ${id} not found`);
    
    // Update shift data
    const updatedShift = { 
      ...existingShift,
      ...shiftData
    };
    
    this.shifts.set(id, updatedShift);
    
    // Delete all existing shift employees
    const existingEmployees = await this.getShiftEmployees(id);
    for (const employee of existingEmployees) {
      this.shiftEmployees.delete(employee.id);
    }
    
    // Add new shift employees
    const results: TipDistributionResult[] = [];
    
    for (const employeeData of shiftEmployeesData) {
      const seId = this.currentIds.shiftEmployee++;
      const shiftEmployee: ShiftEmployee = {
        ...employeeData,
        id: seId,
        shiftId: id
      };
      
      this.shiftEmployees.set(seId, shiftEmployee);
      
      // Get employee details for results
      const employee = await this.getEmployeeByEmployeeId(employeeData.employeeId);
      if (employee) {
        results.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employeeData.position,
          hours: employeeData.hoursWorked,
          points: employeeData.points,
          digitalTips: employeeData.digitalTips,
          cashTips: employeeData.cashTips
        });
      }
    }
    
    return {
      shift: updatedShift,
      results
    };
  }

  async deleteShift(id: number): Promise<void> {
    this.shifts.delete(id);
    
    // Delete all shift employees for this shift
    for (const [seId, se] of this.shiftEmployees.entries()) {
      if (se.shiftId === id) {
        this.shiftEmployees.delete(seId);
      }
    }
  }

  // Shift Employees
  async getShiftEmployees(shiftId: number): Promise<ShiftEmployee[]> {
    return Array.from(this.shiftEmployees.values())
      .filter(se => se.shiftId === shiftId);
  }

  async getShiftResults(shiftId: number): Promise<TipDistributionResult[]> {
    const shiftEmployees = await this.getShiftEmployees(shiftId);
    const results: TipDistributionResult[] = [];
    
    for (const se of shiftEmployees) {
      const employee = await this.getEmployeeByEmployeeId(se.employeeId);
      if (employee) {
        results.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          position: se.position,
          hours: se.hoursWorked,
          points: se.points,
          digitalTips: se.digitalTips,
          cashTips: se.cashTips
        });
      }
    }
    
    return results;
  }
}

export const storage = new MemStorage();
