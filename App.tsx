import { FormEvent, ReactNode, useEffect, useState } from "react";
import { castVote, currentUserId, subscribePosted, subscribeVotes, submitReport, type Choice, type PostedRow, type VoteRow } from "./api";

type IconName =
  | "bell"
  | "building"
  | "calendar"
  | "check"
  | "chevron"
  | "clipboard"
  | "clock"
  | "home"
  | "logout"
  | "mail"
  | "map"
  | "megaphone"
  | "menu"
  | "phone"
  | "plus"
  | "search"
  | "send"
  | "shield"
  | "thumbsDown"
  | "thumbsUp"
  | "user"
  | "users"
  | "vote"
  | "x";

const paths: Record<IconName, ReactNode> = {
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  building: <><path d="M3 21h18"/><path d="M6 21V7l6-4 6 4v14"/><path d="M9 10h1M14 10h1M9 14h1M14 14h1M9 18h6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
  megaphone: <><path d="m3 11 17-7v13L3 13z"/><path d="m11 16 1 4H7l-1-6M20 9v3"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
  thumbsDown: <><path d="M17 14V3H6L2 12v2h6l-1 5 2 2 5-7Z"/><path d="M17 3h4v11h-4"/></>,
  thumbsUp: <><path d="M7 10v11h11l4-9v-2h-6l1-5-2-2-5 7Z"/><path d="M7 21H3V10h4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  vote: <><path d="m9 11 3 3 7-7"/><path d="M20 12v8H4V4h11M2 20h20"/></>,
  x: <path d="m6 6 12 12M18 6 6 18"/>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "announcements", label: "Announcements", icon: "megaphone" },
  { id: "checks", label: "Constituency checks", icon: "clipboard" },
  { id: "report", label: "Report an issue", icon: "map" },
  { id: "voting", label: "Voting", icon: "vote" },
  { id: "officials", label: "Barangay officials", icon: "users" },
];

type Page = "home" | "announcements" | "checks" | "report" | "voting" | "officials";

type Announcement = {
  category: string;
  title: string;
  copy: string;
  date: string;
  time: string;
  icon: IconName;
  image: string;
  featured?: boolean;
};

const announcements: Announcement[] = [
  { category: "Public Works", title: "Road improvement along Mabini Street begins Monday", copy: "The first phase of road resurfacing will begin on June 17. One lane will remain open and traffic marshals will be on site.", date: "June 12, 2025", time: "3 min read", icon: "map", featured: true, image: "https://images.unsplash.com/photo-1772852325224-f3caade1a5b5?auto=format&fit=crop&w=900&q=80" },
  { category: "Health", title: "Free community health screening", copy: "Residents are invited to a free health screening at the barangay hall this Saturday from 8:00 AM to 3:00 PM.", date: "June 10, 2025", time: "2 min read", icon: "shield", image: "https://images.unsplash.com/photo-1583313821496-023a14d64af6?auto=format&fit=crop&w=900&q=80" },
  { category: "Community", title: "Monthly clean-up drive", copy: "Join your neighbors for our monthly clean-up drive. Gloves, sacks, and refreshments will be provided.", date: "June 8, 2025", time: "2 min read", icon: "users", image: "https://images.unsplash.com/photo-1650871424238-e2352dad1fff?auto=format&fit=crop&w=900&q=80" },
];

function SectionHeader({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy: string }) {
  return <div className="mb-7">
    {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>}
    <div className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{title}</div>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{copy}</p>
  </div>;
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return <article className={`group overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-lg ${item.featured ? "border-blue-200 shadow-md shadow-blue-100/50" : "border-slate-200 shadow-sm"}`}>
    <div className="relative h-36 overflow-hidden bg-blue-100">
      {item.image && <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={item.image} alt="" />}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">{item.category}</span>
      <div className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg"><Icon name={item.icon} /></div>
    </div>
    <div className="p-5">
    <div className="text-lg font-bold leading-snug text-slate-900">{item.title}</div>
    <p className="mt-3 text-sm leading-6 text-slate-500">{item.copy}</p>
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <span className="flex items-center gap-1.5 text-xs text-slate-400"><Icon name="calendar" className="size-4" />{item.date}</span>
      <button className="flex items-center gap-1 text-sm font-bold text-blue-700 transition group-hover:gap-2" type="button">Read more <Icon name="chevron" className="size-4" /></button>
    </div>
    </div>
  </article>;
}

