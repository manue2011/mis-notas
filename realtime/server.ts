import { Server } from "@hocuspocus/server";
import { verifyTicket, type Ticket } from "@/lib/realtime/ticket";
import { env } from "./env";
import { loadPage, storePage } from "./persistence";

// The real-time server (Hocuspocus), deployed on Render. One Yjs document
// per page, named by the page id. Build: npm run realtime:build.

type Context = Ticket;

const server = new Server<Context>({
  port: env().PORT,
  name: "libreta-realtime",
  quiet: true,
  // Save 2 s after the last change, and at least every 10 s while typing.
  debounce: 2000,
  maxDebounce: 10_000,
  websocketOptions: { maxPayload: 4 * 1024 * 1024 },

  async onAuthenticate({ token, documentName, connectionConfig }) {
    const ticket = verifyTicket(token, env().REALTIME_SECRET);
    if (!ticket || ticket.pageId !== documentName) throw new Error("Not allowed");
    // Readers get the page and everyone's cursors, but their changes are dropped.
    connectionConfig.readOnly = !ticket.canEdit;
    return ticket;
  },

  async onLoadDocument({ document, documentName, context }) {
    const found = await loadPage(document, { organizationId: context.organizationId, pageId: documentName });
    if (!found) throw new Error("Page not found");
  },

  async onStoreDocument({ document, documentName, lastContext }) {
    await storePage(document, { organizationId: lastContext.organizationId, pageId: documentName }, lastContext.userId);
  },

  // GET /health: lets the app wake the server up (Render's free plan sleeps).
  async onRequest({ request, response }) {
    if (request.url !== "/health") return;
    response.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    response.end("ok");
    throw null; // handled: stop Hocuspocus's default response
  },
});

await server.listen();
console.log(`[realtime] listening on port ${env().PORT}`);
