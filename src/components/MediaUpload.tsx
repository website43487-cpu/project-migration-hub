import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadMedia } from "@/lib/media.functions";
import { MAX_MEDIA_BYTES } from "@/lib/media-policy";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
};

async function toBase64(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) {
    s += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(s);
}

/** Upload a file to the studio media store and hand back a long-lived URL. */
export function MediaUpload({ label, value, onChange, accept = "image/*,video/*" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const send = useServerFn(uploadMedia);

  const upload = async (file: File) => {
    if (file.size > MAX_MEDIA_BYTES) {
      setError("That file is larger than 45 MB — please use a smaller one.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await send({
        data: {
          name: file.name,
          contentType: file.type || "application/octet-stream",
          data: await toBase64(file),
        },
      });
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that file.");
    } finally {
      setBusy(false);
    }
  };


  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(value);

  return (
    <div className="space-y-2">
      <span className="caps opacity-55">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or upload a file"
          className="min-w-0 flex-1 border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
        />
        <input
          ref={input}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <Button variant="ghost"
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="caps link-underline disabled:opacity-40"
        >
          {busy ? "Uploading…" : "Upload"}
        </Button>
        {value && (
          <Button variant="ghost" type="button" disabled={busy} onClick={() => onChange("")} className="caps opacity-50 hover:opacity-90">
            Clear
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value &&
        (isVideo ? (
          <video src={value} muted playsInline controls preload="none" className="h-28 rounded object-cover" />
        ) : (
          <img src={value} alt="" loading="lazy" decoding="async" className="h-28 rounded object-cover" />
        ))}
    </div>
  );
}
