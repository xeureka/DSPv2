import { List, SidebarSimple } from "@phosphor-icons/react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Separator } from "./separator";
import { Sheet } from "./sheet";
import { Tooltip } from "./tooltip";

type SidebarContextValue = {
	collapsed: boolean;
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
	toggleCollapsed: () => void;
};
const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [collapsed, setCollapsed] = useState(
		() =>
			typeof window !== "undefined" &&
			window.localStorage.getItem("dispatchpilot-sidebar-collapsed") === "true",
	);
	const [mobileOpen, setMobileOpen] = useState(false);
	const toggleCollapsed = () =>
		setCollapsed((value) => {
			const next = !value;
			window.localStorage.setItem(
				"dispatchpilot-sidebar-collapsed",
				String(next),
			);
			return next;
		});
	return (
		<SidebarContext.Provider
			value={{ collapsed, mobileOpen, setMobileOpen, toggleCollapsed }}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const value = useContext(SidebarContext);
	if (!value) throw new Error("useSidebar must be used inside SidebarProvider");
	return value;
}

export function Sidebar({ children }: { children: ReactNode }) {
	const { collapsed } = useSidebar();
	return (
		<aside
			className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-64"}`}
		>
			{children}
		</aside>
	);
}

export function MobileSidebar({ children }: { children: ReactNode }) {
	const { mobileOpen, setMobileOpen } = useSidebar();
	return (
		<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
			{children}
		</Sheet>
	);
}

export function SidebarToggle({ mobile = false }: { mobile?: boolean }) {
	const { setMobileOpen, toggleCollapsed } = useSidebar();
	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={mobile ? "Open navigation" : "Toggle navigation"}
			onClick={() => (mobile ? setMobileOpen(true) : toggleCollapsed())}
		>
			{mobile ? <List size={20} /> : <SidebarSimple size={20} />}
		</Button>
	);
}

export function SidebarHeader({ children }: { children: ReactNode }) {
	return <div className="flex min-h-16 items-center px-4">{children}</div>;
}
export function SidebarContent({ children }: { children: ReactNode }) {
	return <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>;
}
export function SidebarFooter({ children }: { children: ReactNode }) {
	return <div className="mt-auto px-3 pb-4">{children}</div>;
}
export function SidebarSeparator() {
	return <Separator className="my-3 bg-sidebar-border" />;
}
export { Tooltip };
