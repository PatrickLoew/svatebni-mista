"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { MapPin, Users, ArrowUpRight } from "lucide-react"
import type { Venue } from "@/lib/types"
import { formatPrice } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// Fallback content (shows if Supabase isn't configured yet)
const fallback: Venue[] = [
  {
    id: "f1", slug: "zamek-hluboka", title: "Zámek Hluboká nad Vltavou",
    description: "Romantický novogotický zámek s pohádkovou atmosférou.",
    location: "Hluboká nad Vltavou", region: "Jihočeský", type: "Zámek",
    capacity: 200, priceFrom: 150000,
    services: [], images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=85"],
    features: [], isFeatured: true, createdAt: "",
  },
  {
    id: "f2", slug: "vinny-sklep-morava", title: "Vinný sklep Mikulov",
    description: "Autentický moravský vinný sklep s jedinečnou atmosférou.",
    location: "Mikulov", region: "Jihomoravský", type: "Vinný sklep",
    capacity: 80, priceFrom: 60000,
    services: [], images: ["https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=85"],
    features: [], isFeatured: true, createdAt: "",
  },
  {
    id: "f3", slug: "hotel-ambassador-praha", title: "Hotel Ambassador Praha",
    description: "Luxusní historický hotel v samém srdci Prahy.",
    location: "Praha 1", region: "Praha", type: "Hotel",
    capacity: 300, priceFrom: 200000,
    services: [], images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85"],
    features: [], isFeatured: true, createdAt: "",
  },
]

export default function FeaturedVenues() {
  const [venues, setVenues] = useState<Venue[]>(fallback)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("venues")
          .select("*")
          .eq("is_featured", true)
          .limit(3)
          .order("created_at", { ascending: false })
        if (data && data.length > 0) {
          setVenues(data.map((v) => ({
            ...v, priceFrom: v.price_from, isFeatured: v.is_featured, createdAt: v.created_at,
          })))
        }
      } catch {}
    }
    load()
  }, [])

  return (
    <section id="featured" className="py-32 px-6 bg-gradient-to-b from-[#FEFDFB] to-[#F9F6F0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[#C9A96E]" />
              <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">VIP výběr</span>
            </div>
            <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] max-w-2xl">
              Místa, která <em className="text-[#3E2723]">vyrážejí dech</em>
            </h2>
            <p className="text-charcoal/60 mt-3 max-w-xl leading-relaxed font-light">
              Pečlivě vybraná prémiová místa, která zahrnujeme do našich doporučení.
            </p>
          </div>
          <Link
            href="/venues"
            className="hidden md:inline-flex items-center gap-2 text-[#3E2723] font-medium hover:text-[#C9A96E] transition-colors group"
          >
            Všech 22 VIP míst
            <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {venues.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Link href={`/venues/${v.slug}`} className="block">
                <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg">
                  <Image
                    src={v.images[0]}
                    alt={v.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-5 left-5 flex gap-2">
                    {v.isFeatured && (
                      <span className="bg-gradient-to-r from-[#A88240] via-[#C9A96E] to-[#E8C98A] text-white text-[10px] font-bold tracking-[.15em] uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.4 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
                        Doporučujeme
                      </span>
                    )}
                    <span className="backdrop-blur-md bg-white/15 border border-white/20 text-white text-[10px] font-medium tracking-[.2em] uppercase px-3 py-1.5 rounded-full">
                      {v.type}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-7 text-white">
                    <h3 className="font-serif text-2xl md:text-3xl font-light mb-2 leading-tight">
                      {v.title}
                    </h3>
                    <div className="flex items-center gap-1 text-white/80 text-sm mb-5 font-light">
                      <MapPin size={13} />
                      <span>{v.location}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/20 pt-4">
                      <div className="flex items-center gap-1.5 text-white/80 text-xs">
                        <Users size={13} />
                        <span>do {v.capacity} hostů</span>
                      </div>
                      <div className="text-[#E8C98A] text-sm font-medium">
                        od {formatPrice(v.priceFrom)}
                      </div>
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-5 right-5 w-10 h-10 rounded-full backdrop-blur-md bg-white/15 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden text-center mt-10">
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 text-[#3E2723] font-medium hover:text-[#C9A96E] transition-colors"
          >
            Zobrazit všechna místa <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
