import Link from "next/link";

export function Nav({ current }: { current: "finder" | "map" }) {
  const link = (key: string, href: string, label: string) => {
    const active = key === current;
    return (
      <Link
        href={href}
        className={
          active
            ? "rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white"
            : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        }
      >
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
      <Link href="/" className="mr-4 text-lg font-bold tracking-tight text-slate-900">
        Gas Match
      </Link>
      {link("finder", "/", "Station Finder")}
      {link("map", "/map", "State Map")}
    </nav>
  );
}
