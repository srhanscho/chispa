import { z } from "zod";
import { accountFetch } from "./supabase-browser";
import { CourseSummarySchema, SessionResultSchema } from "./account-schema";
import { LessonSchema, type Lesson } from "./schema";
import { readStored, storeLocal } from "./journey";
import type { LearnerProfile, SessionLog } from "./engine";
import { profilePayload } from "./learner-ui";

export const CourseSchema = CourseSummarySchema.extend({
  lesson: LessonSchema,
});
export type Course = z.infer<typeof CourseSchema>;
export const localCoursesKey = (id: string) => `chispa:courses:${id}`;
export async function loadCourses(
  id: string,
  cloud: boolean,
): Promise<Course[]> {
  return cloud
    ? z
        .array(CourseSchema)
        .parse(
          await accountFetch(
            `/api/children/${encodeURIComponent(id)}/courses?full=1`,
          ),
        )
    : readStored(localCoursesKey(id), z.array(CourseSchema), []);
}
export async function saveCourse(
  profile: LearnerProfile,
  lesson: Lesson,
  cloud: boolean,
): Promise<string> {
  if (cloud) {
    const saved = CourseSummarySchema.parse(
      await accountFetch(
        `/api/children/${encodeURIComponent(profile.id)}/courses`,
        { method: "POST", body: JSON.stringify({ lesson }) },
      ),
    );
    return saved.id;
  }
  const id = crypto.randomUUID();
  const course: Course = {
    id,
    topic: lesson.topic,
    style: lesson.style,
    level: lesson.level,
    result: null,
    created_at: new Date().toISOString(),
    lesson,
  };
  const previous = await loadCourses(profile.id, false);
  storeLocal(localCoursesKey(profile.id), [course, ...previous].slice(0, 50));
  return id;
}
export async function finishCourse(
  id: string | undefined,
  profile: LearnerProfile,
  session: SessionLog,
  cloud: boolean,
) {
  const result = SessionResultSchema.parse(session);
  if (cloud) {
    if (id)
      await accountFetch(`/api/courses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ result }),
      });
    await accountFetch(`/api/children/${encodeURIComponent(profile.id)}`, {
      method: "PATCH",
      body: JSON.stringify(profilePayload(profile)),
    });
  } else if (id) {
    const courses = await loadCourses(profile.id, false);
    storeLocal(
      localCoursesKey(profile.id),
      courses.map((course) =>
        course.id === id ? { ...course, result } : course,
      ),
    );
  }
}
