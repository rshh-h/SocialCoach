import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  anthropicArgs,
  extractJSON,
  LLMError,
  jsonCall as coreJsonCall,
  openaiArgs,
  type ChatOpts,
  type JSONCallOpts,
  type LLM,
  type OpenAIThinkingMode,
  type Provider,
  type SystemPart,
  type TextRun,
  type TokenParam,
} from "./llm-core";

export { extractJSON, LLMError };
export type { ChatOpts, LLM, Provider, SystemPart, TextRun };

/* ───────────────────────── Provider configuration ─────────────────────────
 * One provider is active per deployment, chosen by LLM_PROVIDER. Everything
 * below this block is provider-agnostic: routes call `chatText` / `chatStream`
 * and never see an SDK.
 *
 *   LLM_PROVIDER    anthropic (default) | openai
 *   LLM_BASE_URL    overrides the provider's default endpoint — this is the
 *                   knob for OpenAI-compatible gateways (vLLM, Ollama,
 *                   OpenRouter, LiteLLM, …)
 *   LLM_API_KEY     credential; provider-native vars still work as fallbacks
 *   LLM_FAST_MODEL / LLM_SMART_MODEL
 *   LLM_SMART_PROVIDER / LLM_SMART_BASE_URL
 *                   run the smart model on the other protocol (e.g. Claude
 *                   behind a chat-completions gateway that also serves it
 *                   only via /v1/messages)
 *   LLM_OPENAI_THINKING  off | none — how to disable reasoning on gateways
 *                   that would otherwise burn max_tokens on hidden thinking
 * ------------------------------------------------------------------------- */

const raw = (process.env.LLM_PROVIDER ?? "anthropic").trim().toLowerCase();
export const PROVIDER: Provider = raw === "openai" ? "openai" : "anthropic";

const BASE_URL =
  process.env.LLM_BASE_URL ||
  (PROVIDER === "openai" ? process.env.OPENAI_BASE_URL : process.env.ANTHROPIC_BASE_URL) ||
  undefined;

/**
 * The smart model can run on a different protocol than the fast model: some
 * gateways expose Claude only over the native Messages API while everything
 * else speaks chat completions (and each side may have its own models).
 * Unset → the smart model follows LLM_PROVIDER like always.
 *
 *   LLM_SMART_PROVIDER  anthropic | openai
 *   LLM_SMART_BASE_URL  endpoint for that provider; defaults to the
 *                       provider-native var, else LLM_BASE_URL with a
 *                       trailing /v1 stripped (the Anthropic SDK appends
 *                       its own /v1/messages, so it must not already have one)
 */
const SMART_PROVIDER: Provider | undefined = (() => {
  const raw = (process.env.LLM_SMART_PROVIDER ?? "").trim().toLowerCase();
  if (raw !== "anthropic" && raw !== "openai") return undefined;
  return raw === PROVIDER ? undefined : (raw as Provider);
})();

const SMART_BASE_URL =
  process.env.LLM_SMART_BASE_URL ||
  (SMART_PROVIDER === "openai" ? process.env.OPENAI_BASE_URL : process.env.ANTHROPIC_BASE_URL) ||
  BASE_URL?.replace(/\/v1\/?$/, "") ||
  undefined;

const API_KEY =
  process.env.LLM_API_KEY ||
  (PROVIDER === "openai"
    ? process.env.OPENAI_API_KEY
    : (process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN));

/**
 * Newer OpenAI models reject `max_tokens` and want `max_completion_tokens`,
 * while most OpenAI-compatible servers only know `max_tokens`. Default to the
 * compatible one and let a deployment switch.
 */
const OPENAI_TOKEN_PARAM: TokenParam = process.env.LLM_OPENAI_TOKEN_PARAM === "max_completion_tokens" ? "max_completion_tokens" : "max_tokens";

/** How the OpenAI-compatible path should turn thinking off. GLM-style gateways
 *  take `thinking:{type:"disabled"}`; DeepSeek-style ones want
 *  `reasoning_effort:"none"`. Official OpenAI rejects both — leave unset there. */
const OPENAI_THINKING_MODE: OpenAIThinkingMode | undefined =
  process.env.LLM_OPENAI_THINKING === "disabled" ? "off" : process.env.LLM_OPENAI_THINKING === "none" ? "none" : undefined;

const DEFAULT_MODELS: Record<Provider, { fast: string; smart: string }> = {
  anthropic: { fast: "claude-sonnet-5", smart: "claude-opus-5" },
  // Set these explicitly for OpenAI-compatible endpoints; the defaults are only a guess.
  openai: { fast: "gpt-4.1-mini", smart: "gpt-4.1" },
};

/** Fast model: role-play turns, hints, short coach replies, scheduling, scenario generation. */
export const FAST_MODEL = process.env.LLM_FAST_MODEL ?? DEFAULT_MODELS[PROVIDER].fast;
/** Smart model: post-practice assessment reports. */
export const SMART_MODEL = process.env.LLM_SMART_MODEL ?? DEFAULT_MODELS[PROVIDER].smart;

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;
let _smartAnthropic: Anthropic | null = null;
let _smartOpenai: OpenAI | null = null;

/** Whether this deployment can call a model on the learner's behalf. */
export const hasServerCredential = () => !!API_KEY;

function requireKey() {
  if (API_KEY) return API_KEY;
  throw new LLMError(
    PROVIDER === "openai"
      ? "No OpenAI credential. Set LLM_API_KEY or OPENAI_API_KEY."
      : "No Anthropic credential. Set LLM_API_KEY, ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN.",
    500,
  );
}

