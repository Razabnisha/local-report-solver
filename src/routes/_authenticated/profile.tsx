/** Profile page: update display name and avatar URL. */
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Local Report Hub" },
      { name: "description", content: "Update your display name and profile picture." },
      { property: "og:title", content: "My profile — Local Report Hub" },
      { property: "og:description", content: "Update your display name and profile picture." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatar(profile?.avatar ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({
          full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
          avatar: z.string().trim().url("Avatar must be a valid URL").max(500).or(z.literal("")),
        })
        .safeParse({ full_name: fullName, avatar });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name, avatar: parsed.data.avatar || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">My profile</h1>
        <p className="mt-2 text-muted-foreground">This is the name shown on your reports and comments.</p>

        <form
          className="surface-card mt-8 space-y-6 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              {avatar && <AvatarImage src={avatar} alt="Your profile picture" />}
              <AvatarFallback className="bg-secondary text-lg font-semibold text-secondary-foreground">
                {(fullName || user?.email || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.email ?? user?.email}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator" : "Community member"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar image URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </div>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
