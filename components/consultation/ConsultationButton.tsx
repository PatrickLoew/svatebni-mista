"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import ConsultationModal from "./ConsultationModal"

type Variant = "primary" | "secondary" | "ghost" | "ghost-light"
type Size = "sm" | "md" | "lg"

interface Props {
  label?: string
  variant?: Variant
  size?: Size
  className?: string
  source?: string
  showIcon?: boolean
}

const variants: Record<Variant, string> = {
  primary:    "bg-[#C9A96E] text-white hover:bg-[#A88240]",
  secondary:  "bg-[#1F3A2C] text-white hover:bg-[#0F1F18]",
  ghost:      "bg-white/80 backdrop-blur-md border border-[#E8DDD0] text-charcoal hover:bg-white",
  "ghost-light": "border border-white/40 backdrop-blur-md bg-white/5 text-white hover:bg-white/15",
}

const sizes: Record<Size, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3 text-sm",
  lg: "px-9 py-4 text-base",
}

export default function ConsultationButton({
  label = "Domluvit konzultaci",
  variant = "primary",
  size = "md",
  className = "",
  source = "homepage",
  showIcon = true,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${variants[variant]} ${sizes[size]} font-medium rounded-full transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2 ${className}`}
      >
        {showIcon && <Calendar size={size === "lg" ? 18 : 15} />}
        {label}
      </button>
      <ConsultationModal open={open} onClose={() => setOpen(false)} source={source} />
    </>
  )
}
