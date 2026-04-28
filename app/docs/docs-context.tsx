"use client";

import { createContext, useContext } from "react";

export type Lang = "en" | "id";
export type Theme = "dark" | "light";

export const DocsContext = createContext<{
	lang: Lang;
	setLang: (l: Lang) => void;
	theme: Theme;
	setTheme: (t: Theme) => void;
}>({ lang: "en", setLang: () => {}, theme: "dark", setTheme: () => {} });

export function useDocsContext() {
	return useContext(DocsContext);
}
