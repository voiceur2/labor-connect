import { useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  useGetLaborer,
  useCreateConversation,
  useDeleteLaborer,
  getGetLaborerQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Phone, MessageSquare, Briefcase, User, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

export function LaborerProfile() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [hirerPhone, setHirerPhone] = useState(localStorage.getItem("hirerPhone") || "");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePhone, setDeletePhone] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const { data: laborer, isLoading, error } = useGetLaborer(id, {
    query: {
      enabled: !!id,
      queryKey: getGetLaborerQueryKey(id),
    }
  });

  const createConversation = useCreateConversation();
  const deleteLaborer = useDeleteLaborer();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !laborer) {
    return <div className="text-center py-20">Profile not found.</div>;
  }

  const handleMessage = () => {
    if (!hirerPhone) return;
    localStorage.setItem("hirerPhone", hirerPhone);
    createConversation.mutate({
      data: { laborerId: id, hirerPhone }
    }, {
      onSuccess: () => { setLocation("/messages"); }
    });
  };

  const handleDelete = () => {
    setDeleteError("");
    if (!deletePhone.trim()) {
      setDeleteError("Please enter your registered phone number.");
      return;
    }
    deleteLaborer.mutate({ id, params: { phone: deletePhone.trim() } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["laborers"] });
        toast({ title: "Registration removed", description: "Your listing has been permanently deleted." });
        setLocation("/");
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (msg?.includes("does not match")) {
          setDeleteError("That phone number does not match the registered number. Only the person who registered can remove this listing.");
        } else {
          setDeleteError("Could not delete registration. Please try again.");
        }
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="overflow-hidden border-border">
        <div className="h-32 bg-secondary/10 flex items-center justify-center border-b border-border relative">
          <div className="absolute -bottom-12 left-8 bg-background border-4 border-background rounded-full p-4 shadow-sm text-primary bg-primary/5">
            <User className="w-16 h-16" />
          </div>
        </div>

        <CardContent className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{laborer.name}</h1>
                  {laborer.isAvailable ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm">Available Now</Badge>
                  ) : (
                    <Badge variant="secondary">Currently Unavailable</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Briefcase className="w-4 h-4" />
                    {laborer.workType}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4" />
                    {laborer.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4" />
                    Joined {format(new Date(laborer.createdAt), "MMM yyyy")}
                  </span>
                </div>
              </div>

              {laborer.bio && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border mt-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-foreground/90 whitespace-pre-wrap">{laborer.bio}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-[200px] shrink-0 bg-card border border-border p-4 rounded-xl shadow-sm">
              {laborer.dailyRate != null && (
                <div className="text-center pb-4 mb-2 border-b border-border">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Expected Rate</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-primary">₹</span>
                    <span className="text-3xl font-bold text-foreground">
                      {laborer.dailyRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                </div>
              )}

              <Button asChild size="lg" className="w-full gap-2 font-bold text-base" data-testid="btn-call">
                <a href={`tel:${laborer.phone}`}>
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
              </Button>

              {/* Message dialog */}
              <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="lg" className="w-full gap-2 font-bold" data-testid="btn-message">
                    <MessageSquare className="w-5 h-5" />
                    Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Message {laborer.name}</DialogTitle>
                    <DialogDescription>
                      Enter your phone number to start a conversation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Phone Number</label>
                      <Input
                        value={hirerPhone}
                        onChange={(e) => setHirerPhone(e.target.value)}
                        placeholder="+91 99999 99999"
                        data-testid="input-hirer-phone"
                      />
                    </div>
                    <Button
                      className="w-full font-bold"
                      onClick={handleMessage}
                      disabled={!hirerPhone || createConversation.isPending}
                      data-testid="btn-start-chat"
                    >
                      {createConversation.isPending ? "Starting..." : "Start Conversation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete dialog — phone-verified */}
              <div className="border-t border-border pt-3 mt-1">
                <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                  setIsDeleteDialogOpen(open);
                  if (!open) { setDeletePhone(""); setDeleteError(""); }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid="btn-delete-registration"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove My Registration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Registration</DialogTitle>
                      <DialogDescription>
                        To confirm, enter the phone number you used when registering as <strong>{laborer.name}</strong>. This action is permanent and cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Registered Phone Number</label>
                        <Input
                          value={deletePhone}
                          onChange={(e) => { setDeletePhone(e.target.value); setDeleteError(""); }}
                          placeholder="+91 99999 99999"
                          type="tel"
                          data-testid="input-delete-phone"
                        />
                        {deleteError && (
                          <p className="text-sm text-destructive" data-testid="text-delete-error">{deleteError}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={handleDelete}
                          disabled={!deletePhone || deleteLaborer.isPending}
                          data-testid="btn-confirm-delete"
                        >
                          {deleteLaborer.isPending ? "Removing..." : "Yes, Remove"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
