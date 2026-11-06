"use client";

export function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-zinc-400 text-xs font-medium">{label}</label>
      {children}
      {error && <p className="text-red-400 text-[11px]">{error}</p>}
    </div>
  );
}

export function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/40 transition placeholder:text-zinc-600 ${props.className ?? ""}`}
    />
  );
}

export function Select({
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/40 transition ${props.className ?? ""}`}
    />
  );
}

export function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/40 transition placeholder:text-zinc-600 resize-none ${props.className ?? ""}`}
    />
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-md transition flex items-center justify-center gap-2 cursor-pointer"
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toUpperCase();
  const styles: Record<string, { bg: string; dot: string }> = {
    COMPLETED: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    VERIFIED:  { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    PUBLISHED: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    ACTIVE:    { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    PAID:      { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    PENDING:   { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
    DRAFT:     { bg: "bg-zinc-800 text-zinc-400 border-zinc-700", dot: "bg-zinc-500" },
    CANCELLED: { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
    EXPIRED:   { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
    REJECTED:  { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
    CLOSED:    { bg: "bg-zinc-800 text-zinc-400 border-zinc-700", dot: "bg-zinc-500" },
    INACTIVE:  { bg: "bg-zinc-800 text-zinc-400 border-zinc-700", dot: "bg-zinc-500" },
  };

  const current = styles[s] ?? { bg: "bg-zinc-800 text-zinc-400 border-zinc-700", dot: "bg-zinc-500" };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${current.bg}`}>
      <span className={`w-1 h-1 rounded-full ${current.dot}`} />
      {status}
    </span>
  );
}
