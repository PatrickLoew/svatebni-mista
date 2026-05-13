"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

const faqs = [
  {
    q: "Co znamená Svatební místo na míru?",
    a: "Sami provozujeme svatební místa, takže přesně víme, jak fungují, na co se ptát a co je v praxi důležité. Místo abyste hodiny prohledávali katalogy, vyplníte krátkou analýzu a my vám doporučíme pět míst, která sednou přesně k vaší vizi a rozpočtu.",
  },
  {
    q: "Plánujete nebo koordinujete svatby?",
    a: "Ne — to není naše služba. My pomáháme najít to správné svatební místo. Samotné plánování (catering, dekorace, koordinace v den D) si pak buď řeší majitel daného místa, nebo si můžete najmout svatebního koordinátora.",
  },
  {
    q: "Jak brzy bychom měli začít hledat místo?",
    a: "Pro prémiová místa v hlavní sezóně (květen–září) doporučujeme začít hledat 12–18 měsíců předem. Mimo sezónu nebo ve všedních dnech si vystačíte s 6–9 měsíci. Naše analýza vám okamžitě ukáže, která místa mají volné termíny.",
  },
  {
    q: "Kolik analýza stojí?",
    a: "Analýza i následný návrh míst je pro vás zcela zdarma. Naši partneři (svatební místa) nám platí provizi pouze v případě, že si u nich rezervujete termín — vy nic neplatíte. Žádné skryté poplatky.",
  },
  {
    q: "Pracujete po celé České republice?",
    a: "Ano. Naše databáze obsahuje místa ve všech 14 krajích, plus partnerská místa na Slovensku. Pro každý kraj máme prověřené partnery, se kterými dlouhodobě spolupracujeme.",
  },
  {
    q: "Jaký je první krok?",
    a: "Vyplňte naši krátkou analýzu — 6 otázek, 5 minut. Do 24 hodin vám e-mailem pošleme pět míst, která se nejvíc hodí k vaší vizi. Dále si můžete domluvit individuální konzultaci pro hlubší probrání.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-32 px-6 bg-[#F9F2E6]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">Časté otázky</span>
            <span className="h-px w-10 bg-[#C9A96E]" />
          </div>
          <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-5">
            Odpovědi na to, co <em className="text-[#3E2723]">vás zajímá</em>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD0]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-7 py-5 flex items-center justify-between gap-6 text-left group"
                >
                  <span className="font-serif text-lg md:text-xl font-medium text-charcoal group-hover:text-[#3E2723] transition-colors">
                    {f.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-[#F9F6F0] flex items-center justify-center text-[#C9A96E]"
                  >
                    <Plus size={16} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-7 pb-6 text-charcoal/70 leading-relaxed font-light">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
