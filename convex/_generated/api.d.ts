/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as animate from "../animate.js";
import type * as animateJobs from "../animateJobs.js";
import type * as appContext from "../appContext.js";
import type * as assets from "../assets.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_higgsfield from "../lib/higgsfield.js";
import type * as lib_prompts from "../lib/prompts.js";
import type * as mascot from "../mascot.js";
import type * as poses from "../poses.js";
import type * as projects from "../projects.js";
import type * as questions from "../questions.js";
import type * as spec from "../spec.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  animate: typeof animate;
  animateJobs: typeof animateJobs;
  appContext: typeof appContext;
  assets: typeof assets;
  "lib/constants": typeof lib_constants;
  "lib/gemini": typeof lib_gemini;
  "lib/higgsfield": typeof lib_higgsfield;
  "lib/prompts": typeof lib_prompts;
  mascot: typeof mascot;
  poses: typeof poses;
  projects: typeof projects;
  questions: typeof questions;
  spec: typeof spec;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
