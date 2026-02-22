"use client";

import {
	SandpackCodeEditor,
	SandpackLayout,
	SandpackPreview,
	SandpackProvider,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import { memo } from "react";
import type { SupportedLanguage } from "./code-editor";

type PlayableFile = {
	name: string;
	content: string;
	language: SupportedLanguage;
};

type SandpackViewerProps = {
	files: PlayableFile[];
	activeFileIndex?: number;
	status: string;
};

function PureSandpackViewer({
	files,
	activeFileIndex = 0,
}: SandpackViewerProps) {
	// Convert standard file array to Sandpack format
	const sandpackFiles = files.reduce(
		(acc, file) => {
			acc[`/${file.name}`] = file.content;
			return acc;
		},
		{} as Record<string, string>,
	);

	// Inject Tailwind CSS via CDN into the public index.html to support utility classes instantly
	if (!sandpackFiles["/public/index.html"]) {
		sandpackFiles["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Code Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {}
        }
      }
    </script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
	}

	const activeFile = files[activeFileIndex]?.name || files[0]?.name;

	return (
		<div className="w-full h-full flex flex-col bg-zinc-900 overflow-hidden">
			<SandpackProvider
				template="react"
				theme={dracula}
				files={sandpackFiles}
				options={{
					activeFile: `/${activeFile}`,
					classes: {
						"sp-wrapper": "h-full w-full",
						"sp-layout":
							"h-full w-full border-none rounded-none bg-transparent",
						"sp-pane": "bg-transparent",
					},
				}}
			>
				<SandpackLayout>
					{/* We only use the preview here because the parent component 
              in client.tsx already renders the custom CodeEditor. 
              Alternatively, we can show both Code and Preview. */}
					<div className="flex w-full h-full divide-x divide-zinc-800">
						<div className="flex-1 max-w-[50%] overflow-hidden h-[500px]">
							<SandpackCodeEditor
								showTabs={false}
								showLineNumbers={true}
								wrapContent={false}
								style={{ height: "100%" }}
							/>
						</div>
						<div className="flex-1 overflow-hidden h-[500px] bg-white">
							<SandpackPreview
								showNavigator={true}
								showRefreshButton={true}
								style={{ height: "100%" }}
							/>
						</div>
					</div>
				</SandpackLayout>
			</SandpackProvider>
		</div>
	);
}

export const SandpackViewer = memo(PureSandpackViewer);
