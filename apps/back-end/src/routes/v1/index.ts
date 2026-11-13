import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/types/hono";

const v1 = new OpenAPIHono<AppEnv>();

export default v1;
