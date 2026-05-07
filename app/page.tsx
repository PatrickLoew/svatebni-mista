import Hero from "@/components/home/Hero"
import FeaturedVenues from "@/components/home/FeaturedVenues"
import Process from "@/components/home/Process"
import MidCTA from "@/components/home/MidCTA"
import Catering from "@/components/home/Catering"
import Gallery from "@/components/home/Gallery"
import Testimonials from "@/components/home/Testimonials"
import ConsultationCTA from "@/components/home/ConsultationCTA"
import FAQ from "@/components/home/FAQ"

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedVenues />
      <MidCTA />
      <Process />
      <Catering />
      <Gallery />
      <Testimonials />
      <ConsultationCTA />
      <div id="faq" />
      <FAQ />
    </>
  )
}
