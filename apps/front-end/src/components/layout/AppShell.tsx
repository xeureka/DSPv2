import { Question, SignOut } from "@phosphor-icons/react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import type { UserRole } from "@dspv2/shared";
import {
	navigationForMobile,
	navigationForRole,
	type NavigationItem,
} from "@/config/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	MobileSidebar,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarProvider,
	SidebarToggle,
	SidebarRail,
	Tooltip,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { USE_MOCK_DATA } from "@/lib/env";

function roleLabel(role: UserRole | undefined) {
	return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
}

function Brand({ compact = false }: { compact?: boolean }) {
	return (
		<Link
			to="/"
			className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
		>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs text-sidebar-primary-foreground">
				DP
			</span>
			{compact ? null : <span className="truncate">DispatchPilot</span>}
		</Link>
	);
}

function NavItem({
	item,
	collapsed = false,
	onNavigate,
}: {
	item: NavigationItem;
	collapsed?: boolean;
	onNavigate?: () => void;
}) {
	const Icon = item.icon;
	const location = useLocation();
	const active = location.pathname === item.route;
	return (
		<Tooltip label={item.label}>
			<Link
				to={item.route as never}
				onClick={onNavigate}
				aria-current={active ? "page" : undefined}
				className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-hover hover:text-sidebar-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring active:bg-sidebar-pressed ${collapsed ? "justify-center px-0" : ""} ${active ? "bg-sidebar-active text-sidebar-active-foreground font-semibold" : ""}`}
			>
				<span className="relative flex size-5 shrink-0 items-center justify-center">
					<Icon
						aria-hidden="true"
						size={20}
						weight={active ? "fill" : "regular"}
					/>
					{collapsed && item.badge ? (
						<span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-status-attention" />
					) : null}
				</span>
				{collapsed ? (
					<span className="sr-only">{item.label}</span>
				) : (
					<span className="min-w-0 flex-1 truncate">{item.label}</span>
				)}
				{!collapsed && item.badge ? (
					<span className="rounded-full bg-sidebar-badge px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-badge-foreground">
						{item.badge}
					</span>
				) : null}
			</Link>
		</Tooltip>
	);
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
	const { collapsed, setMobileOpen } = useSidebar();
	const { data: session } = authClient.useSession();
	const role = (session?.user as { role?: UserRole } | undefined)?.role;
	return (
		<nav aria-label="Primary navigation" className="space-y-1">
			{navigationForRole(role).map((item) => (
				<NavItem
					key={item.label}
					item={item}
					collapsed={collapsed && !mobile}
					onNavigate={mobile ? () => setMobileOpen(false) : undefined}
				/>
			))}
		</nav>
	);
}

function ShellSidebar() {
	const { collapsed } = useSidebar();
	const { data: session } = authClient.useSession();
	const user = session?.user;
	const role = (user as { role?: UserRole } | undefined)?.role;
	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.assign("/login");
	};
	return (
		<Sidebar>
			<SidebarHeader
				className={collapsed ? "flex-col justify-center gap-2 py-3" : "gap-2"}
			>
				<Brand compact={collapsed} />
				<SidebarToggle />
			</SidebarHeader>
			<SidebarContent>
				<Navigation />
			</SidebarContent>
			<SidebarFooter>
				<div className="space-y-1">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className={`min-h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-hover ${collapsed ? "justify-center px-0" : ""}`}
							>
								<Avatar className="size-7 shrink-0 text-[10px]">
									{user?.name?.slice(0, 1).toUpperCase() || "U"}
								</Avatar>
								{collapsed ? (
									<span className="sr-only">Account</span>
								) : (
									<span className="min-w-0 truncate text-left">
										<strong className="block truncate text-xs font-medium">
											{user?.name || user?.email}
										</strong>
										<span className="block truncate text-[10px] text-muted-foreground">
											{roleLabel(role)}
										</span>
									</span>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem disabled>
								{roleLabel(role)} · {user?.email}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleSignOut}>
								<SignOut size={16} /> Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="ghost"
						className={`min-h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-hover ${collapsed ? "justify-center px-0" : ""}`}
					>
						<Question size={20} />
						{collapsed ? <span className="sr-only">Help</span> : "Help"}
					</Button>
				</div>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

function MobileNavigation() {
	const { setMobileOpen } = useSidebar();
	const { data: session } = authClient.useSession();
	const user = session?.user;
	const role = (user as { role?: UserRole } | undefined)?.role;
	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.assign("/login");
	};
	useEffect(() => {
		const open = () => setMobileOpen(true);
		window.addEventListener("dispatchpilot:open-mobile-nav", open);
		return () =>
			window.removeEventListener("dispatchpilot:open-mobile-nav", open);
	}, [setMobileOpen]);
	return (
		<MobileSidebar>
			<div className="flex h-full min-h-0 flex-col pt-2">
				<div className="px-2">
					<Brand />
				</div>
				<Separator className="my-5 bg-sidebar-border" />
				<div className="min-h-0 flex-1 overflow-y-auto px-2">
					<Navigation mobile />
				</div>
				<div className="shrink-0 border-t border-sidebar-border px-2 pt-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="min-h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-hover"
							>
								<Avatar className="size-7 shrink-0 text-[10px]">
									{user?.name?.slice(0, 1).toUpperCase() || "U"}
								</Avatar>
								<span className="min-w-0 truncate text-left">
									<strong className="block truncate text-xs font-medium">
										{user?.name || user?.email}
									</strong>
									<span className="block truncate text-[10px] text-muted-foreground">
										{roleLabel(role)}
									</span>
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem disabled>
								{roleLabel(role)} · {user?.email}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleSignOut}>
								<SignOut size={16} /> Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</MobileSidebar>
	);
}

function BottomTabs() {
	const { data: session } = authClient.useSession();
	const role = (session?.user as { role?: UserRole } | undefined)?.role;
	return (
		<nav
			aria-label="Mobile navigation"
			className="safe-bottom border-t border-border bg-card px-2 py-2 md:hidden"
		>
			<div className="grid grid-cols-4 gap-1">
				{navigationForMobile(role).map((item) => (
					<NavItem key={item.label} item={item} />
				))}
				{role !== "technician" ? (
					<button
						className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md text-[10px] text-muted-foreground"
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent("dispatchpilot:open-mobile-nav"),
							)
						}
					>
						More
					</button>
				) : null}
			</div>
		</nav>
	);
}

export function AppShell() {
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session } = authClient.useSession();
	const user = session?.user;
	if (!user)
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-6">
				<div className="max-w-sm rounded-xl border border-border bg-card p-6 text-center">
					<h1 className="font-semibold">Session unavailable</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Your session could not be restored. Sign in again to continue.
					</p>
					<Link
						to="/login"
						className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
					>
						Go to sign in
					</Link>
				</div>
			</div>
		);
	const role = (user as { role?: UserRole }).role;
	const handleSignOut = async () => {
		await authClient.signOut();
		toast.success("Signed out");
		navigate({ to: "/login", replace: true });
	};
	const current =
		navigationForRole(role).find((item) => item.route === location.pathname)
			?.label ?? (role === "technician" ? "My Jobs" : "Dispatch Board");
	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full overflow-x-hidden bg-background text-foreground">
				<ShellSidebar />
				<MobileNavigation />
				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
						<div className="flex min-w-0 items-center gap-3">
							<div className="md:hidden">
								<SidebarToggle mobile />
							</div>
							<div className="hidden md:block">
								<span className="text-sm text-muted-foreground">Workspace</span>
								<span className="mx-2 text-muted-foreground/50">/</span>
								<span className="text-sm font-medium">{current}</span>
							</div>
							<span className="truncate text-sm font-semibold md:hidden">
								{current}
							</span>
						</div>
						<div className="flex items-center gap-2">
							{USE_MOCK_DATA ? (
								<Badge
									variant="secondary"
									className="hidden rounded-full text-[10px] sm:inline-flex"
								>
									Demo data
								</Badge>
							) : null}
							<Button variant="ghost" size="icon" aria-label="Help">
								<Question size={19} />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="ml-1 gap-2 px-2">
										<Avatar className="size-8 text-xs">
											{user.name?.slice(0, 1).toUpperCase() || "U"}
										</Avatar>
										<span className="hidden max-w-32 truncate text-sm sm:block">
											{user.name || user.email}
										</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem disabled>
										{roleLabel(role)} · {user.email}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleSignOut}>
										<SignOut aria-hidden="true" size={17} />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>
					<main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 md:pb-6">
						<Outlet />
					</main>
					<BottomTabs />
				</div>
			</div>
		</SidebarProvider>
	);
}
