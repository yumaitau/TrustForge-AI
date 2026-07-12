import { and, asc, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { companies, products } from "@/db/schema";
import { db } from "@/lib/db/client";
import { canonicalSlug, type CompanyInput, type ProductInput } from "./schemas";

const boundedLimit = (limit?: number) => Math.min(Math.max(limit ?? 20, 1), 100);

export async function listCompanies(input: { query?: string; countryCode?: string; verified?: boolean; cursor?: string; limit?: number } = {}) {
  const filters = [isNull(companies.deletedAt)];
  if (input.cursor) filters.push(gt(companies.id, input.cursor));
  if (input.query) filters.push(or(ilike(companies.displayName, `%${input.query}%`), ilike(companies.legalName, `%${input.query}%`))!);
  if (input.countryCode) filters.push(eq(companies.countryCode, input.countryCode.toUpperCase()));
  if (input.verified) filters.push(sql`${companies.verificationLevel} <> 'unverified'`);
  const limit = boundedLimit(input.limit);
  const rows = await db.select().from(companies).where(and(...filters)).orderBy(asc(companies.id)).limit(limit + 1);
  return { items: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1]?.id ?? null : null };
}

export async function getCompany(idOrSlug: string) {
  const [company] = await db.select().from(companies).where(and(isNull(companies.deletedAt), or(eq(companies.id, idOrSlug), eq(companies.slug, idOrSlug)))).limit(1);
  return company ?? null;
}

export async function createCompany(input: CompanyInput, claimedByOrganisationId: string) {
  const id = uuidv7();
  const [company] = await db.insert(companies).values({ id, ...input, slug: canonicalSlug(input.displayName, id), claimedByOrganisationId }).returning();
  return company;
}

export async function listProducts(input: { query?: string; type?: ProductInput["type"]; openSource?: boolean; verified?: boolean; cursor?: string; limit?: number } = {}) {
  const filters = [isNull(products.deletedAt)];
  if (input.cursor) filters.push(gt(products.id, input.cursor));
  if (input.query) filters.push(ilike(products.name, `%${input.query}%`));
  if (input.type) filters.push(eq(products.type, input.type));
  if (input.openSource !== undefined) filters.push(eq(products.openSource, input.openSource));
  if (input.verified) filters.push(sql`${products.verificationLevel} <> 'unverified'`);
  const limit = boundedLimit(input.limit);
  const rows = await db.select().from(products).where(and(...filters)).orderBy(asc(products.id)).limit(limit + 1);
  return { items: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1]?.id ?? null : null };
}

export async function getProduct(idOrSlug: string) {
  const [product] = await db.select().from(products).where(and(isNull(products.deletedAt), or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug)))).limit(1);
  return product ?? null;
}

export async function createProduct(input: ProductInput) {
  const id = uuidv7();
  const [product] = await db.insert(products).values({ id, ...input, slug: canonicalSlug(input.name, id) }).returning();
  return product;
}

export async function recentRegistrySubjects(limit = 12) {
  const [companyRows, productRows] = await Promise.all([
    db.select({ id: companies.id, slug: companies.slug, name: companies.displayName, kind: companies.legalName, verification: companies.verificationLevel, createdAt: companies.createdAt }).from(companies).where(isNull(companies.deletedAt)).orderBy(desc(companies.createdAt)).limit(limit),
    db.select({ id: products.id, slug: products.slug, name: products.name, kind: products.type, verification: products.verificationLevel, createdAt: products.createdAt }).from(products).where(isNull(products.deletedAt)).orderBy(desc(products.createdAt)).limit(limit),
  ]);
  return [...companyRows.map((row) => ({ ...row, subjectType: "company" as const })), ...productRows.map((row) => ({ ...row, subjectType: "product" as const }))].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
