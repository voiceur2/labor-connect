import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateLaborer } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Navigation, MapPin } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be valid"),
  location: z.string().min(2, "Location is required"),
  workType: z.string().min(2, "Work type is required (e.g. Mason, Loader)"),
  bio: z.string().optional(),
  dailyRate: z.coerce.number().optional().or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createLaborer = useCreateLaborer();
  const [isLocating, setIsLocating] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      location: "",
      workType: "",
      bio: "",
      dailyRate: "",
      lat: undefined,
      lng: undefined,
    },
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser does not support GPS detection.", variant: "destructive" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("lat", pos.coords.latitude);
        form.setValue("lng", pos.coords.longitude);
        setGpsDetected(true);
        setIsLocating(false);
        toast({ title: "Location detected", description: "Your GPS coordinates have been saved. Hirers nearby can now find you." });
      },
      () => {
        setIsLocating(false);
        toast({ title: "Location denied", description: "Please allow location access and try again.", variant: "destructive" });
      }
    );
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createLaborer.mutate({
      data: {
        ...values,
        dailyRate: typeof values.dailyRate === "number" ? values.dailyRate : undefined,
        lat: values.lat,
        lng: values.lng,
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: "Profile Created",
          description: "You are now listed on Labor Connect.",
        });
        setLocation(`/laborer/${data.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not create profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-border">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2 text-primary">
            <Hammer className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Register as a Laborer</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Get found by hirers instantly. Enter your details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-register-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+91 99999 99999" {...field} data-testid="input-register-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Neighborhood *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Andheri, Mumbai" {...field} data-testid="input-register-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Skill *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mason, Loader, Painter" {...field} data-testid="input-register-worktype" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* GPS Location Detection */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">GPS Location</p>
                    <p className="text-xs text-muted-foreground">
                      {gpsDetected
                        ? "Location saved — hirers near you can find you easily."
                        : "Allow hirers to find you using 'Near Me' search."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={gpsDetected ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="gap-2 shrink-0"
                    data-testid="btn-detect-location"
                  >
                    {gpsDetected ? (
                      <>
                        <MapPin className="w-4 h-4 text-green-500" />
                        Location Saved
                      </>
                    ) : (
                      <>
                        <Navigation className={`w-4 h-4 ${isLocating ? "animate-pulse" : ""}`} />
                        {isLocating ? "Detecting..." : "Detect My Location"}
                      </>
                    )}
                  </Button>
                </div>
                {gpsDetected && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    GPS coordinates captured successfully
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500" {...field} data-testid="input-register-rate" />
                    </FormControl>
                    <FormDescription>Optional. Let hirers know your expected daily rate in Indian Rupees.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You / Experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell hirers about your experience, tools you own, or specific skills..."
                        className="resize-none h-24"
                        {...field}
                        data-testid="input-register-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full text-lg h-12 font-bold"
                disabled={createLaborer.isPending}
                data-testid="btn-register-submit"
              >
                {createLaborer.isPending ? "Creating Profile..." : "Complete Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
