import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { exportToCSV } from "@/lib/utils/csvExport";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileDown, Save } from "lucide-react";

const Results = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [calculationData, setCalculationData] = useState(null);
  
  // Load calculation data from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem("tipCalculation");
    if (data) {
      setCalculationData(JSON.parse(data));
    } else {
      navigate("/new-shift");
    }
  }, [navigate]);
  
  // Save shift mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/shifts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift has been saved successfully",
      });
      navigate("/history");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save shift: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Calculate totals
  const calculateTotals = () => {
    if (!calculationData) return { digitalTips: 0, cashTips: 0 };
    
    return {
      digitalTips: parseFloat(calculationData.shift.creditCardTips || 0) + 
                  parseFloat(calculationData.shift.houseTips || 0),
      cashTips: parseFloat(calculationData.shift.cashTips || 0)
    };
  };
  
  // Validate tip distribution
  const validateDistribution = () => {
    if (!calculationData) return { digital: true, cash: true };
    
    const totals = calculateTotals();
    const distributedDigital = calculationData.results.reduce(
      (sum, result) => sum + result.digitalTips, 0
    );
    const distributedCash = calculationData.results.reduce(
      (sum, result) => sum + result.cashTips, 0
    );
    
    return {
      digital: Math.abs(totals.digitalTips - distributedDigital) < 0.02,
      cash: Math.abs(totals.cashTips - distributedCash) < 0.02
    };
  };
  
  // Export to CSV
  const handleExportCSV = () => {
    if (!calculationData) return;
    
    const { shift, results } = calculationData;
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
  };
  
  // Save shift
  const handleSaveShift = () => {
    if (!calculationData) return;
    
    saveMutation.mutate(calculationData);
  };
  
  if (!calculationData) {
    return (
      <div className="h-full flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const { shift, results } = calculationData;
  const totals = calculateTotals();
  const validation = validateDistribution();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Tip Distribution Results</h2>
        <div className="flex space-x-3">
          <Button onClick={handleExportCSV} variant="default">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={handleSaveShift} 
            variant="outline"
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Shift"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Shift Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Card className="bg-muted">
              <CardContent className="pt-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">Date & Shift</p>
                <p className="mt-1 text-xl font-semibold">
                  {shift.date} - {shift.type}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="pt-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Digital Tips</p>
                <p className="mt-1 text-xl font-semibold">
                  ${totals.digitalTips.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="pt-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Cash Tips</p>
                <p className="mt-1 text-xl font-semibold">
                  ${totals.cashTips.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tip Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Digital Tips</TableHead>
                  <TableHead>Cash Tips</TableHead>
                  <TableHead>Total Tips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell>{result.employeeId}</TableCell>
                    <TableCell>{result.position}</TableCell>
                    <TableCell>{result.hours.toFixed(2)}</TableCell>
                    <TableCell>{result.points.toFixed(2)}</TableCell>
                    <TableCell>${result.digitalTips.toFixed(2)}</TableCell>
                    <TableCell>${result.cashTips.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-secondary-foreground">
                      ${(result.digitalTips + result.cashTips).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card className="bg-muted">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">Digital Tips Validation</p>
                  {validation.digital ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Matches
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Discrepancy
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Total:</p>
                    <p className="text-lg font-medium">${totals.digitalTips.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distributed Total:</p>
                    <p className="text-lg font-medium">
                      ${results.reduce((sum, r) => sum + r.digitalTips, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">Cash Tips Validation</p>
                  {validation.cash ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Matches
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Discrepancy
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Total:</p>
                    <p className="text-lg font-medium">${totals.cashTips.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distributed Total:</p>
                    <p className="text-lg font-medium">
                      ${results.reduce((sum, r) => sum + r.cashTips, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