function usePosted() {
  const [posted, setPosted] = useState<PostedRow[]>([]);
  useEffect(() => subscribePosted(setPosted), []);
  return posted;
}
const postedToCard = (p: PostedRow): Announcement => ({ category: p.category, title: p.title, copy: p.body, date: new Date(p.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }), time: "", icon: "megaphone", image: "" });

function Home({ setPage }: { setPage: (page: Page) => void }) {
  const posted = usePosted();
  return <>
    <section className="relative overflow-hidden rounded-3xl bg-blue-700 text-white shadow-xl shadow-blue-200">
      <div className="absolute -right-16 -top-20 size-72 rounded-full border-[45px] border-blue-600 opacity-70" />
      <div className="grid min-h-80 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="relative z-10 p-7 md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur"><span className="size-2 rounded-full bg-emerald-300" /> Barangay services are online</span>
        <div className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">Good morning, Maria.</div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 md:text-base">Welcome to VOXA, your direct line to Barangay 463. Stay informed, share your voice, and help shape our community.</p>
        <button onClick={() => setPage("announcements")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50" type="button">View latest updates <Icon name="chevron" className="size-4" /></button>
      </div>
      <div className="relative hidden min-h-80 overflow-hidden lg:block">
        <img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1588827054907-d478fcd961e6?auto=format&fit=crop&w=1000&q=85" alt="Residents walking together in their neighborhood" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-700/25 to-transparent" />
        <div className="absolute bottom-5 right-5 rounded-xl bg-white/90 px-4 py-3 text-slate-900 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-bold"><Icon name="users" className="size-4 text-blue-700" /> One connected community</div>
        </div>
      </div>
      </div>
    </section>

    <div className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Quick access</p><div className="mt-1 text-xl font-bold text-slate-900">How can we help?</div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { page: "checks" as Page, icon: "clipboard" as IconName, title: "Share your opinion", copy: "Answer this week’s community check", color: "bg-sky-50 text-sky-700" },
          { page: "report" as Page, icon: "map" as IconName, title: "Report an issue", copy: "Tell us about a local concern", color: "bg-amber-50 text-amber-700" },
          { page: "voting" as Page, icon: "vote" as IconName, title: "Cast your vote", copy: "2 initiatives are open for voting", color: "bg-violet-50 text-violet-700" },
          { page: "officials" as Page, icon: "users" as IconName, title: "Contact officials", copy: "Find the right person to help", color: "bg-emerald-50 text-emerald-700" },
        ].map((item) => <button key={item.page} onClick={() => setPage(item.page)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" type="button">
          <span className={`flex size-11 items-center justify-center rounded-xl ${item.color}`}><Icon name={item.icon} /></span>
          <span className="mt-4 block font-bold text-slate-900">{item.title}</span>
          <span className="mt-1 block text-sm leading-5 text-slate-500">{item.copy}</span>
          <span className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700">Get started <Icon name="chevron" className="size-3.5 transition group-hover:translate-x-0.5" /></span>
        </button>)}
      </div>
    </div>

    <div className="mt-9">
      <div className="mb-4 flex items-center justify-between"><div className="text-xl font-bold text-slate-900">Latest announcements</div><button onClick={() => setPage("announcements")} className="text-sm font-bold text-blue-700" type="button">View all</button></div>
      <div className="grid gap-5 lg:grid-cols-3">{[...posted.map(postedToCard), ...announcements].slice(0, 3).map((item) => <AnnouncementCard item={item} key={item.title + item.date} />)}</div>
    </div>
  </>;
}

