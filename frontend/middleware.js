// src/middleware.js
// ─── Proxy Harmony 2 via middleware Next.js ────────────────────────────────
// Fonctionne avec Turbopack sur Windows (évite les bugs avec [...path]/route.js)

import { NextResponse } from "next/server";

const HARMONY_BASE = "https://payment.harmony2.cm/api/external/panier";
const BASIC_TOKEN  = btoa("harmony_2_acteeng:AcM12@@d0f5uiT7@a5oeng");

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Intercepter uniquement /api/harmony/...
    if (!pathname.startsWith("/api/harmony")) {
        return NextResponse.next();
    }

    // Construire l'URL Harmony 2 : /api/harmony/arn/generate/payment → /arn/generate/payment
    const harmonyPath = pathname.replace("/api/harmony", "");
    const targetUrl   = `${HARMONY_BASE}${harmonyPath}`;

    console.log(`[Harmony2 middleware] ${request.method} ${targetUrl}`);

    let body = undefined;
    if (request.method === "POST") {
        try { body = await request.text(); } catch {}
    }

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            method:  request.method,
            headers: {
                "Content-Type":  "application/json",
                "Accept":        "application/json",
                "Authorization": `Basic ${BASIC_TOKEN}`,
            },
            ...(body !== undefined ? { body } : {}),
        });
    } catch (err) {
        console.error("[Harmony2 middleware] network error:", err.message);
        return NextResponse.json(
            { error: "network_error", message: err.message },
            { status: 502 }
        );
    }

    let text = "";
    try { text = await upstream.text(); } catch {}
    console.log(`[Harmony2 middleware] <- ${upstream.status}:`, text.slice(0, 200));

    let json;
    try { json = JSON.parse(text); }
    catch { json = { raw: text }; }

    return NextResponse.json(json, { status: upstream.status });
}

export const config = {
    matcher: "/api/harmony/:path*",
};