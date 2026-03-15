import { notFound } from "next/navigation";
import { getSharedDocumentById } from "@/lib/db/queries";

export default async function SharedArtifactPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const document = await getSharedDocumentById({ id });

	if (!document) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-[#f6f4ee] px-4 py-10 text-[#171717] dark:bg-[#0c0f11] dark:text-[#f4f4f1] sm:px-6 lg:px-8">
			<div className="mx-auto max-w-5xl rounded-[28px] border border-black/8 bg-white/85 p-6 shadow-[0_24px_80px_rgba(17,19,21,0.08)] backdrop-blur dark:border-white/8 dark:bg-white/5 dark:shadow-none sm:p-8">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
					Shared artifact
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
					{document.title}
				</h1>
				<p className="mt-2 text-sm text-[#5f6258] dark:text-[#a6aca6]">
					Type: {document.kind}
				</p>
				<div className="mt-8 overflow-hidden rounded-[24px] border border-black/8 bg-[#f7f3ea] dark:border-white/8 dark:bg-[#14181c]">
					{document.kind === "image" && document.content ? (
						// biome-ignore lint/performance/noImgElement: shared artifact image preview
						<img
							alt={document.title}
							className="max-h-[75vh] w-full object-contain"
							src={document.content}
						/>
					) : (
						<pre className="overflow-x-auto whitespace-pre-wrap p-5 text-sm leading-7">
							{document.content || "No content available."}
						</pre>
					)}
				</div>
			</div>
		</div>
	);
}
