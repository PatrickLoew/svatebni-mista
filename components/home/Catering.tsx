"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ChefHat, Wine, Cake, Utensils, Check } from "lucide-react"

const features = [
  { icon: ChefHat, title: "Šéfkuchaři s michelin zkušeností", desc: "Pracujeme s nejlepšími šéfkuchaři, kteří přizpůsobí menu vašemu vkusu i dietním požadavkům." },
  { icon: Wine, title: "Vybraná vína z malých sklepů", desc: "Pečlivá selekce moravských a evropských vinařství, která dokonale doplní každý chod." },
  { icon: Cake, title: "Autorské svatební dorty", desc: "Originální dorty od českých cukrářek, které jsou stejně krásné jako jsou chutné." },
  { icon: Utensils, title: "Servis na úrovni hotelů★★★★★", desc: "Vyškolená obsluha, která se postará o každého hosta s maximální péčí." },
]

export default function Catering() {
  return (
    <section className="py-32 px-6 bg-[#F9F6F0] overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative h-[560px] rounded-[2rem] overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85"
              alt="Premium catering"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {/* Floating accent card */}
          <motion.div
            initial={{ opacity: 0, scale: .8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="absolute -bottom-8 -right-4 lg:-right-12 backdrop-blur-xl bg-white/90 border border-[#C9A96E]/20 rounded-2xl p-6 shadow-xl max-w-[260px]"
          >
            <div className="text-[#C9A96E] text-xs font-medium tracking-[.25em] uppercase mb-2">★★★★★</div>
            <p className="font-serif italic text-charcoal/80 text-sm leading-relaxed">
              &quot;Catering byl absolutní vrchol večera. Hosté o něm mluví dodnes.&quot;
            </p>
            <p className="text-xs text-charcoal/50 mt-3">— Kateřina &amp; Jan, červen 2025</p>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">Catering &amp; Full Service</span>
          </div>

          <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
            Gastronomie, která <em className="text-[#3E2723]">vypráví příběh</em>
          </h2>

          <p className="text-charcoal/70 leading-relaxed text-lg mb-10 font-light">
            Spolupracujeme s nejlepšími kuchařskými týmy v zemi.
            Ať už toužíte po francouzském pětichodu, autentické moravské
            tabuli, nebo lehkém zahradním brunchi — postaráme se o vše.
          </p>

          <div className="space-y-5 mb-10">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#3E2723] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A96E] transition-colors duration-300">
                  <f.icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-charcoal mb-1">{f.title}</h3>
                  <p className="text-charcoal/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <a
            href="#consultation"
            className="inline-flex items-center gap-2 text-[#C9A96E] font-medium hover:gap-3 transition-all"
          >
            Sestavíme vám menu na míru
            <Check size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
