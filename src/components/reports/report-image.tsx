/** Renders a report photo from the private storage bucket via a signed URL. */
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getImageUrl } from "@/lib/reports";
import { cn } from "@/lib/utils";

interface ReportImageProps {
  path: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ReportImage({ path, alt, className, fallbackClassName }: ReportImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl(null);
    if (!path) return;
    void getImageUrl(path).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName ?? className,
        )}
        aria-label="No photo provided"
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;

  return <img src={url} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
