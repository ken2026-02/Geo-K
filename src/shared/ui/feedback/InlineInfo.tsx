import type { PropsWithChildren } from "react";

interface InlineInfoProps extends PropsWithChildren {
  title?: string;
  align?: "left" | "right";
}

export function InlineInfo({ title = "More info", align = "left", children }: InlineInfoProps) {
  return (
    <details className="relative text-sm">
      <summary className="flex h-6 w-6 list-none cursor-pointer items-center justify-center rounded-full border border-indigo-200 bg-white text-[11px] font-extrabold text-indigo-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-details-marker]:hidden">
        !
      </summary>
      <div className={`absolute top-8 z-20 w-[min(18rem,calc(100vw-3rem))] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}>
        <strong className="block text-slate-800">{title}</strong>
        <div className="mt-1.5">{children}</div>
      </div>
    </details>
  );
}
