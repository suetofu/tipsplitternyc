import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { exportToCSV } from "@/lib/utils/csvExport";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { useLocation } from "wouter";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Eye, FileDown, Trash2, Edit } from "lucide-react";

const History = () => {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedShift, setSelectedShift] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["/api/shifts"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete shift: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Filter shifts based on time selection
  const filteredShifts = shifts.filter(shift => {
    if (timeFilter === "all") return true;
    
    const shiftDate = new Date(shift.date);
    const today = new Date();
    
    if (timeFilter === "last-week") {
      const weekAgo = subDays(today, 7);
      return isAfter(shiftDate, weekAgo);
    }
    
    if (timeFilter === "last-month") {
      const monthAgo = subMonths(today, 1);
      return isAfter(shiftDate, monthAgo);
    }
    
    return true;
  });
  
  // Handle view shift details
  const handleViewShift = async (shiftId) => {
    try {
      const response = await apiRequest("GET", `/api/shifts/${shiftId}`);
      const shiftData = await response.json();
      
      // Display shift details
      setSelectedShift(shiftData);
      
      // In a real app, you would navigate to a detailed view
      // or open a modal with the shift details
      toast({
        title: `Shift: ${shiftData.shift.date} - ${shiftData.shift.type}`,
        description: `Employees: ${shiftData.results.length}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load shift details: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Export shift to CSV
  const handleExportShift = async (shiftId) => {
    try {
      const response = await apiRequest("GET", `/api/shifts/${shiftId}`);
      const { shift, results } = await response.json();
      
      const filename = `tip-distribution-${shift.date}-${shift.type}.csv`;
      
      const headers = [
        "Employee ID",
        "Name",
        "Position",
        "Hours Worked",
        "Points",
        "Digital Tips ($)",
        "Cash Tips ($)",
        "Total Tips ($)"
      ];
      
      const data = results.map(result => [
        result.employeeId,
        result.name,
        result.position,
        result.hours.toFixed(2),
        result.points.toFixed(2),
        result.digitalTips.toFixed(2),
        result.cashTips.toFixed(2),
        (result.digitalTips + result.cashTips).toFixed(2)
      ]);
      
      exportToCSV(headers, data, filename);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export shift: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle delete shift
  const handleDeleteShift = (shiftId) => {
    setSelectedShift(shifts.find(s => s.id === shiftId));
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedShift) {
      deleteMutation.mutate(selectedShift.id);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Shift History</h2>
        <Select
          value={timeFilter}
          onValueChange={setTimeFilter}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Shifts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Digital Tips</TableHead>
                  <TableHead>Cash Tips</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-4">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {shifts.length === 0
                        ? "No shift history available. Complete and save your first shift."
                        : "No shifts match the selected time filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.date}</TableCell>
                      <TableCell>{shift.type}</TableCell>
                      <TableCell>
                        {shift.employeeCount || 0}
                      </TableCell>
                      <TableCell>${(shift.creditCardTips + shift.houseTips).toFixed(2)}</TableCell>
                      <TableCell>${shift.cashTips.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleViewShift(shift.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setLocation(`/edit-shift/${shift.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => handleExportShift(shift.id)}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleDeleteShift(shift.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shift
              and all associated tip distributions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;
