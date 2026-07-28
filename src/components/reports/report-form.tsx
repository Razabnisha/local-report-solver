/**
 * Create / edit form for a report.
 * Handles client-side validation (zod), image preview before upload,
 * and an optional coordinate picker using the browser's geolocation API.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Crosshair, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";
import { getImageUrl, uploadReportImage } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Report } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(6, "Give your report a clear title (min 6 characters)").max(120),
  description: z.string().trim().min(20, "Describe the issue in at least 20 characters").max(3000),
  category: z.string().min(1, "Pick a category"),
  priority: z.enum(["low", "medium", "high"]),
  location: z.string().trim().min(3, "Where is it? Add a street, area or landmark").max(200),
});

export function ReportForm({ report }: { report?: Report }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(report?.title ?? "");
  const [description, setDescription] = useState(report?.description ?? "");
  const [category, setCategory] = useState(report?.category ?? "");
  const [priority, setPriority] = useState(report?.priority ?? "medium");
  const [status, setStatus] = useState(report?.status ?? "pending");
  const [location, setLocation] = useState(report?.location ?? "");
  const [latitude, setLatitude] = useState<string>(report?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState<string>(report?.longitude?.toString() ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Show the already-saved image when editing.
  useEffect(() => {
    if (report?.image_url) void getImageUrl(report.image_url).then(setPreview);
  }, [report?.image_url]);

  function handleFile(selected: File | null) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (selected.size > 5 * 1024 * 1024) return toast.error("Images must be smaller than 5 MB");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation is not available in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Coordinates captured");
      },
      () => {
        setLocating(false);
        toast.error("Could not read your location");
      },
    );
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in");
      const parsed = schema.safeParse({ title, description, category, priority, location });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      let imagePath = report?.image_url ?? null;
      if (file) imagePath = await uploadReportImage(file, user.id);

      const payload = {
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        priority: parsed.data.priority,
        location: parsed.data.location,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        image_url: imagePath,
      };

      if (report) {
        const { error } = await supabase
          .from("reports")
          .update(isAdmin ? { ...payload, status } : payload)
          .eq("id", report.id);
        if (error) throw error;
        return report.id;
      }

      const { data, error } = await supabase
        .from("reports")
        .insert({ ...payload, user_id: user.id, status: "pending" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success(report ? "Report updated" : "Report submitted — thank you!");
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["report", id] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      navigate({ to: "/reports/$reportId", params: { reportId: id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="surface-card space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Report title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Deep pothole outside the market gate"
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="What is wrong, how long has it been there, and who does it affect?"
            maxLength={3000}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Street, area or landmark"
            maxLength={200}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input id="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input id="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="button" variant="secondary" onClick={useMyLocation} disabled={locating}>
            {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
            Use my location
          </Button>
        </div>

        {latitude && longitude && (
          <iframe
            title="Map preview of the reported location"
            className="h-56 w-full rounded-xl border border-border"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.004}%2C${Number(latitude) - 0.003}%2C${Number(longitude) + 0.004}%2C${Number(latitude) + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`}
          />
        )}
      </div>

      <aside className="space-y-6">
        <div className="surface-card space-y-4 p-6">
          <Label>Photo</Label>
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={preview} alt="Selected report photo preview" className="h-44 w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              Upload a photo (max 5 MB)
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {isAdmin && report && (
          <div className="surface-card space-y-3 p-6">
            <Label>Status (admin)</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="surface-card space-y-3 p-6 text-sm text-muted-foreground">
          <p>
            New reports start as <strong className="text-foreground">Pending</strong> and are dated
            automatically. You can edit or delete your own reports at any time.
          </p>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {report ? "Save changes" : "Submit report"}
          </Button>
        </div>
      </aside>
    </form>
  );
}
