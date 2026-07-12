import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { listCompanies, listProducts } from "@/lib/registry/repository";
import { listMcpServers } from "@/lib/ecosystem/repository";
import { scoreHistory } from "@/lib/trust/service";

const t = initTRPC.create();
const subjectType = z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]);

export const appRouter = t.router({
  health: t.procedure.query(() => ({ status: "ok" as const })),
  search: t.procedure.input(z.object({ query: z.string().min(2).max(200), limit: z.number().int().min(1).max(100).default(20) })).query(async ({ input }) => {
    const [companies, products] = await Promise.all([listCompanies(input), listProducts(input)]);
    return { companies: companies.items, products: products.items };
  }),
  mcpServers: t.procedure.input(z.object({ query: z.string().optional(), enterpriseReady: z.boolean().optional(), sandboxCompatible: z.boolean().optional(), limit: z.number().int().min(1).max(100).default(20) })).query(({ input }) => listMcpServers(input)),
  trustScore: t.procedure.input(z.object({ subjectType, subjectId: z.uuid() })).query(async ({ input }) => (await scoreHistory(input.subjectType, input.subjectId, 1))[0] ?? null),
});

export type AppRouter = typeof appRouter;
