import { withParent } from "@/lib/auth";
import { NewCourseSchema } from "@/lib/account-schema";

// A child's saved courses, newest first. Add ?full=1 to include the whole lesson to replay it.
export async function GET(request: Request, ctx: RouteContext<"/api/children/[id]/courses">) {
  const { id } = await ctx.params;
  const full = new URL(request.url).searchParams.get("full") === "1";
  return withParent(request, null, async ({ db }) => {
    const { data, error } = await db
      .from("courses")
      .select(full ? "id, topic, style, level, result, created_at, lesson" : "id, topic, style, level, result, created_at")
      .eq("child_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  });
}

export async function POST(request: Request, ctx: RouteContext<"/api/children/[id]/courses">) {
  const { id } = await ctx.params;
  return withParent(request, NewCourseSchema, async ({ db }, { lesson, result }) => {
    const { data, error } = await db
      .from("courses")
      .insert({ child_id: id, topic: lesson.topic, style: lesson.style, level: lesson.level, lesson, result: result ?? null })
      .select("id, topic, style, level, result, created_at")
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  });
}