function Announcements() {
  const posted = usePosted();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const all: Announcement[] = posted.map(postedToCard).concat(announcements).concat([{ category: "Public Safety", title: "Typhoon preparedness advisory", copy: "Review the evacuation routes and emergency contacts available to all residents during severe weather.", date: "June 5, 2025", time: "3 min read", icon: "shield", image: "https://images.unsplash.com/photo-1730514784114-45dd255ea593?auto=format&fit=crop&w=900&q=80" }]);
  return <>
    <SectionHeader eyebrow="Stay informed" title="Announcements" copy="Official updates, initiatives, public advisories, and project reports from your barangay." />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-400 shadow-sm"><Icon name="search" className="size-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search announcements" /></label>
      <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm" type="button">All categories</button>
    </div>
    <div className="grid gap-5 lg:grid-cols-3">{all.filter((i) => !q || (i.title + " " + i.copy + " " + i.category).toLowerCase().includes(q)).map((item) => <AnnouncementCard item={item} key={item.title + item.date} />)}</div>
  </>;
}

function Checks() {
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  return <>
    <SectionHeader eyebrow="Your voice matters" title="Constituency check" copy="Share how you feel about our community. Responses are anonymous and help officials make more informed decisions." />
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {submitted ? <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" className="size-8" /></span>
          <div className="mt-5 text-xl font-bold text-slate-900">Thank you for sharing</div>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Your response has been recorded. Community results will be shared after this check closes.</p>
        </div> : <>
          <div className="flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Weekly check-in</span><span className="text-xs font-medium text-slate-400">1 of 1</span></div>
          <div className="mt-7 text-xl font-bold leading-snug text-slate-900">How satisfied are you with the cleanliness and waste collection services in our barangay?</div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {["Very poor", "Poor", "Fair", "Good", "Excellent"].map((label, index) => <button key={label} onClick={() => setAnswer(index)} className={`rounded-xl border p-4 text-center transition ${answer === index ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100" : "border-slate-200 text-slate-500 hover:border-blue-300"}`} type="button">
              <span className="block text-lg font-bold">{index + 1}</span><span className="mt-1 block text-xs font-semibold">{label}</span>
            </button>)}
          </div>
          <textarea className="mt-6 min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white" placeholder="Tell us more about your experience (optional)" />
          <button disabled={answer === null} onClick={() => setSubmitted(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40" type="button">Submit response <Icon name="send" className="size-4" /></button>
        </>}
      </section>
      <aside className="rounded-2xl bg-slate-900 p-6 text-white">
        <Icon name="shield" className="size-7 text-blue-300" />
        <div className="mt-5 font-bold">Private and secure</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">Your individual response is never shared publicly. Results are presented only as community totals.</p>
        <div className="mt-7 border-t border-slate-700 pt-5"><div className="text-3xl font-bold">428</div><p className="mt-1 text-xs text-slate-400">residents responded this week</p></div>
      </aside>
    </div>
  </>;
}

function Report() {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setSaving(true);
    setErr("");
    try {
      const ticket = await submitReport({ type: String(fd.get("type") || ""), location: String(fd.get("location") || ""), phone: String(fd.get("phone") || ""), description: String(fd.get("description") || "") });
      setCode(ticket);
      setSent(true);
    } catch {
      setErr("Your report couldn’t be sent. Please check your connection and try again.");
    } finally { setSaving(false); }
  }
  return <>
    <SectionHeader eyebrow="Community care" title="Report an issue" copy="Let us know about a concern in your area. Provide the details below and we’ll route it to the right team." />
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {sent ? <div className="flex min-h-96 flex-col items-center justify-center text-center"><span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Icon name="check" className="size-8" /></span><div className="mt-5 text-xl font-bold text-slate-900">Report submitted</div><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Your tracking number is <strong className="text-slate-800">{code}</strong>. We’ll send updates to your registered contact.</p></div> : <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Issue type<select name="type" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-normal text-slate-700 outline-none focus:border-blue-400"><option value="">Select a category</option><option>Road and sidewalk</option><option>Waste collection</option><option>Street lighting</option><option>Public safety</option><option>Other</option></select></label>
            <label className="text-sm font-bold text-slate-700">Location<input name="location" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-normal outline-none placeholder:text-slate-400 focus:border-blue-400" placeholder="Street or nearby landmark" /></label>
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-700">Contact number <span className="font-normal text-slate-400">(optional)</span><div className="relative mt-2"><span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="phone" className="size-4" /></span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+\s\(\)\-]{7,18}" title="Enter a valid phone number, e.g. 0917 123 4567" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 pl-10 font-normal outline-none placeholder:text-slate-400 focus:border-blue-400" placeholder="e.g. 0917 123 4567" /></div><span className="mt-1.5 block text-xs font-normal text-slate-400">Barangay staff will only use this to follow up on your report if more details are needed.</span></label>
          <label className="mt-5 block text-sm font-bold text-slate-700">Describe the issue<textarea name="description" required className="mt-2 min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-normal outline-none placeholder:text-slate-400 focus:border-blue-400" placeholder="What happened? Include details that can help us respond." /></label>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500 transition hover:border-blue-300 hover:text-blue-700"><Icon name="plus" /> Add a photo <input className="hidden" type="file" accept="image/*" /></label>
          {err && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
          <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60" type="submit">{saving ? "Sending…" : "Submit report"} <Icon name="send" className="size-4" /></button>
        </>}
      </form>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><Icon name="clock" className="text-blue-700" /><div className="mt-4 font-bold text-slate-900">What happens next?</div><p className="mt-2 text-sm leading-6 text-slate-600">We review reports within 24 hours and send status updates as your issue is assigned and resolved.</p></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><div className="font-bold text-slate-900">Is this an emergency?</div><p className="mt-2 text-sm leading-6 text-slate-600">For urgent police, fire, or medical assistance, call <strong>911</strong> immediately.</p></div>
      </aside>
    </div>
  </>;
}

const initiatives = [
  { id: "park", title: "Community pocket park on Rizal Street", copy: "Convert the vacant municipal lot into a shaded green space with seating, play equipment, and native plants.", closes: "Closes June 21" },
  { id: "market", title: "Expanded weekend market hours", copy: "Extend the public market’s Saturday and Sunday operating hours from 6:00 AM–2:00 PM to 6:00 AM–6:00 PM.", closes: "Closes June 24" },
];

function Voting() {
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [rows, setRows] = useState<VoteRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    currentUserId().then((id) => !dead && setMyId(id)).catch(() => !dead && setStatus("unavailable"));
    const unsub = subscribeVotes((r) => { if (!dead) { setRows(r); setStatus("ready"); } }, () => { if (!dead) setStatus("unavailable"); });
    return () => { dead = true; unsub(); };
  }, []);

  async function cast(initId: string, choice: Choice) {
    if (!myId || busy) return;
    setBusy(initId);
    setError("");
    try {
      await castVote(initId, choice);
      setRows((prev) => [...prev.filter((r) => !(r.user_id === myId && r.initiative === initId)), { user_id: myId, initiative: initId, choice }]);
    } catch {
      setError("Your vote couldn’t be saved. Please check your connection and try again.");
    } finally { setBusy(null); }
  }

  return <>
    <SectionHeader eyebrow="Participate" title="Community voting" copy="Review current proposals and let officials know whether you agree or disagree with each initiative. One vote per resident, per initiative." />
    {status === "unavailable" && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Voting is unavailable right now. Please check your connection and reload the page.</div>}
    {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    <div className="space-y-5">{initiatives.map((item) => {
      const mine = rows.find((r) => r.user_id === myId && r.initiative === item.id);
      const choice = mine?.choice;
      const agree = rows.filter((r) => r.initiative === item.id && r.choice === "agree").length;
      const disagree = rows.filter((r) => r.initiative === item.id && r.choice === "disagree").length;
      const total = agree + disagree;
      const agreePct = total ? Math.round((agree / total) * 100) : 0;
      const disabled = status !== "ready" || !myId || busy === item.id;
      return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Open for voting</span><span className="flex items-center gap-1 text-xs text-slate-400"><Icon name="clock" className="size-3.5" />{item.closes}</span></div><div className="mt-4 text-xl font-bold text-slate-900">{item.title}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{item.copy}</p></div>
          <div className="flex min-w-64 gap-3">
            <button disabled={disabled} onClick={() => cast(item.id, "agree")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${choice === "agree" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300"}`} type="button"><Icon name="thumbsUp" className="size-4" /> Agree</button>
            <button disabled={disabled} onClick={() => cast(item.id, "disagree")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${choice === "disagree" ? "border-slate-700 bg-slate-700 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`} type="button"><Icon name="thumbsDown" className="size-4" /> Disagree</button>
          </div>
        </div>
        {status === "loading" && <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-400">Connecting to live results…</p>}
        {status === "ready" && !choice && <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-400">Cast your vote to see the live results.</p>}
        {status === "ready" && choice && <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500"><span className="flex items-center gap-2"><span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>Live vote count</span><span>{total} {total === 1 ? "vote" : "votes"}</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-4"><div className="text-3xl font-bold text-blue-700">{agree}</div><div className="mt-1 text-xs font-bold text-blue-700/80">Agree · {agreePct}%</div></div>
            <div className="rounded-xl bg-slate-100 p-4"><div className="text-3xl font-bold text-slate-700">{disagree}</div><div className="mt-1 text-xs font-bold text-slate-600">Disagree · {total ? 100 - agreePct : 0}%</div></div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${agreePct}%` }} /></div>
          <p className="mt-3 text-xs text-emerald-600">Your vote ({choice}) has been recorded. You can change it anytime while voting is open.</p>
        </div>}
      </article>;
    })}</div>
  </>;
}

function Officials() {
  const officials = [
    { name: "Hon. Roberto D. Santos", role: "Barangay Captain", phone: "(02) 8123 4500", email: "captain@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1600896997793-b8ed3459a17f?auto=format&fit=crop&w=300&q=80" },
    { name: "Hon. Elena M. Cruz", role: "Kagawad — Health & Sanitation", phone: "(02) 8123 4501", email: "elena.cruz@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1570984429335-39f89baffcca?auto=format&fit=crop&w=300&q=80" },
    { name: "Hon. Daniel B. Reyes", role: "Kagawad — Peace & Order", phone: "(02) 8123 4502", email: "daniel.reyes@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1596747786123-80992f2aa3f6?auto=format&fit=crop&w=300&q=80" },
    { name: "Hon. Sofia L. Mendoza", role: "Kagawad — Education", phone: "(02) 8123 4503", email: "sofia.mendoza@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1631253205777-9f792356b1f4?auto=format&fit=crop&w=300&q=80" },
    { name: "Hon. Marco T. Lim", role: "SK Chairperson", phone: "(02) 8123 4504", email: "sk@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1518725522904-4b3939358342?auto=format&fit=crop&w=300&q=80" },
    { name: "Ana P. Villanueva", role: "Barangay Secretary", phone: "(02) 8123 4505", email: "secretary@barangay463.gov.ph", image: "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?auto=format&fit=crop&w=300&q=80" },
  ];
  return <>
    <SectionHeader eyebrow="Here to serve" title="Barangay officials" copy="Get to know your local officials and find the right contact for your questions or concerns." />
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{officials.map((person, index) => <article key={person.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4"><div className={`size-16 shrink-0 overflow-hidden rounded-2xl ring-4 ${index === 0 ? "ring-blue-100" : "ring-slate-100"}`}><img className="h-full w-full object-cover" src={person.image} alt={`Portrait of ${person.name}`} /></div><div><div className="font-bold text-slate-900">{person.name}</div><p className="mt-1 text-xs font-semibold text-blue-600">{person.role}</p></div></div>
      <div className="mt-5 space-y-3 border-t border-slate-100 pt-5"><div className="flex items-center gap-3 text-sm text-slate-500"><Icon name="phone" className="size-4 text-slate-400" />{person.phone}</div><div className="flex items-center gap-3 truncate text-sm text-slate-500"><Icon name="mail" className="size-4 shrink-0 text-slate-400" />{person.email}</div></div>
    </article>)}</div>
  </>;
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const content: Record<Page, ReactNode> = { home: <Home setPage={setPage} />, announcements: <Announcements />, checks: <Checks />, report: <Report />, voting: <Voting />, officials: <Officials /> };
  const currentLabel = navItems.find((item) => item.id === page)?.label;

  function navigate(next: Page) { setPage(next); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    {!accepted && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon name="shield" className="size-7" /></span>
        <div id="terms-title" className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Terms &amp; Conditions</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">You must accept the terms in order to access VOXA and its community services.</p>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          <li className="flex gap-2"><Icon name="check" className="mt-1 size-4 shrink-0 text-blue-700" />Information you submit will be used only for barangay services and community decisions.</li>
          <li className="flex gap-2"><Icon name="check" className="mt-1 size-4 shrink-0 text-blue-700" />Constituency check responses are anonymous and shown only as community totals.</li>
          <li className="flex gap-2"><Icon name="check" className="mt-1 size-4 shrink-0 text-blue-700" />You agree to provide accurate reports and to treat other residents and officials respectfully.</li>
        </ul>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-blue-700" />I have read and accept the Terms &amp; Conditions and Privacy Policy.</label>
        <button disabled={!agreed} onClick={() => setAccepted(true)} className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50" type="button">Accept and continue</button>
        <p className="mt-3 text-center text-xs text-slate-400">Access to the site is not available unless you accept.</p>
      </div>
    </div>}
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" type="button" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-blue-900 bg-blue-950 text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950"><Icon name="building" /></span><div><div className="text-base font-extrabold tracking-wide">VOXA</div><p className="text-xs text-blue-300">Barangay 463</p></div></div>
        <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="text-blue-200 lg:hidden" type="button"><Icon name="x" /></button>
      </div>
      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">Community services</p>
        <div className="space-y-1">{navItems.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${page === item.id ? "bg-blue-600 text-white shadow-md shadow-blue-950/30" : "text-blue-100 hover:bg-white/10 hover:text-white"}`} type="button"><Icon name={item.icon} className="size-5" />{item.label}</button>)}</div>
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="flex size-9 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-900">MD</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">Maria Dela Cruz</div><p className="text-xs text-blue-300">Verified resident</p></div><Icon name="logout" className="size-4 text-blue-300" /></div>
      </div>
    </aside>

    <div className="lg:pl-72">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-4"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden" type="button"><Icon name="menu" /></button><div><p className="text-xs font-medium text-slate-400">Resident portal</p><div className="font-bold text-slate-900">{currentLabel}</div></div></div>
        <div className="flex items-center gap-3"><button aria-label="Notifications" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-blue-700" type="button"><Icon name="bell" className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-blue-600 ring-2 ring-white" /></button><div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex"><span className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">MD</span><div><div className="text-xs font-bold">Maria Dela Cruz</div><p className="text-[10px] text-emerald-600">Verified resident</p></div></div></div>
      </header>
      <main className="mx-auto max-w-7xl p-5 md:p-8 lg:p-10">{content[page]}</main>
      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-slate-200 px-5 py-6 text-xs text-slate-400 sm:flex-row md:px-8 lg:px-10"><span>© 2025 VOXA: Barangay 463. Serving our community together.</span><span>Emergency hotline: 911 · Barangay desk: (02) 8123 4500</span></footer>
    </div>
  </div>;
}
