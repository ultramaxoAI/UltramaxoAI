export type ArtifactCodeFile = {
	name: string;
	content: string;
};

const FILE_MARKER_REGEX =
	/(?:\/\/|#|<!--)\s*(?:file:|filename:)?\s*([^\s\n]+\.[a-z0-9]+)/gi;

function normalizeFileName(name: string) {
	return name.replace(/^\/+/, "").trim();
}

function detectDefaultFileName(content: string) {
	if (/<html|<!DOCTYPE/i.test(content)) {
		return "index.html";
	}

	if (
		content.includes("export default function App") ||
		content.includes("useState(") ||
		content.includes("className=")
	) {
		return content.includes(": React") || content.includes("interface ")
			? "App.tsx"
			: "App.js";
	}

	if (content.includes("console.log") || content.includes("function ")) {
		return "index.js";
	}

	return "code.txt";
}

function extractHtmlFiles(html: string): ArtifactCodeFile[] {
	const files: ArtifactCodeFile[] = [];
	const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
	const styleMatches = Array.from(html.matchAll(styleRegex));
	let extractedCSS = "";

	if (styleMatches.length > 0) {
		extractedCSS = styleMatches.map((match) => match[1].trim()).join("\n\n");
		html = html.replace(styleRegex, "");
	}

	const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
	const scriptMatches = Array.from(html.matchAll(scriptRegex));
	let extractedJS = "";

	if (scriptMatches.length > 0) {
		extractedJS = scriptMatches
			.map((match) => match[1].trim())
			.filter((js) => js && !js.includes("src="))
			.join("\n\n");
		html = html.replace(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi, "");
	}

	if (extractedCSS) {
		html = html.replace(
			"</head>",
			'    <link rel="stylesheet" href="style.css">\n</head>',
		);
	}

	if (extractedJS) {
		html = html.replace(
			"</body>",
			'    <script src="script.js"></script>\n</body>',
		);
	}

	files.push({ name: "index.html", content: html.trim() });

	if (extractedCSS) {
		files.push({ name: "style.css", content: extractedCSS });
	}

	if (extractedJS) {
		files.push({ name: "script.js", content: extractedJS });
	}

	return files;
}

export function parseArtifactCodeFiles(content: string): ArtifactCodeFile[] {
	if (!content.trim()) {
		return [];
	}

	const matches = Array.from(content.matchAll(FILE_MARKER_REGEX));

	if (matches.length === 0) {
		if (/<html|<!DOCTYPE/i.test(content)) {
			return extractHtmlFiles(content);
		}

		return [
			{
				name: detectDefaultFileName(content),
				content: content.trim(),
			},
		];
	}

	return matches.map((match, index) => {
		const fileName = normalizeFileName(match[1] ?? "file.txt");
		const startIndex = (match.index ?? 0) + match[0].length;
		const endIndex = index < matches.length - 1 ? (matches[index + 1].index ?? content.length) : content.length;

		return {
			name: fileName,
			content: content.substring(startIndex, endIndex).trim(),
		};
	});
}

export function serializeArtifactCodeFiles(files: ArtifactCodeFile[]) {
	return files
		.map((file) => `// file: ${normalizeFileName(file.name)}\n${file.content.trim()}\n`)
		.join("\n");
}

export function upsertArtifactCodeFile(
	files: ArtifactCodeFile[],
	name: string,
	content: string,
) {
	const normalizedName = normalizeFileName(name);
	const existingIndex = files.findIndex(
		(file) => normalizeFileName(file.name) === normalizedName,
	);

	if (existingIndex >= 0) {
		const updatedFiles = [...files];
		updatedFiles[existingIndex] = { name: normalizedName, content };
		return updatedFiles;
	}

	return [...files, { name: normalizedName, content }];
}

export function deleteArtifactCodeFile(files: ArtifactCodeFile[], name: string) {
	const normalizedName = normalizeFileName(name);
	return files.filter((file) => normalizeFileName(file.name) !== normalizedName);
}