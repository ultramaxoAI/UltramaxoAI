import { motion } from "framer-motion";
import { useRef } from "react";
import { featuresData } from "@/data/dummy-data";
import Title from "./Title";

export default function Features() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <section className="py-20 2xl:py-32" id="features">
      <div className="max-w-6xl mx-auto px-4">
        <Title
          description="From strategy to execution, we help businesses build strong digital products and meaningful customer experiences."
          heading="Everything your brand needs to grow"
          title="Services"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuresData.map((feature, i) => (
            <motion.div
              className="rounded-2xl p-6 bg-white/3 border border-white/6"
              initial={{ y: 100, opacity: 0 }}
              key={i}
              onAnimationComplete={() => {
                const card = refs.current[i];
                if (card) {
                  card.classList.add(
                    "transition",
                    "duration-300",
                    "hover:border-white/15",
                    "hover:-translate-y-1"
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
              <div className="w-12 h-12 rounded-lg bg-violet-900/20 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
