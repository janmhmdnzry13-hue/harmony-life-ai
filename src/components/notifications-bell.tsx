import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";

export function NotificationsBell() {
  const listFn = useServerFn(listNotifications);
  const readFn = useServerFn(markNotificationRead);
  const readAllFn = useServerFn(markAllNotificationsRead);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listFn(),
    refetchInterval: 60_000,
  });

  const unread = (notifs.data ?? []).filter((n) => !n.read_at).length;

  const markOne = useMutation({
    mutationFn: (id: string) => readFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => readAllFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="size-9 border border-ink/20 flex items-center justify-center text-ink/70 hover:border-ink hover:text-ink relative"
      >
        <Bell className="size-4" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 size-4 bg-accent text-accent-foreground text-[9px] font-medium flex items-center justify-center rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[92vw] bg-paper border border-ink/15">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {(notifs.data ?? []).length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-ink/50">
                Nothing new. A quiet inbox.
              </div>
            ) : (
              (notifs.data ?? []).map((n) => {
                const body = (
                  <div className={`px-4 py-3 border-b border-ink/5 last:border-b-0 ${!n.read_at ? "bg-surface" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read_at && <div className="size-1.5 bg-accent rounded-full mt-1.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink font-medium truncate">{n.title}</div>
                        {n.body && <div className="text-xs text-ink/60 mt-0.5 line-clamp-2">{n.body}</div>}
                        <div className="text-[10px] uppercase tracking-widest text-ink/40 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.read_at) markOne.mutate(n.id);
                    }}
                    className="cursor-pointer"
                  >
                    {n.link ? (
                      <Link to={n.link as never} onClick={() => setOpen(false)}>{body}</Link>
                    ) : (
                      body
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
