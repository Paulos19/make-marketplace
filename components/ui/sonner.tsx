"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-full flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-xl text-sm font-medium transition-all",
          title: "font-semibold text-[13px] leading-tight",
          description: "text-xs opacity-80 mt-0.5",
          actionButton:
            "ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
          cancelButton:
            "ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          closeButton:
            "absolute top-2 right-2 rounded-md p-0.5 opacity-50 hover:opacity-100 transition-opacity",

          // ─── Per-type styles ───
          success:
            "bg-emerald-950/80 border-emerald-500/30 text-emerald-100 [&_svg]:text-emerald-400",
          error:
            "bg-rose-950/80 border-rose-500/30 text-rose-100 [&_svg]:text-rose-400",
          warning:
            "bg-amber-950/80 border-amber-500/30 text-amber-100 [&_svg]:text-amber-400",
          info: "bg-sky-950/80 border-sky-500/30 text-sky-100 [&_svg]:text-sky-400",
          loading:
            "bg-violet-950/80 border-violet-500/30 text-violet-100 [&_svg]:text-violet-400",
          default:
            "bg-slate-900/90 border-white/10 text-white/90 [&_svg]:text-purple-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
