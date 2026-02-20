import { motion } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";
import { useRef } from "react";
import { faqData } from "@/data/dummy-data";
import Title from "./Title";

export default function Faq() {
  const refs = useRef<(HTMLDetailsElement | null)[]>([]);
  return (
    <section className="py-20 2xl:py-32" id="faq">
      <div className="max-w-3xl mx-auto px-4">
        <Title
          description="Everything you need to know about working with our agency. If you have more questions, feel free to reach out."
          heading="Frequently asked questions"
          title="FAQ"
        />

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <motion.details
              className="group bg-white/6 rounded-xl select-none"
              initial={{ y: 100, opacity: 0 }}
              key={i}
              onAnimationComplete={() => {
                const card = refs.current[i];
                if (card) {
                  card.classList.add("transition", "duration-300");
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
              <summary className="flex items-center justify-between p-4 cursor-pointer">
                <h4 className="font-medium">{faq.question}</h4>
                <ChevronDownIcon className="w-5 h-5 text-gray-300 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="p-4 pt-0 text-sm text-gray-300 leading-relaxed">
                {faq.answer}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
