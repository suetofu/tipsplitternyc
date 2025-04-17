import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useRestaurantStore } from "@/lib/hooks/useRestaurantStore";
import { calculateHoursWorked } from "@/lib/utils/timeUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { PlusCircle, Calculator, Trash2 } from "lucide-react";

const NewShift = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { shiftTypes, positions, timeRounding } = useRestaurantStore();
  
  // Current shift state
  const [shift, setShift] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "",
    creditCardTips: "",
    houseTips: "",
    cashTips: "",
    employees: []
  });
  
  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  // Initialize with first shift type when available
  useEffect(() => {
    if (shiftTypes.length > 0 && !shift.type) {
      setShift(prev => ({ ...prev, type: shiftTypes[0].name }));
    }
  }, [shiftTypes, shift.type]);
  
  // Calculate tips mutation
  const calculateMutation = useMutation({
    mutationFn: async (shiftData) => {
      const response = await apiRequest("POST", "/api/calculate-tips", shiftData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Store the calculation results in sessionStorage for the results page
      sessionStorage.setItem("tipCalculation", JSON.stringify({
        shift,
        results: data
      }));
      
      // Navigate to results page
      navigate("/results");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to calculate tips: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Add employee to shift
  const addEmployeeToShift = () => {
    setShift(prev => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          employeeId: "",
          position: "",
          pointValue: 1.0,
          clockIn: "",
          clockOut: "",
          hoursWorked: 0,
          points: 0
        }
      ]
    }));
  };
  
  // Remove employee from shift
  const removeEmployeeFromShift = (index) => {
    setShift(prev => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };
  
  // Update employee selection
  const updateEmployeeSelection = (index, employeeId) => {
    const selectedEmployee = employees.find(emp => emp.employeeId.toString() === employeeId);
    
    setShift(prev => {
      const updatedEmployees = [...prev.employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        employeeId: parseInt(employeeId),
        position: "", // Reset position when employee changes
        pointValue: 1.0, // Reset point value
      };
      return { ...prev, employees: updatedEmployees };
    });
  };
  
  // Update employee position
  const updateEmployeePosition = (index, position) => {
    const positionConfig = positions.find(p => p.name === position);
    const pointValue = positionConfig ? positionConfig.pointValue : 1.0;
    
    setShift(prev => {
      const updatedEmployees = [...prev.employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        position,
        pointValue
      };
      
      // Recalculate points if hours exist
      if (updatedEmployees[index].hoursWorked > 0) {
        updatedEmployees[index].points = updatedEmployees[index].hoursWorked * pointValue;
      }
      
      return { ...prev, employees: updatedEmployees };
    });
  };
  
  // Update point value
  const updatePointValue = (index, value) => {
    const pointValue = parseFloat(value) || 0;
    
    setShift(prev => {
      const updatedEmployees = [...prev.employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        pointValue
      };
      
      // Recalculate points if hours exist
      if (updatedEmployees[index].hoursWorked > 0) {
        updatedEmployees[index].points = updatedEmployees[index].hoursWorked * pointValue;
      }
      
      return { ...prev, employees: updatedEmployees };
    });
  };
  
  // Update time and calculate hours
  const updateTime = (index, field, value) => {
    setShift(prev => {
      const updatedEmployees = [...prev.employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        [field]: value
      };
      
      // Calculate hours if both clock in and out are set
      if (updatedEmployees[index].clockIn && updatedEmployees[index].clockOut) {
        const hours = calculateHoursWorked(
          updatedEmployees[index].clockIn,
          updatedEmployees[index].clockOut,
          timeRounding
        );
        
        updatedEmployees[index].hoursWorked = hours;
        updatedEmployees[index].points = hours * updatedEmployees[index].pointValue;
      }
      
      return { ...prev, employees: updatedEmployees };
    });
  };
  
  // Get positions for a specific employee
  const getEmployeePositions = (employeeId) => {
    if (!employeeId) return [];
    const employee = employees.find(emp => emp.employeeId === parseInt(employeeId));
    return employee ? employee.positions : [];
  };
  
  // Calculate tips
  const calculateTips = () => {
    // Validate inputs
    if (!shift.date || !shift.type) {
      toast({
        title: "Error",
        description: "Please enter shift date and type",
        variant: "destructive",
      });
      return;
    }
    
    if (!shift.creditCardTips && !shift.houseTips && !shift.cashTips) {
      toast({
        title: "Error",
        description: "Please enter at least one tip amount",
        variant: "destructive",
      });
      return;
    }
    
    if (shift.employees.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one employee to the shift",
        variant: "destructive",
      });
      return;
    }
    
    // Check if any employee is incomplete
    const hasIncompleteEmployee = shift.employees.some(emp => 
      !emp.employeeId || 
      !emp.position || 
      !emp.clockIn || 
      !emp.clockOut
    );
    
    if (hasIncompleteEmployee) {
      toast({
        title: "Error",
        description: "Please complete all employee information (employee, position, clock-in, clock-out)",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for calculation
    const shiftData = {
      date: shift.date,
      type: shift.type,
      creditCardTips: parseFloat(shift.creditCardTips) || 0,
      houseTips: parseFloat(shift.houseTips) || 0,
      cashTips: parseFloat(shift.cashTips) || 0,
      employees: shift.employees.map(emp => ({
        employeeId: emp.employeeId,
        position: emp.position,
        pointValue: emp.pointValue,
        clockIn: emp.clockIn,
        clockOut: emp.clockOut,
        hoursWorked: emp.hoursWorked,
        points: emp.points
      }))
    };
    
    calculateMutation.mutate(shiftData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">New Shift Entry</h2>
        <Button 
          onClick={calculateTips}
          disabled={calculateMutation.isPending}
        >
          <Calculator className="h-4 w-4 mr-2" />
          {calculateMutation.isPending ? "Calculating..." : "Calculate Tips"}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor="shift-date">Date</Label>
              <Input
                id="shift-date"
                type="date"
                value={shift.date}
                onChange={(e) => setShift(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="shift-type">Shift Type</Label>
              <Select
                value={shift.type}
                onValueChange={(value) => setShift(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="shift-type" className="mt-1">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="credit-tips">Credit Card Tips ($)</Label>
              <Input
                id="credit-tips"
                type="number"
                step="0.01"
                min="0"
                value={shift.creditCardTips}
                onChange={(e) => setShift(prev => ({ ...prev, creditCardTips: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="house-tips">House Tips ($)</Label>
              <Input
                id="house-tips"
                type="number"
                step="0.01"
                min="0"
                value={shift.houseTips}
                onChange={(e) => setShift(prev => ({ ...prev, houseTips: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cash-tips">Cash Tips ($)</Label>
              <Input
                id="cash-tips"
                type="number"
                step="0.01"
                min="0"
                value={shift.cashTips}
                onChange={(e) => setShift(prev => ({ ...prev, cashTips: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Employees on Shift</CardTitle>
            <Button 
              variant="outline"
              size="sm"
              onClick={addEmployeeToShift}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Point Value</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shift.employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No employees added to this shift yet. Use the "Add Employee" button to add staff.
                    </TableCell>
                  </TableRow>
                ) : (
                  shift.employees.map((employee, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={employee.employeeId?.toString() || ""}
                          onValueChange={(value) => updateEmployeeSelection(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.employeeId.toString()}>
                                {emp.firstName} {emp.lastName} (#{emp.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={employee.position}
                          onValueChange={(value) => updateEmployeePosition(index, value)}
                          disabled={!employee.employeeId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Position" />
                          </SelectTrigger>
                          <SelectContent>
                            {getEmployeePositions(employee.employeeId).map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          max="5"
                          value={employee.pointValue}
                          onChange={(e) => updatePointValue(index, e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={employee.clockIn}
                          onChange={(e) => updateTime(index, "clockIn", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={employee.clockOut}
                          onChange={(e) => updateTime(index, "clockOut", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {employee.hoursWorked.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {employee.points.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmployeeFromShift(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewShift;
