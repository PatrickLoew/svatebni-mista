"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

const photos = [
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85", caption: "Zámecký obřad, Hluboká" },
  { src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85", caption: "Letní svatba v zahradě" },
  { src: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85", caption: "Slavnostní tabule" },
  { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85", caption: "Detail květinové výzdoby" },
  { src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85", caption: "Romantická chvíle" },
  { src: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=85", caption: "Vinný sklep, Mikulov" },
  { src: "https://images.unsplash.com/photo-1525772764200-be829a350797?w=1200&q=85", caption: "Svatební dort" },
  { src: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=85", caption: "Večerní hostina" },
]

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">Galerie</span>
            <span className="h-px w-10 bg-[#C9A96E]" />
          </div>
          <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-5">
            Okamžiky, které <em className="text-[#3E2723]">trvají věčně</em>
          </h2>
          <p className="text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
            Pohled do svateb, které jsme měli tu čest spoluvytvářet.
          </p>
        </div>

        {/* Masonry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[220px]">
          {photos.map((p, i) => {
            const span = [
              "row-span-2",
              "row-span-1",
              "row-span-2",
              "row-span-1",
              "row-span-1",
              "row-span-2",
              "row-span-1",
              "row-span-2",
            ][i % 8]
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setOpen(i)}
                className={`relative overflow-hidden rounded-2xl group ${span}`}
              >
                <Image
                  src={p.src}
                  alt={p.caption}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                  <p className="text-white text-sm font-light italic">{p.caption}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {open !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
              className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 cursor-pointer"
            >
              <button
                onClick={() => setOpen(null)}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
                aria-label="Zavřít"
              >
                <X size={28} />
              </button>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={photos[open].src}
                  alt={photos[open].caption}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
                <p className="absolute bottom-[-2rem] left-0 right-0 text-center text-white/70 text-sm italic font-light">
                  {photos[open].caption}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
