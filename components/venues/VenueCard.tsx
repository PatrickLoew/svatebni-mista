"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { MapPin, Users, Banknote } from "lucide-react"
import type { Venue } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

export default function VenueCard({ venue, index = 0 }: { venue: Venue; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="card-3d group"
    >
      <Link href={`/venues/${venue.slug}`} className="block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
          {/* Image */}
          <div className="relative h-56 overflow-hidden">
            {venue.images[0] ? (
              <Image
                src={venue.images[0]}
                alt={venue.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="w-full h-full skeleton" />
            )}
            {venue.isFeatured && (
              <span className="absolute top-3 left-3 bg-[#C9A96E] text-white text-xs font-semibold px-3 py-1 rounded-full">
                ✦ Doporučeno
              </span>
            )}
            <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full">
              {venue.type}
            </span>
          </div>

          {/* Body */}
          <div className="p-5">
            <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-[#C9A96E] transition-colors">
              {venue.title}
            </h3>
            <div className="flex items-center gap-1 text-charcoal/60 text-sm mb-3">
              <MapPin size={13} />
              <span>{venue.location}</span>
            </div>
            <p className="text-charcoal/70 text-sm leading-relaxed line-clamp-2 mb-4">
              {venue.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm border-t border-[#E8DDD0] pt-4">
              <div className="flex items-center gap-1 text-charcoal/60">
                <Users size={14} />
                <span>až {venue.capacity} hostů</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[#C9A96E]">
                <Banknote size={14} />
                <span>od {formatPrice(venue.priceFrom)}</span>
              </div>
            </div>

            <div className="mt-4 text-center bg-[#F9F6F0] hover:bg-[#C9A96E] hover:text-white transition-colors text-sm font-semibold py-2.5 rounded-xl">
              Zobrazit detail →
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
