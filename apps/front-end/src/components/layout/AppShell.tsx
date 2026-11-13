import { Question, SignOut } from "@phosphor-icons/react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { UserRole } from "@dspv2/shared";
import {
	navigationForRole,
	navigationGroups,
	type NavigationItem,
} from "@/config/navigation";
import { Avatar } from "@/components/ui/avatar";
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
	SidebarSeparator,
	SidebarToggle,
	Tooltip,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

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
	return (
		<Tooltip label={item.label}>
			<Link
				to="/"
				onClick={onNavigate}
				activeOptions={{ exact: true }}
				activeProps={{
					className: "bg-sidebar-primary text-sidebar-primary-foreground",
				}}
				className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent ${collapsed ? "justify-center px-0" : ""}`}
			>
				<Icon aria-hidden="true" size={19} weight="duotone" />
				{collapsed ? (
					<span className="sr-only">{item.label}</span>
				) : (
					<span>{item.label}</span>
				)}
			</Link>
		</Tooltip>
	);
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
	const { collapsed, setMobileOpen } = useSidebar();
	const { data: session } = authClient.useSession();
	const role = (session?.user as { role?: UserRole } | undefined)?.role;
	return (
		<nav aria-label="Primary navigation" className="space-y-6">
			{navigationGroups(role).map(({ group, items }) => (
				<div key={group}>
					<p
						className={`mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60 ${collapsed && !mobile ? "sr-only" : ""}`}
					>
						{group}
					</p>
					<div className="space-y-1">
						{items.map((item) => (
							<NavItem
								key={item.label}
								item={item}
								collapsed={collapsed && !mobile}
								onNavigate={mobile ? () => setMobileOpen(false) : undefined}
							/>
						))}
					</div>
				</div>
			))}
		</nav>
	);
}

function ShellSidebar() {
	const { collapsed } = useSidebar();
	return (
		<Sidebar>
			<SidebarHeader>
				<Brand compact={collapsed} />
				<div className="ml-auto">
					<SidebarToggle />
				</div>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				<Navigation />
			</SidebarContent>
			<SidebarFooter>
				<Separator className="mb-3 bg-sidebar-border" />
				<Button
					variant="ghost"
					className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent ${collapsed ? "justify-center px-0" : ""}`}
				>
					<Question aria-hidden="true" size={19} />
					{collapsed ? <span className="sr-only">Help</span> : "Help & support"}
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}

function MobileNavigation() {
	return (
		<MobileSidebar>
			<div className="flex h-full flex-col pt-8">
				<div className="px-2">
					<Brand />
				</div>
				<Separator className="my-5 bg-sidebar-border" />
				<div className="overflow-y-auto px-2">
					<Navigation mobile />
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
				{navigationForRole(role)
					.slice(0, 4)
					.map((item) => (
						<NavItem key={item.label} item={item} />
					))}
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
	const current = location.pathname === "/" ? "Overview" : "Workspace";
	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full overflow-x-hidden bg-background text-foreground">
				<ShellSidebar />
				<MobileNavigation />
				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
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
						<div className="flex items-center gap-1">
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
