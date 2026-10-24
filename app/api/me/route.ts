import { withParent } from "@/lib/auth";

// The signed-in parent and their children (with engine profiles), to hydrate the app after login.
export async function GET(request: Request) {
  return withParent(request, null, async ({ user, db }) => {
    const { data, error } = await db
      .from("children")
      .select("id, name, age, profile, updated_at")
      .order("created_at");
    if (error) throw error;
    return { user: { id: user.id, email: user.email }, children: data };
  });
}
