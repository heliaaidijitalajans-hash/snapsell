import { useEffect, useState } from "react";

export default function PricingPage() {
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number | string; credits?: number; description?: string }>>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">${typeof plan.price === "number" ? plan.price : plan.price}</p>
            {plan.credits != null && <p className="mt-2 text-gray-600">{plan.credits} credits</p>}
            {plan.description != null && <p className="mt-2 text-gray-600">{plan.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
