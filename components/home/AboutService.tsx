"use client"

import { motion } from "framer-motion"

export default function AboutService() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 bg-[#1F1310] text-white relative overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#C9A96E]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-7"
        >
          O službě
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-14 max-w-4xl"
        >
          Nechtěli jsme vytvořit další katalog bez konkrétních informací.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-7 md:p-8"
          >
            <h3 className="font-serif text-xl md:text-2xl font-light text-white mb-5">
              Proč jsme zvolili tuto cestu
            </h3>
            <p className="text-white/70 text-sm md:text-base leading-relaxed font-light">
              Klasické katalogy často ukážou hezké fotografie, ale neřeknou to hlavní.
              Jaké jsou podmínky místa, jaká omezení mohou být důležitá, kolik stojí pronájem
              a jestli místo opravdu odpovídá tomu, co pár hledá.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#3E2723] to-[#2C1810] border border-[#C9A96E]/20 rounded-2xl p-7 md:p-8"
          >
            <h3 className="font-serif text-xl md:text-2xl font-light text-white mb-5">
              Co chceme párům předat
            </h3>
            <p className="text-white/85 text-sm md:text-base leading-relaxed font-light">
              Naším cílem je dodávat svatební místa s konkrétními podmínkami, orientačními
              cenami a jasnějším pohledem na to, co na místě opravdu funguje. Díky tomu pár
              šetří čas a vybírá z míst, která mají skutečný smysl pro jejich svatbu.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
