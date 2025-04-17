import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertRestaurantConfigSchema, 
  insertShiftTypeSchema, 
  insertPositionSchema, 
  insertEmployeeSchema,
  ShiftInput
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET restaurant configuration
  app.get("/api/setup", async (req, res) => {
    try {
      const config = await storage.getRestaurantConfig();
      const shiftTypes = await storage.getShiftTypes();
      const positions = await storage.getPositions();
      
      res.json({
        restaurant: config,
        shiftTypes,
        positions
      });
    } catch (error) {
      console.error("Error fetching setup:", error);
      res.status(500).json({ message: "Failed to fetch setup" });
    }
  });

  // Save/update restaurant configuration
  app.post("/api/setup", async (req, res) => {
    try {
      const { restaurant, shiftTypes, positions } = req.body;
      
      // Update restaurant config
      let config = await storage.getRestaurantConfig();
      if (config) {
        const validatedData = insertRestaurantConfigSchema.parse(restaurant);
        config = await storage.updateRestaurantConfig(config.id, validatedData);
      } else {
        const validatedData = insertRestaurantConfigSchema.parse(restaurant);
        config = await storage.saveRestaurantConfig(validatedData);
      }
      
      // Handle shift types
      const currentShiftTypes = await storage.getShiftTypes();
      const shiftTypeIds = new Set(currentShiftTypes.map(st => st.id));
      
      for (const shiftType of shiftTypes) {
        const validatedData = insertShiftTypeSchema.parse(shiftType);
        if (shiftType.id && shiftTypeIds.has(shiftType.id)) {
          await storage.updateShiftType(shiftType.id, validatedData);
          shiftTypeIds.delete(shiftType.id);
        } else if (!shiftType.id) {
          await storage.addShiftType(validatedData);
        }
      }
      
      // Delete removed shift types
      for (const id of shiftTypeIds) {
        await storage.deleteShiftType(id);
      }
      
      // Handle positions
      const currentPositions = await storage.getPositions();
      const positionIds = new Set(currentPositions.map(p => p.id));
      
      for (const position of positions) {
        const validatedData = insertPositionSchema.parse(position);
        if (position.id && positionIds.has(position.id)) {
          await storage.updatePosition(position.id, validatedData);
          positionIds.delete(position.id);
        } else if (!position.id) {
          await storage.addPosition(validatedData);
        }
      }
      
      // Delete removed positions
      for (const id of positionIds) {
        await storage.deletePosition(id);
      }
      
      // Return updated data
      const updatedShiftTypes = await storage.getShiftTypes();
      const updatedPositions = await storage.getPositions();
      
      res.json({
        restaurant: config,
        shiftTypes: updatedShiftTypes,
        positions: updatedPositions
      });
    } catch (error) {
      console.error("Error saving setup:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save setup" });
      }
    }
  });

  // GET all employees
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // GET a single employee
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Add a new employee
  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      
      // Check if employee ID already exists
      const existingEmployee = await storage.getEmployeeByEmployeeId(employeeData.employeeId);
      if (existingEmployee) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
      
      const employee = await storage.addEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error adding employee:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add employee" });
      }
    }
  });

  // Update an employee
  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.parse(req.body);
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check if updated employee ID already exists (if changing ID)
      if (employeeData.employeeId !== existingEmployee.employeeId) {
        const duplicateEmployee = await storage.getEmployeeByEmployeeId(employeeData.employeeId);
        if (duplicateEmployee) {
          return res.status(400).json({ message: "Employee ID already exists" });
        }
      }
      
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update employee" });
      }
    }
  });

  // Delete an employee
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Calculate tip distribution
  app.post("/api/calculate-tips", async (req, res) => {
    try {
      const shiftData = req.body as ShiftInput;
      
      const totalPoints = shiftData.employees.reduce((sum, emp) => sum + emp.points, 0);
      
      if (totalPoints === 0) {
        return res.status(400).json({ message: "Total points cannot be zero" });
      }
      
      const digitalTips = shiftData.creditCardTips + shiftData.houseTips;
      const cashTips = shiftData.cashTips;
      
      const results = shiftData.employees.map(emp => {
        const pointShare = emp.points / totalPoints;
        const digitalTipShare = digitalTips * pointShare;
        const cashTipShare = cashTips * pointShare;
        
        return {
          employeeId: emp.employeeId,
          position: emp.position,
          hours: emp.hoursWorked,
          points: emp.points,
          digitalTips: digitalTipShare,
          cashTips: cashTipShare
        };
      });
      
      // Add employee names
      const employees = await storage.getEmployees();
      const resultsWithNames = await Promise.all(results.map(async result => {
        const employee = employees.find(e => e.employeeId === result.employeeId);
        const name = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${result.employeeId}`;
        
        return {
          ...result,
          name
        };
      }));
      
      res.json(resultsWithNames);
    } catch (error) {
      console.error("Error calculating tips:", error);
      res.status(500).json({ message: "Failed to calculate tips" });
    }
  });

  // Save a shift with results
  app.post("/api/shifts", async (req, res) => {
    try {
      const { shift, results } = req.body;
      
      // Prepare shift data
      const shiftData = {
        date: shift.date,
        type: shift.type,
        creditCardTips: parseFloat(shift.creditCardTips),
        houseTips: parseFloat(shift.houseTips),
        cashTips: parseFloat(shift.cashTips)
      };
      
      // Prepare shift employees data
      const shiftEmployeesData = results.map(result => ({
        employeeId: result.employeeId,
        position: result.position,
        pointValue: result.points / result.hours, // Calculate point value
        clockIn: shift.employees.find(e => e.employeeId === result.employeeId)?.clockIn || "00:00",
        clockOut: shift.employees.find(e => e.employeeId === result.employeeId)?.clockOut || "00:00",
        hoursWorked: result.hours,
        points: result.points,
        digitalTips: result.digitalTips,
        cashTips: result.cashTips
      }));
      
      const savedShift = await storage.addShift(shiftData, shiftEmployeesData);
      res.status(201).json(savedShift);
    } catch (error) {
      console.error("Error saving shift:", error);
      res.status(500).json({ message: "Failed to save shift" });
    }
  });

  // GET all shifts with employee count
  app.get("/api/shifts", async (req, res) => {
    try {
      const shifts = await storage.getShiftWithEmployeeCount();
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  // GET a single shift with results
  app.get("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      const results = await storage.getShiftResults(id);
      const shiftEmployees = await storage.getShiftEmployees(id);
      
      // Combine results with shift employee data for editing
      const enhancedResults = results.map(result => {
        const shiftEmployee = shiftEmployees.find(se => se.employeeId === result.employeeId);
        return {
          ...result,
          clockIn: shiftEmployee?.clockIn || "00:00",
          clockOut: shiftEmployee?.clockOut || "00:00",
          pointValue: shiftEmployee?.pointValue || 1.0
        };
      });
      
      res.json({
        shift,
        results: enhancedResults
      });
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  // Update a shift
  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if shift exists
      const existingShift = await storage.getShift(id);
      if (!existingShift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      const { shift, employees } = req.body;
      
      // Format the update data
      const shiftData = {
        date: shift.date,
        type: shift.type,
        creditCardTips: parseFloat(shift.creditCardTips),
        houseTips: parseFloat(shift.houseTips),
        cashTips: parseFloat(shift.cashTips)
      };
      
      // Format employee data for update
      const shiftEmployeesData = employees.map(employee => ({
        employeeId: employee.employeeId,
        position: employee.position,
        pointValue: parseFloat(employee.pointValue),
        clockIn: employee.clockIn,
        clockOut: employee.clockOut,
        hoursWorked: parseFloat(employee.hoursWorked),
        points: parseFloat(employee.points),
        digitalTips: 0, // Will be recalculated by the storage layer
        cashTips: 0    // Will be recalculated by the storage layer
      }));
      
      // Update shift data
      const updatedShift = await storage.updateShift(id, shiftData, shiftEmployeesData);
      res.json(updatedShift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  // Delete a shift
  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if shift exists
      const existingShift = await storage.getShift(id);
      if (!existingShift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      await storage.deleteShift(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
