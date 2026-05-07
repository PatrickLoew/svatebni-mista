"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

const faqs = [
  {
    q: "Jak brzy bychom měli začít s plánováním svatby?",
    a: "Pro prémiová místa doporučujeme začít plánovat 12–18 měsíců předem, zejména pokud máte vyhlédnutý konkrétní termín mezi květnem a zářím. U menších svateb si vystačíte s 6–9 měsíci. Bezplatnou konzultaci doporučujeme co nejdříve — pomůžeme vám zorientovat se v možnostech.",
  },
  {
    q: "Co všechno váš tým zařizuje?",
    a: "Zajišťujeme komplexní servis: výběr a rezervaci místa, catering, dekorace, fotografa a kameramana, hudbu a DJ, ubytování, dopravu, koordinaci v den D, květinovou výzdobu i svatební dort. Vy jen řeknete vizi — my postavíme tým, který ji zrealizuje.",
  },
  {
    q: "Kolik svatba u vás stojí?",
    a: "Záleží na velikosti, místě a rozsahu služeb. Menší intimní svatba pro 30 hostů začíná okolo 250 000 Kč, prémiová zámecká svatba pro 100 hostů se pohybuje od 800 000 Kč. Po konzultaci dostanete transparentní rozpočet bez skrytých poplatků.",
  },
  {
    q: "Pracujete po celé České republice?",
    a: "Ano. Naše portfolio míst pokrývá všech 14 krajů. Sídlíme v Praze, ale pravidelně organizujeme svatby na Moravě, v jižních Čechách i v horských letoviscích. Pro mezinárodní svatby spolupracujeme s partnery v Rakousku a Itálii.",
  },
  {
    q: "Co se stane, když nám místo nesedne po prohlídce?",
    a: "Žádný problém. V první fázi vám představíme 3–5 míst odpovídajících vašim představám. Doprovodíme vás na osobní prohlídky a teprve po vašem souhlasu pokračujeme s rezervací. Nikdy nic netlačíme.",
  },
  {
    q: "Jaký je první krok?",
    a: "Nezávazná konzultace — buď u nás v ateliéru v Praze, nebo online přes Zoom. Probereme vaši vizi, představíme přístup a do týdne vám pošleme první návrhy míst a hrubý rozpočet. Konzultace je vždy zdarma.",
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
            Odpovědi na to, co <em className="text-[#1F3A2C]">vás zajímá</em>
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
                  <span className="font-serif text-lg md:text-xl font-medium text-charcoal group-hover:text-[#1F3A2C] transition-colors">
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
