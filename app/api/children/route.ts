import { withParent } from "@/lib/auth";
import { NewChildSchema } from "@/lib/account-schema";

export async function GET(request: Request) {
  return withParent(request, null, async ({ db }) => {
    const { data, error } = await db.from("children").select("id, name, age, profile, updated_at").order("created_at");
    if (error) throw error;
    return data;
  });
}

export async function POST(request: Request) {
  return withParent(request, NewChildSchema, async ({ db }, input) => {
    const { data, error } = await db
      .from("children")
      .insert({ name: input.name, age: input.age, profile: input.profile ?? {} })
      .select("id, name, age, profile, updated_at")
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  });
}
