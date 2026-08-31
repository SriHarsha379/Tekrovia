import { Card } from "@/components/ui/Card";

const PRODUCTS = [
  {
    name: "Technology Training",
    price: "₹9,999",
    description: "All modules, guided labs, assignments and two guided projects.",
  },
  {
    name: "Interview Preparation",
    price: "₹9,999",
    description: "Interview curriculum, AI practice, three expert mocks and resume prep.",
  },
  {
    name: "Placement Support",
    price: "₹9,999",
    description: "Job matching, verified submissions, interview coordination and feedback tracking.",
  },
  {
    name: "Corporate Soft Skills",
    price: "₹5,000",
    description: "Communication, HR rounds, workplace skills, email and presentation.",
  },
];

export function PricingTable() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PRODUCTS.map((product) => (
        <Card key={product.name} className="flex flex-col gap-3">
          <p className="font-body text-sm font-medium text-teal">{product.name}</p>
          <p className="font-display text-2xl text-ink">{product.price}</p>
          <p className="font-body text-sm text-ink/70">{product.description}</p>
        </Card>
      ))}
      <Card className="flex flex-col gap-3 border-ink bg-ink text-paper sm:col-span-2 lg:col-span-4">
        <p className="font-body text-sm font-medium text-gold">Complete Package</p>
        <p className="font-display text-2xl">₹29,999</p>
        <p className="font-body text-sm text-paper/70">
          All services — the full path from first lesson to placement support.
        </p>
      </Card>
    </div>
  );
}
