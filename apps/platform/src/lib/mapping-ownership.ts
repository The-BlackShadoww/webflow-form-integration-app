import { db } from "@/lib/db";

/**
 * A mapping belongs to a user via either:
 * - its credential (`credential.dashboardUserId`), or
 * - its site (`site.dashboardUserId`).
 * Legacy mappings only have site-link; new ones have both.
 */
export const userOwnsMapping = async (mappingId: number, userId: number) => {
  const mapping = await db.globalIntegration.findFirst({
    where: { id: mappingId },
    include: { credential: true },
  });
  if (!mapping) return null;
  if (mapping.credential?.dashboardUserId === userId) return mapping;
  const site = await db.site.findFirst({ where: { siteId: mapping.siteId, dashboardUserId: userId } });
  return site ? mapping : null;
};
