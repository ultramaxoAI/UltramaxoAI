"use client";
import { motion } from "framer-motion";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "./Buttons";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/#" },
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <motion.nav
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-5 left-0 right-0 z-50 px-4"
      initial={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-3">
        <a href="/#">
          <img alt="logo" className="h-8" src="/logo.svg" />
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          {navLinks.map((link) => (
            <a
              className="hover:text-white transition"
              href={link.href}
              key={link.name}
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden">
            Sign in
          </button>
          <PrimaryButton className="max-sm:text-xs hidden sm:inline-block">
            Get Started
          </PrimaryButton>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <MenuIcon className="size-6" />
        </button>
      </div>
      <div
        className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {navLinks.map((link) => (
          <a href={link.href} key={link.name} onClick={() => setIsOpen(false)}>
            {link.name}
          </a>
        ))}

        <button
          className="font-medium text-gray-300 hover:text-white transition"
          onClick={() => setIsOpen(false)}
        >
          Sign in
        </button>
        <PrimaryButton onClick={() => setIsOpen(false)}>
          Get Started
        </PrimaryButton>

        <button
          className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
          onClick={() => setIsOpen(false)}
        >
          <XIcon />
        </button>
      </div>
    </motion.nav>
  );
}
