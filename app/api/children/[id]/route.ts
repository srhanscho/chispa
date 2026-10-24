import { notFound, withParent } from "@/lib/auth";
import { UpdateChildSchema } from "@/lib/account-schema";

// Save a child's name, age or adaptive engine profile (call after every lesson to sync progress).
export async function PATCH(request: Request, ctx: RouteContext<"/api/children/[id]">) {
  const { id } = await ctx.params;
  return withParent(request, UpdateChildSchema, async ({ db }, input) => {
    const { data, error } = await db
      .from("children")
      .update(input)
      .eq("id", id)
      .select("id, name, age, profile, updated_at")
      .maybeSingle();
    if (error) throw error;
    return data ?? notFound();
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/children/[id]">) {
  const { id } = await ctx.params;
  return withParent(request, null, async ({ db }) => {
    const { error, count } = await db.from("children").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    return count ? new Response(null, { status: 204 }) : notFound();
  });
}
