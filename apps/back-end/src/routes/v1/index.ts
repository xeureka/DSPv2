import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/types/hono";
import health from "./health";

const v1 = new OpenAPIHono<AppEnv>();

v1.route("/", health);

export default v1;
