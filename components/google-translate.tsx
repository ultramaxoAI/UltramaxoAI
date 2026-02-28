"use client";
import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

export function GoogleTranslate() {
	const [currentLang, setCurrentLang] = useState("EN");
    const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (document.getElementById("google-translate-script")) {
            setIsLoaded(true);
            return;
        }

		const addScript = document.createElement("script");
		addScript.id = "google-translate-script";
		addScript.src =
			"//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
		addScript.async = true;
		document.body.appendChild(addScript);

		// @ts-ignore
		(window as any).googleTranslateElementInit = () => {
			// @ts-ignore
			new (window as any).google.translate.TranslateElement(
				{
					pageLanguage: "en",
					includedLanguages: "en,id",
					autoDisplay: false,
				},
				"google_translate_element"
			);
            
            // Allow a small delay for widget rendering
            setTimeout(() => {
                setIsLoaded(true);
            }, 1000);
		};
	}, []);

	const toggleLanguage = () => {
		const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
		if (!select) return;

		const targetLang = currentLang === "EN" ? "id" : "en";
		
		// Use bubbles: true so Google's event listener actually catches it
		select.value = targetLang;
		select.dispatchEvent(new Event("change", { bubbles: true }));
        
        // As a fallback to clear translations if reverting to native EN fails:
        if (targetLang === "en") {
            const iframe = document.querySelector('iframe.goog-te-banner-frame') as HTMLIFrameElement;
            if (iframe) {
               const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
               const restoreBtn = innerDoc?.getElementById("restore") as HTMLButtonElement | null;
               if (restoreBtn) restoreBtn.click();
            }
            
            // Clear standard cookies Google translate uses to enforce session
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
        }

		setCurrentLang(targetLang === "id" ? "ID" : "EN");
	};

	return (
		<div className="flex items-center gap-2 mr-2">
			{/* Hidden native widget */}
			<div 
				id="google_translate_element" 
				style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}
			/>

			{/* Custom Button */}
			<button
				onClick={toggleLanguage}
				disabled={!isLoaded}
				className="flex items-center gap-1.5 bg-black/4 dark:bg-white/4 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 transition-colors text-sm font-medium text-foreground disabled:opacity-50"
			>
				<Languages className="w-4 h-4 text-muted-foreground" />
				{currentLang === "EN" ? "Translate to ID" : "Kembali ke EN"}
			</button>
		</div>
	);
}
