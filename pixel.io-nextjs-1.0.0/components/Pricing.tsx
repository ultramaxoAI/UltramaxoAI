import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRef } from "react";
import { plansData } from "@/data/dummy-data";
import { GhostButton, PrimaryButton } from "./Buttons";
import Title from "./Title";

export default function Pricing() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <section className="py-20 bg-white/3 border-t border-white/6" id="pricing">
      <div className="max-w-6xl mx-auto px-4">
        <Title
          description="Flexible agency packages designed to fit startups, growing teams and established brands."
          heading="Simple, transparent pricing"
          title="Pricing"
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plansData.map((plan, i) => (
            <motion.div
              className={`relative p-6 rounded-xl border backdrop-blur ${
                plan.popular
                  ? "border-indigo-500/50 bg-indigo-900/30"
                  : "border-white/8 bg-indigo-950/30"
              }`}
              initial={{ y: 150, opacity: 0 }}
              key={i}
              onAnimationComplete={() => {
                const card = refs.current[i];
                if (card) {
                  card.classList.add(
                    "transition",
                    "duration-500",
                    "hover:scale-102"
                  );
                }
              }}
              ref={(el) => {
                refs.current[i] = el;
              }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.1 + i * 0.1,
              }}
              viewport={{ once: true }}
              whileInView={{ y: 0, opacity: 1 }}
            >
              {plan.popular && (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-md text-xs">
                  Most popular
                </p>
              )}

              <div className="mb-6">
                <p>{plan.name}</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-gray-400">
                    / {plan.credits}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feat, i) => (
                  <li
                    className="flex items-center gap-3 text-sm text-gray-300"
                    key={i}
                  >
                    <Check className="w-4 h-4 text-indigo-400" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div>
                {plan.popular ? (
                  <PrimaryButton className="w-full">Get started</PrimaryButton>
                ) : (
                  <GhostButton className="w-full justify-center">
                    Get started
                  </GhostButton>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
