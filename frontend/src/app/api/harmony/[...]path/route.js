// src/app/api/harmony/[...path]/route.js
// ─── Proxy serveur vers Harmony 2 ─────────────────────────────────────────

import { NextResponse } from "next/server";

// Forcer le runtime Node.js (pas Edge) — nécessaire pour fetch fiable + Buffer
export const runtime = "nodejs";

const HARMONY_BASE = "https://payment.harmony2.cm/api/external/panier";

// Encodage base64 compatible Node.js ET Edge
function toBase64(str) {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(str).toString("base64");
    }
    return btoa(unescape(encodeURIComponent(str)));
}

const BASIC_TOKEN = toBase64("harmony_2_acteeng:AcM12@@d0f5uiT7@a5oeng");

async function proxy(method, request, context) {
    let pathSegments = [];

    try {
        // Next.js 15+ : params peut être une Promise
        const params   = context?.params;
        const resolved = params instanceof Promise ? await params : params;
        pathSegments   = resolved?.path || [];
    } catch (e) {
        console.error("[Harmony2 proxy] params error:", e.message);
    }

    const path = "/" + pathSegments.join("/");
    const url  = `${HARMONY_BASE}${path}`;

    let body = undefined;
    if (method === "POST") {
        try { body = await request.text(); } catch {}
    }

    console.log(`[Harmony2 proxy] ${method} ${url}`);
    if (body) {
        try { console.log("[Harmony2 proxy] body:", JSON.parse(body)); } catch {}
    }

    let upstream;
    try {
        upstream = await fetch(url, {
            method,
            headers: {
                "Content-Type":  "application/json",
                "Accept":        "application/json",
                "Authorization": `Basic ${BASIC_TOKEN}`,
            },
            ...(body !== undefined ? { body } : {}),
        });
    } catch (err) {
        console.error("[Harmony2 proxy] network error:", err.message);
        return NextResponse.json(
            { error: "network_error", message: err.message },
            { status: 502 }
        );
    }

    let text = "";
    try { text = await upstream.text(); } catch {}
    console.log(`[Harmony2 proxy] <- ${upstream.status}:`, text.slice(0, 300));

    let json;
    try { json = JSON.parse(text); }
    catch { json = { raw: text }; }

    return NextResponse.json(json, { status: upstream.status });
}

export async function POST(request, context) {
    return proxy("POST", request, context);
}

export async function GET(request, context) {
    return proxy("GET", request, context);
}