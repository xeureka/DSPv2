import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/types/hono";
import health from "./health";
import me from "./me";
import authConfig from "./auth-config";
import foundation from "./foundation";
import core from "./core";
import intake from "./intake";
import internal from "./internal";

const v1 = new OpenAPIHono<AppEnv>();

v1.route("/", health);
v1.route("/", authConfig);
v1.route("/", me);
v1.route("/", foundation);
v1.route("/", core);
v1.route("/", intake);
v1.route("/", internal);

export default v1;
