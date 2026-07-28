/** Comments list + composer for a single report. */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { fetchComments } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";

export function CommentSection({ reportId }: { reportId: string }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", reportId],
    queryFn: () => fetchComments(reportId),
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      if (!user) throw new Error("You must be signed in to comment.");
      const { error } = await supabase
        .from("comments")
        .insert({ report_id: reportId, user_id: user.id, comment });
      if (error) throw error;
    },
    onSuccess: () => {
      setValue("");
      toast.success("Comment posted");
      void queryClient.invalidateQueries({ queryKey: ["comments", reportId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment removed");
      void queryClient.invalidateQueries({ queryKey: ["comments", reportId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="surface-card p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
        Comments {comments ? `(${comments.length})` : ""}
      </h2>

      {user ? (
        <form
          className="mb-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = value.trim();
            if (!trimmed) return toast.error("Write something first");
            if (trimmed.length > 1000) return toast.error("Comments are limited to 1000 characters");
            addComment.mutate(trimmed);
          }}
        >
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add local context, updates or confirmation..."
            rows={3}
            maxLength={1000}
          />
          <Button type="submit" size="sm" disabled={addComment.isPending}>
            {addComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post comment
          </Button>
        </form>
      ) : (
        <p className="mb-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {(c.profiles?.full_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.profiles?.full_name ?? "Resident"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  {(user?.id === c.user_id || isAdmin) && (
                    <button
                      onClick={() => removeComment.mutate(c.id)}
                      className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.comment}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet — be the first to add context.</p>
      )}
    </section>
  );
}
