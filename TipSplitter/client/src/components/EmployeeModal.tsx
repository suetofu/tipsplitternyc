import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRestaurantStore } from "@/lib/hooks/useRestaurantStore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee, Position } from "@shared/schema";

// Zod schema for employee form
const employeeSchema = z.object({
  employeeId: z.coerce.number().int().positive("Employee ID must be a positive integer"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  positions: z.array(z.string()).min(1, "At least one position is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  open: boolean;
  onClose: (updated: boolean) => void;
  employee: Employee | null;
}

const EmployeeModal = ({ open, onClose, employee }: EmployeeModalProps) => {
  const { toast } = useToast();
  const { positions } = useRestaurantStore();
  
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: 0,
      firstName: "",
      lastName: "",
      positions: [],
    },
  });
  
  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        positions: employee.positions as string[],
      });
    } else {
      form.reset({
        employeeId: 0,
        firstName: "",
        lastName: "",
        positions: [],
      });
    }
  }, [employee, form]);
  
  // Add employee mutation
  const addMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      return apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      onClose(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add employee: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EmployeeFormData & { id: number }) => {
      return apiRequest("PUT", `/api/employees/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      onClose(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update employee: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: EmployeeFormData) => {
    if (employee) {
      updateMutation.mutate({ ...data, id: employee.id });
    } else {
      addMutation.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="First name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              type="number"
              {...form.register("employeeId")}
              placeholder="Employee ID"
            />
            {form.formState.errors.employeeId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.employeeId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Positions</Label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map((position: Position) => (
                <div key={position.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`position-${position.id}`}
                    checked={form.watch("positions")?.includes(position.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        form.setValue("positions", [
                          ...(form.watch("positions") || []),
                          position.name,
                        ]);
                      } else {
                        form.setValue(
                          "positions",
                          form.watch("positions")?.filter((p) => p !== position.name) || []
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`position-${position.id}`} className="text-sm">
                    {position.name}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.positions && (
              <p className="text-sm text-destructive">
                {form.formState.errors.positions.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeModal;
