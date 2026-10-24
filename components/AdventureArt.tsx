import type { AdventureId } from "@/lib/adventures";

export function Icon({
  name,
  size = 22,
}: {
  name:
    | "arrow"
    | "back"
    | "book"
    | "sound"
    | "stop"
    | "star"
    | "check"
    | "help"
    | "pause"
    | "spark"
    | "settings"
    | "clock"
    | "mic"
    | "home"
    | "family"
    | "close"
    | "camera";
  size?: number;
}) {
  const paths: Record<typeof name, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    book: (
      <>
        <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z" />
        <path d="M12 6v14" />
      </>
    ),
    sound: (
      <>
        <path d="m11 5-6 4H2v6h3l6 4V5Z" />
        <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    star: (
      <path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" fill="currentColor" />
        <circle cx="15" cy="17" r="3" fill="currentColor" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0m-7 7v4m-4 0h8" />
      </>
    ),
    home: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />,
    family: (
      <>
        <circle cx="8" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 20a5.5 5.5 0 0 1 11 0M13 20a4.2 4.2 0 0 1 8.5 0" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    camera: (
      <>
        <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// Local vector illustrations: no provider calls, decorative text or external assets.
export function AdventureArt({
  subject,
  detail = 0,
}: {
  subject?: AdventureId;
  detail?: number;
}) {
  return (
    <svg
      className="adventure-art"
      viewBox="0 0 320 190"
      fill="none"
      aria-hidden="true"
    >
      {subject === "dinosaurs" ? (
        <>
          <circle cx="239" cy="46" r="24" fill="#F7CD78" />
          <path
            d="M10 152c46-17 65-2 102-9 55-10 94-1 125 3s55-6 83-4v48H0Z"
            fill="#BDD2AD"
          />
          <path
            d="M44 145c-8-18-5-43 2-55 7 15 12 24 9 42 10-14 20-17 30-17-7 19-20 28-41 30Z"
            fill="#719D6E"
          />
          <path
            d="M258 150c-1-24 3-42 16-61 3 22 1 35-9 49 12-8 23-10 36-8-12 15-25 21-43 20Z"
            fill="#719D6E"
          />
          {detail === 4 ? (
            <g stroke="#6D8067" strokeWidth="9" strokeLinecap="round">
              <path d="M108 132h104m-83-27 15 26-8 23m34-49-9 27 15 20m-31-65v44m-25-1-22-25" />
              <circle cx="195" cy="95" r="22" fill="#F7F1D9" />
              <path d="M183 93h1m15 0h1" strokeWidth="5" />
            </g>
          ) : detail === 1 || detail === 2 ? (
            <>
              <path d="M135 137c-35 5-53-4-68-21 1 26 27 41 57 37l-8 15h28l11-21 17-2 12 23h27l-17-34c13-18 13-35 8-56-8-16-32-19-48-5l-4 36c-5 6-10 17-15 28Z" fill="#78A47B" />
              <path d="M170 61c-1-21 13-33 34-31 24 2 38 13 38 32-15 6-29 7-46 3l-7 26-24-9Z" fill="#78A47B" />
              <path d="M198 61h36l-6 8h-20Z" fill="#F8F1D6" />
              <circle cx="220" cy="44" r="3.5" fill="#294934" />
              <path d="m181 98 11 12 12-1" stroke="#507C52" strokeWidth="7" strokeLinecap="round" />
              <path d="M151 122c9 2 15-4 18-15" stroke="#AFCAA0" strokeWidth="9" strokeLinecap="round" />
              {detail === 2 && <g stroke="#F6EBD4" strokeWidth="6" strokeLinecap="round"><path d="m235 139 20 12m-22-15 3 9m17 1 2 9" /></g>}
            </>
          ) : (
            <>
              <path
                d="M104 128c-28 2-38-13-47-13 5 23 22 36 48 37v12h18v-15h48v15h18v-26c13-10 16-29 14-48l-2-32h-28l-6 54c-20-16-52-13-63 16Z"
                fill="#70A882"
              />
              <path
                d="M175 57c0-17 12-24 26-22 19 2 27 17 18 30-8 12-31 12-44 3Z"
                fill="#70A882"
              />
              <path
                d="m125 105 7-12 11 11m7-1 8-12 9 15m5-23 11-9 3 18"
                fill="#E7AC68"
              />
              <circle cx="205" cy="48" r="3.5" fill="#234538" />
              <path
                d="M207 63c3 2 6 1 9-1"
                stroke="#234538"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M120 135c17 8 32 7 47-2"
                stroke="#A9CBA6"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </>
          )}
        </>
      ) : subject === "planets" ? (
        <>
          <circle
            cx="159"
            cy="99"
            r="71"
            stroke="#B8B2D1"
            strokeDasharray="4 7"
          />
          <ellipse cx="159" cy="99" rx="135" ry="67" stroke="#B8B2D1" />
          <circle cx="155" cy="101" r="37" fill="#F1B65E" />
          <circle cx="146" cy="91" r="25" fill="#FFD689" />
          <circle cx="60" cy="62" r="20" fill="#7BAEBC" />
          <path d="M48 53c9-6 18 0 22 9-8-1-11 10-21 8" fill="#C6D3A7" />
          <circle cx="255" cy="131" r="26" fill="#B2A0C8" />
          <ellipse
            cx="255"
            cy="131"
            rx="43"
            ry="10"
            transform="rotate(-24 255 131)"
            stroke="#D2B083"
            strokeWidth="7"
          />
          <circle cx="216" cy="40" r="10" fill="#D39379" />
          <path d="m91 143 4 8 8 3-8 3-4 8-3-8-8-3 8-3Z" fill="#B4A0C8" />
          <circle cx="286" cy="53" r="3" fill="#B4A0C8" />
          <circle cx="35" cy="128" r="3" fill="#B4A0C8" />
        </>
      ) : subject === "ocean" ? (
        <>
          <path
            d="M0 45c29-20 52 20 80 0s52 20 80 0 52 20 80 0 53 20 80 0v145H0Z"
            fill="#CCE6E5"
          />
          <path
            d="M0 104c37-20 64 14 110 0s80 18 120 0 63 13 90 0v86H0Z"
            fill="#A5D4D2"
          />
          <path
            d="M96 116c15-30 52-49 87-42l22-16-1 29 20 9-24 8c-21 29-66 44-104 12Z"
            fill="#5B9FAB"
          />
          <path d="m124 89 4-26 25 15" fill="#5B9FAB" />
          <path d="m139 122 11 19 13-26" fill="#5B9FAB" />
          <circle cx="110" cy="111" r="3" fill="#224A58" />
          <path
            d="M106 122c10 4 15 2 21-1"
            stroke="#224A58"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M254 145c-8-14-24-14-35 0 11 14 27 14 35 0l13-10v20Z"
            fill="#F0B16D"
          />
          <circle cx="229" cy="143" r="2" fill="#724D3F" />
          <path
            d="M41 182c13-22 2-42 11-60m-3 30c-13-4-15-13-17-19m18 30c12-8 14-17 15-24"
            stroke="#5C9B8A"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="87" cy="58" r="5" stroke="#68A9B0" strokeWidth="2" />
          <circle cx="98" cy="37" r="3" stroke="#68A9B0" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="160" cy="95" r="72" fill="#DAE7C9" />
          <path
            d="M160 64c-22-15-49-15-74-7v86c25-8 52-8 74 7 22-15 49-15 74-7V57c-25-8-52-8-74 7Z"
            fill="#FFFEF6"
            stroke="#6A986C"
            strokeWidth="3"
          />
          <path
            d="M160 64v86m-54-69h30m-30 17h30m47-17h30m-30 17h30"
            stroke="#6A986C"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
