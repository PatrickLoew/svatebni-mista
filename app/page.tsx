import Hero from "@/components/home/Hero"
import FeaturedVenues from "@/components/home/FeaturedVenues"
import Process from "@/components/home/Process"
import MidCTA from "@/components/home/MidCTA"
import Catering from "@/components/home/Catering"
import Gallery from "@/components/home/Gallery"
import Testimonials from "@/components/home/Testimonials"
import ConsultationCTA from "@/components/home/ConsultationCTA"
import FAQ from "@/components/home/FAQ"
import { getSettings } from "@/lib/settings"

// Načti site_settings z DB při každém requestu — žádné cachování,
// admin změny se okamžitě promítnou
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const settings = await getSettings()

  return (
    <>
      <Hero settings={settings} />
      <Testimonials />
      <FeaturedVenues />
      <MidCTA settings={settings} />
      <Process settings={settings} />
      <Catering />
      <Gallery settings={settings} />
      <ConsultationCTA settings={settings} />
      <div id="faq" />
      <FAQ settings={settings} />
    </>
  )
}
