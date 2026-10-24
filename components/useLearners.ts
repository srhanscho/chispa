"use client";

import { useEffect, useRef, useState } from "react";
import { createProfile, type LearnerProfile } from "@/lib/engine";
import { demoProfiles, loadProfiles, saveProfiles } from "@/lib/profile";
import {
  accountFetch,
  currentSession,
  loginEnabled,
  onSessionChange,
  signOut,
} from "@/lib/supabase-browser";
import {
  childProfile,
  MeSchema,
  profilePayload,
  type Child,
} from "@/lib/learner-ui";

export function useLearners() {
  const [profiles, setProfiles] = useState(demoProfiles);
  const [activeId, setActiveId] = useState("demo-sofia");
  const [children, setChildren] = useState<Child[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loginAvailable, setLoginAvailable] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const profilesRef = useRef(profiles);
  const cloudIds = useRef(new Set<string>());
  const accountEpoch = useRef(0);
  const accountUser = useRef<string | null>(null);

  function replaceProfiles(next: LearnerProfile[]) {
    profilesRef.current = next;
    setProfiles(next);
  }

  useEffect(() => {
    let live = true;
    const local = loadProfiles();
    const parsed = Array.isArray(local)
      ? local.flatMap((p) => {
          const result = MeSchema.shape.children.element.safeParse(
            p && { id: p.id, name: p.name, age: p.age, profile: { ...p } },
          );
          return result.success ? [childProfile(result.data)] : [];
        })
      : [];
    const safe = parsed.length ? parsed : demoProfiles();
    // Read the browser's stored profiles after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    replaceProfiles(safe);
    setLoginAvailable(loginEnabled());
    async function refresh(userId: string | null) {
      const epoch = ++accountEpoch.current;
      if (!live) return;
      const changedAccount = accountUser.current !== userId;
      accountUser.current = userId;
      setSignedIn(!!userId);
      if (changedAccount) {
        cloudIds.current.clear();
        setChildren([]);
        replaceProfiles(safe);
        setActiveId(safe[0].id);
      }
      if (!userId) {
        cloudIds.current.clear();
        setChildren([]);
        replaceProfiles(safe);
        setActiveId((previous) =>
          safe.some((entry) => entry.id === previous) ? previous : safe[0].id,
        );
        return;
      }
      try {
        const me = MeSchema.parse(await accountFetch("/api/me"));
        if (!live || epoch !== accountEpoch.current) return;
        setChildren(me.children);
        cloudIds.current = new Set(me.children.map((child) => child.id));
        if (me.children.length) {
          const next = me.children.map(childProfile);
          replaceProfiles(next);
          setActiveId((previous) =>
            next.some((entry) => entry.id === previous) ? previous : next[0].id,
          );
        }
        setAccountMessage(
          me.children.length
            ? "Sesión familiar conectada."
            : "Crea un perfil para guardar sus cursos. También puedes usar la demo.",
        );
      } catch {
        if (live && epoch === accountEpoch.current)
          setAccountMessage(
            "No pudimos cargar tu cuenta. Conservamos la demo disponible.",
          );
      }
    }
    void currentSession()
      .then((session) => {
        if (live) void refresh(session?.user.id ?? null);
      })
      .catch(() => {});
    const unsubscribe = onSessionChange((session) => {
      queueMicrotask(() => {
        if (live) void refresh(session?.user.id ?? null);
      });
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);

  const profile =
    profiles.find((entry) => entry.id === activeId) ?? profiles[0];
  function updateProfile(next: LearnerProfile) {
    if (!profilesRef.current.some((entry) => entry.id === next.id)) return;
    const all = profilesRef.current.map((entry) =>
      entry.id === next.id ? next : entry,
    );
    replaceProfiles(all);
    if (!cloudIds.current.has(next.id))
      saveProfiles(all.filter((entry) => !cloudIds.current.has(entry.id)));
  }
  async function addChild(name: string, age: number) {
    const initial = createProfile(name, age);
    const child = await accountFetch<Child>("/api/children", {
      method: "POST",
      body: JSON.stringify({
        name,
        age,
        profile: profilePayload(initial).profile,
      }),
    });
    const valid = MeSchema.shape.children.element.parse(child);
    const next = childProfile(valid);
    cloudIds.current.add(next.id);
    setChildren((all) => [...all, valid]);
    replaceProfiles([
      ...profilesRef.current.filter((entry) => cloudIds.current.has(entry.id)),
      next,
    ]);
    setActiveId(next.id);
  }
  return {
    profiles,
    profile,
    setActiveId,
    updateProfile,
    signedIn,
    loginAvailable,
    children,
    accountMessage,
    setAccountMessage,
    addChild,
    signOut,
    getProfile: (id: string) =>
      profilesRef.current.find((entry) => entry.id === id),
    isCloud: (id: string) => cloudIds.current.has(id),
  };
}
