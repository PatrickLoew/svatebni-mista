import type { Metadata } from "next"
import { Geist, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | Svatební Místa.cz",
    default: "Svatební Místa.cz – Prémiová svatební místa & wedding planning",
  },
  description:
    "Prémiový katalog svatebních míst, catering a kompletní svatební plánování v České republice. Zámky, vinné sklepy, hotely a venkovní prostory pro váš nezapomenutelný den.",
  keywords: ["svatba", "svatební místa", "wedding planning", "svatební agentura", "zámek", "vinný sklep", "catering", "Česká republika"],
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "Svatební Místa.cz",
    title: "Svatební Místa.cz – Prémiová svatební místa & wedding planning",
    description: "Prémiový katalog svatebních míst, catering a kompletní svatební plánování v České republice.",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${geist.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F9F6F0] text-[#2C2C2C] font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
