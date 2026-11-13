import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "../../lib/auth-client.ts";

type StaffRole = "manager" | "dispatcher" | "technician";

const roleLabels: Record<StaffRole, string> = {
	manager: "Manager",
	dispatcher: "Dispatcher",
	technician: "Technician",
};

function labelForRole(value: string | undefined): string {
	if (value && value.toLowerCase() in roleLabels) {
		return roleLabels[value.toLowerCase() as StaffRole];
	}
	return "Staff";
}

export function AppShell() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const user = session?.user;

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
				<div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
					<h1 className="text-base font-semibold text-slate-900">
						Session unavailable
					</h1>
					<p className="mt-2 text-sm text-slate-500">
						Your session could not be restored. Sign in again to continue.
					</p>
					<Link
						to="/login"
						className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
					>
						Go to sign in
					</Link>
				</div>
			</div>
		);
	}

	const role = labelForRole((user as { role?: string }).role);

	const handleSignOut = async () => {
		await authClient.signOut();
		toast.success("Signed out");
		navigate({ to: "/login", replace: true });
	};

	return (
		<div className="flex min-h-screen bg-slate-50 text-slate-900">
			<aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
				<div className="border-b border-slate-200 px-5 py-4">
					<p className="text-sm font-semibold">DispatchPilot</p>
					<p className="mt-1 text-xs text-slate-500">
						Field operations foundation
					</p>
				</div>
				<nav className="flex-1 px-3 py-4" aria-label="Primary navigation">
					<p className="rounded-lg px-3 py-2 text-sm text-slate-500">
						No modules enabled yet.
					</p>
				</nav>
				<div className="border-t border-slate-200 p-4 text-xs text-slate-500">
					<p className="font-medium text-slate-700">{role}</p>
					<p className="mt-1 truncate">{user.email}</p>
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
					<p className="text-sm font-semibold md:hidden">DispatchPilot</p>
					<p className="hidden text-sm text-slate-500 md:block">
						Authenticated foundation
					</p>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">{user.name || user.email}</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleSignOut}>
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>
				<main className="min-w-0 flex-1 p-4 sm:p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
