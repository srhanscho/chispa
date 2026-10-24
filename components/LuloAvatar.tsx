"use client";

import Image from "next/image";
import type { LuloScene } from "@/lib/lulo";

export function LuloAvatar({ scene = "home", isSpeaking = false, size = 240 }: {
  scene?: LuloScene; isSpeaking?: boolean; size?: number;
}) {
  return (
    <div className={`lulo-avatar lulo-${scene}`} data-scene={scene} data-speaking={isSpeaking} style={{ width: size }}>
      <Image src="/assets/lulo/lulo_referencia_original.png" alt="Lulo, tu iguana exploradora con sombrero vueltiao, mochila y libro azul" width={1122} height={1402} sizes="(max-width: 640px) 190px, 320px" loading="eager" className="h-auto w-full rounded-3xl" />
      {isSpeaking && <span className="voice-indicator" role="status">♪ Leyendo contigo</span>}
      {scene === "reward" && <span className="lulo-stars" aria-hidden="true">✦ ✧ ✦</span>}
    </div>
  );
}
