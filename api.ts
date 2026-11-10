import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export type Choice = "agree" | "disagree";
export type VoteRow = { user_id: string; initiative: string; choice: Choice };
export type PostedRow = { id: string; category: string; title: string; body: string; created_at: string };

/** Residents are signed in anonymously, so no account is needed to vote or report. */
export async function currentUserId(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.user) throw error ?? new Error("Sign-in failed");
  return created.user.id;
}

/** Loads a table now and again whenever it changes. Returns an unsubscribe function. */
function watch<T>(table: string, load: () => Promise<T>, onData: (d: T) => void, onError: () => void) {
  if (!supabase) { onError(); return () => {}; }
  let alive = true;
  const refresh = () => load().then((d) => alive && onData(d)).catch(() => alive && onError());
  refresh();
  const channel = supabase
    .channel(`watch-${table}-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, refresh)
    .subscribe();
  return () => { alive = false; supabase!.removeChannel(channel); };
}

export function subscribeVotes(onData: (rows: VoteRow[]) => void, onError: () => void) {
  return watch("votes", async () => {
    const { data, error } = await supabase!.from("votes").select("user_id,initiative,choice");
    if (error) throw error;
    return data as VoteRow[];
  }, onData, onError);
}

export async function castVote(initiative: string, choice: Choice) {
  const user_id = await currentUserId();
  const { error } = await supabase!.from("votes").upsert({ user_id, initiative, choice }, { onConflict: "user_id,initiative" });
  if (error) throw error;
}

export async function submitReport(r: { type: string; location: string; phone: string; description: string }) {
  const user_id = await currentUserId();
  const code = "BRG-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const { error } = await supabase!.from("reports").insert({ user_id, code, type: r.type, location: r.location, phone: r.phone || null, description: r.description });
  if (error) throw error;
  return code;
}

export function subscribePosted(onData: (rows: PostedRow[]) => void) {
  return watch("announcements", async () => {
    const { data, error } = await supabase!.from("announcements").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as PostedRow[];
  }, onData, () => {});
}
