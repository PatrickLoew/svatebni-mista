import VenueForm from "@/components/admin/VenueForm"

export default function NewVenuePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Přidat nové místo</h1>
        <p className="text-charcoal/60 text-sm">Vyplňte informace o novém svatebním místě</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8DDD0] p-8">
        <VenueForm />
      </div>
    </div>
  )
}