function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: requireKey(), baseURL: BASE_URL, maxRetries: 2, timeout: 120_000 });
  return _anthropic;
}

function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: requireKey(), baseURL: BASE_URL, maxRetries: 2, timeout: 120_000 });
  return _openai;
}

function smartAnthropic(): Anthropic {
  if (!_smartAnthropic) _smartAnthropic = new Anthropic({ apiKey: requireKey(), baseURL: SMART_BASE_URL, maxRetries: 2, timeout: 120_000 });
  return _smartAnthropic;
}

function smartOpenai(): OpenAI {
  if (!_smartOpenai) _smartOpenai = new OpenAI({ apiKey: requireKey(), baseURL: SMART_BASE_URL, maxRetries: 2, timeout: 120_000 });
  return _smartOpenai;
}

/**
 * Which protocol a call should use. Tasks name their model explicitly, so the
 * choice is per call: the smart model goes to its own provider when one is
 * configured. A split only makes sense while the two models differ — with
 * FAST_MODEL === SMART_MODEL there is nothing to separate, so we keep one
 * provider and ignore LLM_SMART_PROVIDER.
 */
function route(o: ChatOpts): Provider {
  if (SMART_PROVIDER && FAST_MODEL !== SMART_MODEL && o.model === SMART_MODEL) return SMART_PROVIDER;
  return PROVIDER;
}

/* ───────────────────────────── The server LLM ─────────────────────────────
 * Built from environment variables. The browser builds its own from the user's
 * settings (see `llm-client.ts`); both satisfy the same `LLM` interface, so the
 * task modules in `lib/tasks/` run unchanged on either side.
 * ------------------------------------------------------------------------- */

/** One-shot call; returns the assistant's text. */
export async function chatText(o: ChatOpts): Promise<string> {
  if (route(o) === "openai") {
    const client = o.model === SMART_MODEL && SMART_PROVIDER === "openai" ? smartOpenai() : openai();
    const res = await client.chat.completions.create(
      openaiArgs(o, SMART_MODEL, OPENAI_TOKEN_PARAM, OPENAI_THINKING_MODE) as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    );
    const choice = res.choices[0];
    if (choice?.message?.refusal) throw new LLMError("The model declined this request.", 422);
    return choice?.message?.content ?? "";
  }
  const client = o.model === SMART_MODEL && SMART_PROVIDER === "anthropic" ? smartAnthropic() : anthropic();
  const res = await client.messages.create(anthropicArgs(o, SMART_MODEL));
  if (res.stop_reason === "refusal") throw new LLMError("The model declined this request.", 422);
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Streaming call. Text deltas only; tool calls and thinking blocks are not surfaced. */
export function chatStream(o: ChatOpts): TextRun {
  let acc = "";
  let refusal = false;
  async function* run() {
    if (route(o) === "openai") {
      const client = o.model === SMART_MODEL && SMART_PROVIDER === "openai" ? smartOpenai() : openai();
      const stream = await client.chat.completions.create({
        ...openaiArgs(o, SMART_MODEL, OPENAI_TOKEN_PARAM, OPENAI_THINKING_MODE),
        stream: true,
      } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming);
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (choice?.delta?.refusal) refusal = true;
        if (choice?.finish_reason === "content_filter") refusal = true;
        const d = choice?.delta?.content;
        if (d) {
          acc += d;
          yield d;
        }
      }
      return;
    }
    const client = o.model === SMART_MODEL && SMART_PROVIDER === "anthropic" ? smartAnthropic() : anthropic();
    const stream = client.messages.stream(anthropicArgs(o, SMART_MODEL));
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta" && ev.delta.text) {
        acc += ev.delta.text;
        yield ev.delta.text;
      }
    }
    // Anthropic only reveals a refusal on the final message.
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") refusal = true;
  }
  return { deltas: run(), text: () => acc, refused: () => refusal };
}

/** The server-side LLM, for route handlers. */
export const serverLLM: LLM = { chatText, chatStream };

/** `jsonCall` bound to the server LLM. */
export const jsonCall = <T>(opts: JSONCallOpts) => coreJsonCall<T>(opts, serverLLM);

/**
 * The provider's own words, when it sent any. Worth preferring over our generic
 * text: a 429 can mean "slow down" or "your balance is empty", and only the
 * provider knows which — telling someone to retry a spent account is worse than
 * saying nothing.
 */
function providerMessage(e: unknown): string | null {
  const body = (e as { error?: { message?: unknown } } | null)?.error;
  const msg = body && typeof body === "object" ? (body as { message?: unknown }).message : undefined;
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
}

export function toHttpError(e: unknown): { status: number; message: string } {
  if (e instanceof LLMError) return { status: e.status, message: e.message };
  const provider = providerMessage(e);
  if (e instanceof Anthropic.AuthenticationError || e instanceof OpenAI.AuthenticationError) return { status: 401, message: provider ?? "LLM credentials are invalid." };
  if (e instanceof Anthropic.RateLimitError || e instanceof OpenAI.RateLimitError) return { status: 429, message: provider ?? "Too many requests to the model. Try again in a moment." };
  if (e instanceof Anthropic.APIConnectionError || e instanceof OpenAI.APIConnectionError) return { status: 503, message: `Could not reach the model${BASE_URL ? ` at ${BASE_URL}` : ""}.` };
  if (e instanceof Anthropic.APIError || e instanceof OpenAI.APIError) return { status: e.status ?? 502, message: provider ?? e.message };
  return { status: 500, message: e instanceof Error ? e.message : "Unknown error" };
}
