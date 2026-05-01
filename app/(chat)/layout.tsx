import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatRouteLoading } from "@/components/chat-route-loading";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { MainContentWrapper } from "@/components/main-content-wrapper";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WebContainerProvider } from "@/components/webcontainer-provider";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Script
				src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
				strategy="lazyOnload"
			/>
			<WebContainerProvider>
				<DataStreamProvider>
					<Suspense
						fallback={<ChatRouteLoading label="Loading chat shell..." />}
					>
						<SidebarWrapper>{children}</SidebarWrapper>
					</Suspense>
				</DataStreamProvider>
			</WebContainerProvider>
		</>
	);
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
	const [session, cookieStore] = await Promise.all([auth(), cookies()]);
	const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

	return (
		<SidebarProvider defaultOpen={!isCollapsed}>
			<div className="flex h-screen w-full bg-[#0b0d10] text-foreground">
				<AppSidebar user={session?.user} />
				<MainContentWrapper>{children}</MainContentWrapper>
			</div>
		</SidebarProvider>
	);
}
