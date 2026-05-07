import Hero from "@/components/home/Hero"
import ExpertiseProof from "@/components/home/ExpertiseProof"
import Process from "@/components/home/Process"
import AboutService from "@/components/home/AboutService"
import FeaturedVenues from "@/components/home/FeaturedVenues"
import Testimonials from "@/components/home/Testimonials"
import ConsultationCTA from "@/components/home/ConsultationCTA"
import FAQ from "@/components/home/FAQ"

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExpertiseProof />
      <Process />
      <div id="o-sluzbe" />
      <AboutService />
      <FeaturedVenues />
      <Testimonials />
      <ConsultationCTA />
      <div id="faq" />
      <FAQ />
    </>
  )
}
