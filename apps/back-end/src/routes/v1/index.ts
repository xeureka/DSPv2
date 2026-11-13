import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/types/hono";
import health from "./health";
import me from "./me";
import authConfig from "./auth-config";

const v1 = new OpenAPIHono<AppEnv>();

v1.route("/", health);
v1.route("/", authConfig);
v1.route("/", me);

export default v1;
