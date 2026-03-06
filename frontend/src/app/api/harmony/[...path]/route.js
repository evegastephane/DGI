// src/app/api/harmony/[...path]/route.js
// ─── Proxy serveur vers Harmony 2 ─────────────────────────────────────────

import { NextResponse } from "next/server";
import https from "https";
import zlib from "zlib";

export const runtime = "nodejs";

const HARMONY_BASE = "https://payment.harmony2.cm/api/external/panier";
const BASIC_TOKEN  = "aGFybW9ueV8yX2FjdGVlbmc6QWNNMTJAQGQwZjV1aVQ3QGE1b2VuZw==";

// Agent HTTPS qui ignore les erreurs de certificat SSL
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function fetchWithAgent(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            port:     urlObj.port || 443,
            path:     urlObj.pathname + urlObj.search,
            method:   options.method || "GET",
            headers:  options.headers || {},
            agent:    httpsAgent,
        };

        const req = https.request(reqOptions, (res) => {
            // Collecter les chunks en Buffer (pas en string) pour supporter gzip
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                const raw      = Buffer.concat(chunks);
                const encoding = res.headers["content-encoding"] || "";

                // Décompresser si nécessaire
                const decompress = (buf) => new Promise((res2, rej2) => {
                    if (encoding.includes("gzip")) {
                        zlib.gunzip(buf, (err, result) => err ? rej2(err) : res2(result.toString("utf-8")));
                    } else if (encoding.includes("deflate")) {
                        zlib.inflate(buf, (err, result) => err ? rej2(err) : res2(result.toString("utf-8")));
                    } else if (encoding.includes("br")) {
                        zlib.brotliDecompress(buf, (err, result) => err ? rej2(err) : res2(result.toString("utf-8")));
                    } else {
                        res2(buf.toString("utf-8"));
                    }
                });

                decompress(raw)
                    .then((text) => resolve({
                        status: res.statusCode,
                        ok:     res.statusCode >= 200 && res.statusCode < 300,
                        text:   () => Promise.resolve(text),
                    }))
                    .catch((err) => {
                        // Si la décompression échoue, retourner le texte brut quand même
                        console.warn("[Harmony2 proxy] décompression échouée:", err.message);
                        resolve({
                            status: res.statusCode,
                            ok:     res.statusCode >= 200 && res.statusCode < 300,
                            text:   () => Promise.resolve(raw.toString("utf-8")),
                        });
                    });
            });
        });

        req.on("error", (err) => reject(err));
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function proxy(method, request, context) {
    let pathSegments = [];
    try {
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

    const headers = {
        "Content-Type":  "application/json",
        "Accept":        "*/*",
        "Authorization": `Basic ${BASIC_TOKEN}`,
        "User-Agent":    "PostmanRuntime/7.51.1",
        // On accepte gzip — maintenant le proxy sait le décompresser
        "Accept-Encoding": "gzip, deflate, br",
        "Connection":    "keep-alive",
    };

    if (body) {
        headers["Content-Length"] = Buffer.byteLength(body).toString();
    }

    let upstream;
    try {
        upstream = await fetchWithAgent(url, {
            method,
            headers,
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
    console.log(`[Harmony2 proxy] <- ${upstream.status}:`, text.slice(0, 500));

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