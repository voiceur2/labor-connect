import { useState } from "react";
import { Link } from "wouter";
import { useListLaborers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, User, Briefcase } from "lucide-react";

export function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("");
  const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: laborers, isLoading } = useListLaborers({
    search: search || undefined,
    location: location || undefined,
    workType: workType || undefined,
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: coords ? 25 : undefined,
  }, {
    query: {
      queryKey: ["laborers", search, location, workType, coords],
    }
  });

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="text-center py-12 md:py-20 max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Find reliable hands.<br/>
          <span className="text-primary">Get the job done.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The no-nonsense marketplace for physical labor. Connect directly with bricklifters, loaders, and general workers in your area.
        </p>
      </section>

      <section className="bg-card border border-border rounded-xl p-4 shadow-sm max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9"
              data-testid="input-location"
            />
          </div>
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Work type (e.g. Loader)..."
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="pl-9"
              data-testid="input-worktype"
            />
          </div>
          <Button
            variant={coords ? "default" : "secondary"}
            onClick={handleNearMe}
            disabled={isLocating}
            className="md:w-auto w-full gap-2"
            data-testid="button-nearme"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? "animate-pulse" : ""}`} />
            {isLocating ? "Detecting..." : coords ? "Near Me (On)" : "Near Me"}
          </Button>
        </div>
        {coords && (
          <p className="text-xs text-primary mt-3 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            Showing laborers within 25 km of your location — sorted by distance
          </p>
        )}
      </section>

      <section className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : laborers?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No laborers found</h3>
            <p className="text-muted-foreground">
              {coords
                ? "No laborers found within 25 km — try clearing the Near Me filter."
                : "Try adjusting your search filters."}
            </p>
            {(search || location || workType || coords) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => { setSearch(""); setLocation(""); setWorkType(""); setCoords(null); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laborers?.map(laborer => (
              <Link key={laborer.id} href={`/laborer/${laborer.id}`}>
                <Card
                  className="hover:border-primary/50 transition-colors cursor-pointer h-full hover-elevate"
                  data-testid={`card-laborer-${laborer.id}`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{laborer.name}</h3>
                        <Badge variant="secondary" className="mt-1">{laborer.workType}</Badge>
                      </div>
                      {laborer.isAvailable ? (
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" title="Available" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted-foreground shrink-0" title="Unavailable" />
                      )}
                    </div>

                    <div className="space-y-2 mt-auto text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{laborer.location}</span>
                      </div>
                      {laborer.distanceKm != null && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Navigation className="w-3 h-3" />
                          {laborer.distanceKm.toFixed(1)} km away
                        </div>
                      )}
                      {laborer.dailyRate != null && (
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          ₹{laborer.dailyRate.toLocaleString("en-IN")} / day
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
