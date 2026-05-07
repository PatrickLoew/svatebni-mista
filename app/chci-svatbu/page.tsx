import type { Metadata } from "next"
import Wizard from "@/components/wizard/Wizard"

export const metadata: Metadata = {
  title: "Chci svatbu na míru — bezplatný návrh do 24 hodin",
  description: "Vyplňte krátký dotazník a my vám do 24 hodin pošleme 3 nejvíce hodící se svatební místa s detailním návrhem. Zdarma a bez závazku.",
}

export default function WizardPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-[#FEFDFB] via-[#F9F6F0] to-[#F9F2E6]">
      <div className="max-w-3xl mx-auto px-6 text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="h-px w-10 bg-[#C9A96E]" />
          <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">Svatební místo na míru</span>
          <span className="h-px w-10 bg-[#C9A96E]" />
        </div>
        <h1 className="font-serif font-light text-4xl md:text-6xl leading-[1.05] mb-5">
          Vaše svatební místo,<br />
          <em className="text-[#3E2723]">přesně na míru</em>
        </h1>
        <p className="text-charcoal/60 max-w-xl mx-auto leading-relaxed">
          Odpovězte na 6 jednoduchých otázek. Naše analýza projde stovky míst
          a do 24 hodin obdržíte e-mailem <strong>3 osobní doporučení</strong> včetně
          rozpočtových rozpadů a přímých kontaktů.
        </p>
      </div>

      <Wizard />
    </div>
  )
}
