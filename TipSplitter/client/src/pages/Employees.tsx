import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantStore } from "@/lib/hooks/useRestaurantStore";
import EmployeeModal from "@/components/EmployeeModal";

import { Search, UserPlus, FileUp } from "lucide-react";
import { Employee, Position } from "@shared/schema";

const Employees = () => {
  const { toast } = useToast();
  const { positions } = useRestaurantStore();
  
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete employee: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleOpenModal = (employee: Employee | null = null) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (updated: boolean) => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    if (updated) {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    }
  };
  
  const handleDeleteEmployee = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Filter employees
  const filteredEmployees = employees.filter((employee: Employee) => {
    const searchMatch = 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      employee.employeeId.toString().includes(search);
    
    const positionMatch = 
      positionFilter === "all" || 
      (employee.positions as string[]).includes(positionFilter);
    
    return searchMatch && positionMatch;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Employee Management</h2>
        <div className="flex space-x-3">
          <Button onClick={() => handleOpenModal(null)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
          <Button variant="outline">
            <FileUp className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Select
          value={positionFilter}
          onValueChange={setPositionFilter}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map((position: Position) => (
              <SelectItem key={position.id} value={position.name}>
                {position.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-4">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {employees.length === 0
                        ? "No employees added yet. Add your first employee using the button above."
                        : "No employees match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee: Employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(employee.positions as string[]).map((position, i) => (
                            <Badge key={i} variant="secondary">
                              {position}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleOpenModal(employee)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Delete
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
      
      <EmployeeModal
        open={isModalOpen}
        onClose={handleCloseModal}
        employee={editingEmployee}
      />
    </div>
  );
};

export default Employees;
