import { notFound, withParent } from "@/lib/auth";
import { UpdateCourseSchema } from "@/lib/account-schema";

// Store the quiz result once the child finishes the course.
export async function PATCH(request: Request, ctx: RouteContext<"/api/courses/[id]">) {
  const { id } = await ctx.params;
  return withParent(request, UpdateCourseSchema, async ({ db }, { result }) => {
    const { data, error } = await db
      .from("courses")
      .update({ result })
      .eq("id", id)
      .select("id, topic, style, level, result, created_at")
      .maybeSingle();
    if (error) throw error;
    return data ?? notFound();
  });
}
