import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import { RestaurantSetup, Position, ShiftType } from "@shared/schema";

const setupSchema = z.object({
  restaurant: z.object({
    name: z.string().min(1, "Restaurant name is required"),
  }),
  shiftTypes: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Shift type name is required"),
    })
  ),
  positions: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Position name is required"),
      pointValue: z.number().min(0).max(5),
    })
  ),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const Setup = () => {
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/setup"],
    staleTime: 60000, // 1 minute
  });
  
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      restaurant: {
        name: "",
      },
      shiftTypes: [],
      positions: [],
    },
  });
  
  useEffect(() => {
    if (data) {
      form.reset({
        restaurant: {
          name: data.restaurant?.name || "",
        },
        shiftTypes: data.shiftTypes || [],
        positions: data.positions || [],
      });
    }
  }, [data, form]);
  
  const saveMutation = useMutation({
    mutationFn: async (values: SetupFormValues) => {
      return apiRequest("POST", "/api/setup", values);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup"] });
      toast({
        title: "Success",
        description: "Restaurant configuration saved",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save configuration: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const addShiftType = () => {
    const currentShiftTypes = form.getValues("shiftTypes");
    form.setValue("shiftTypes", [
      ...currentShiftTypes,
      { name: "" },
    ]);
  };
  
  const removeShiftType = (index: number) => {
    const currentShiftTypes = form.getValues("shiftTypes");
    form.setValue(
      "shiftTypes",
      currentShiftTypes.filter((_, i) => i !== index)
    );
  };
  
  const addPosition = () => {
    const currentPositions = form.getValues("positions");
    form.setValue("positions", [
      ...currentPositions,
      { name: "", pointValue: 1.0 },
    ]);
  };
  
  const removePosition = (index: number) => {
    const currentPositions = form.getValues("positions");
    form.setValue(
      "positions",
      currentPositions.filter((_, i) => i !== index)
    );
  };
  
  const onSubmit = (values: SetupFormValues) => {
    saveMutation.mutate(values);
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Restaurant Configuration</h2>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save Setup"}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                placeholder="Enter restaurant name"
                {...form.register("restaurant.name")}
              />
              {form.formState.errors.restaurant?.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.restaurant.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Shift Types</Label>
              <div className="space-y-2">
                {form.watch("shiftTypes").map((shiftType, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Shift name"
                      {...form.register(`shiftTypes.${index}.name`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShiftType(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.shiftTypes && (
                  <p className="text-sm text-destructive">
                    At least one shift type is required
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addShiftType}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Shift Type
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Positions & Default Point Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Name</TableHead>
                  <TableHead>Default Point Value</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.watch("positions").map((position, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        placeholder="Position name"
                        {...form.register(`positions.${index}.name`)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="5"
                        className="w-24"
                        {...form.register(`positions.${index}.pointValue`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePosition(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {form.watch("positions").length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No positions added yet. Add your first position using the button below.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addPosition}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </CardContent>
      </Card>
      

    </div>
  );
};

export default Setup;
