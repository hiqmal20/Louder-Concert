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
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
    </div>
  );
}

export function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors placeholder:text-zinc-600 ${props.className ?? ""}`}
    />
  );
}

export function Select({
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors ${props.className ?? ""}`}
    />
  );
}

export function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors placeholder:text-zinc-600 resize-none ${props.className ?? ""}`}
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
      className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PENDING:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
    ACTIVE:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    INACTIVE:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    PAID:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles[status?.toUpperCase()] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>
      {status}
    </span>
  );
}
