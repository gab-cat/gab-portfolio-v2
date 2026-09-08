export function StoryPortrait() {
  return (
    <figure className="story-photo">
      <svg
        viewBox="0 0 900 1100"
        className="story-portrait-crop"
        role="img"
        aria-label="Gabriel Catimbang in a charcoal halftone cutout portrait, with an orange dotted circle behind him"
      >
        <defs>
          {/* Use the original photograph for the matte so the print's pale
              dots stay opaque. Tone the visible print separately afterward. */}
          <filter
            id="portrait-background-matte"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.3333 -0.3333 -0.3333 0 1"
            />
            <feComponentTransfer>
              <feFuncA type="linear" slope="50" intercept="-1" />
            </feComponentTransfer>
          </filter>
          <filter id="portrait-soft-ink" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.025 0.17 0.34 0.53 0.73" />
              <feFuncG type="table" tableValues="0.025 0.17 0.34 0.53 0.74" />
              <feFuncB type="table" tableValues="0.025 0.16 0.32 0.51 0.70" />
            </feComponentTransfer>
          </filter>
          <mask
            id="story-portrait-silhouette"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="900"
            height="1200"
            style={{ maskType: "alpha" }}
          >
            <image
              href="/portraits/gab-editorial.webp"
              width="900"
              height="1200"
              filter="url(#portrait-background-matte)"
            />
          </mask>
          <pattern
            id="portrait-orange-dots"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-16)"
          >
            <circle cx="6" cy="6" r="3.8" fill="#ed4c21" />
          </pattern>
          <linearGradient id="portrait-dot-fade" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0.25" stopColor="white" />
            <stop offset="1" stopColor="#777" />
          </linearGradient>
          <mask id="portrait-dot-field">
            <rect width="900" height="1100" fill="url(#portrait-dot-fade)" />
          </mask>
        </defs>
        <circle
          cx="555"
          cy="660"
          r="390"
          fill="url(#portrait-orange-dots)"
          mask="url(#portrait-dot-field)"
        />
        <g mask="url(#story-portrait-silhouette)">
          <image
            href="/portraits/gab-halftone.webp"
            width="900"
            height="1200"
            filter="url(#portrait-soft-ink)"
          />
        </g>
      </svg>
    </figure>
  );
}
