import Hero from "@/components/home/Hero"
import ExpertiseProof from "@/components/home/ExpertiseProof"
import Process from "@/components/home/Process"
import AboutService from "@/components/home/AboutService"
import MainCtaForm from "@/components/home/MainCtaForm"
import FeaturedVenues from "@/components/home/FeaturedVenues"
import FAQ from "@/components/home/FAQ"

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExpertiseProof />
      <Process />
      <div id="o-sluzbe" />
      <AboutService />
      <MainCtaForm />
      <FeaturedVenues />
      <div id="faq" />
      <FAQ />
    </>
  )
}
