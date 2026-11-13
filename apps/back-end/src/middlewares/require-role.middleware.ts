import type { MiddlewareHandler } from "hono";

import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";
import type { UserRole } from "@dspv2/shared";
import type { AppEnv } from "@/types/hono";

export function requireRole(
	...allowedRoles: UserRole[]
): MiddlewareHandler<AppEnv> {
	return async (c, next) => {
		const user = c.get("user");
		if (!user) {
			throw new AppError("Authentication required", 401, ErrorCode.UNAUTHORIZED);
		}

		const role = user.role as UserRole | undefined;
		c.set("role", role ?? null);
		if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
			throw new AppError("Insufficient role", 403, ErrorCode.FORBIDDEN);
		}

		await next();
	};
}
