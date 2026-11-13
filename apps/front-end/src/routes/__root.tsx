import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";

import { RootError, RootPending } from "@/components/errors/route-feedback";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query";

export const Route = createRootRoute({
	component: RootComponent,
	pendingComponent: RootPending,
	errorComponent: RootError,
});

// oxlint-disable-next-line react/only-export-components
function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<Outlet />
				<Toaster position="top-right" />
			</ThemeProvider>
			{import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
		</QueryClientProvider>
	);
}
