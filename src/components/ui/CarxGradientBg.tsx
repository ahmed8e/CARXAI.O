/**
 * CarxGradientBg — Premium atmospheric background for the Carsafety landing page.
 *
 * Renders a fixed, full-viewport layer of soft radial blue glows that sit
 * behind all page content.  The effect is intentionally subtle so that
 * text, cards, and sections remain perfectly readable while the page feels
 * alive and premium.
 *
 * Usage:
 *   Place once at the top of the page wrapper, before all section content:
 *     <CarxGradientBg />
 */
export default function CarxGradientBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* ── Base wash — very faint warm-white to cool-white ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, #f1f7ff 100%)',
        }}
      />

      {/* ── Primary glow — top-center, wide ellipse ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: '140%',
          height: '60vh',
          background:
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,112,224,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Secondary glow — left accent, softer ── */}
      <div
        className="absolute"
        style={{
          top: '18vh',
          left: '-8%',
          width: '50%',
          height: '50vh',
          background:
            'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(0,91,181,0.045) 0%, transparent 70%)',
        }}
      />

      {/* ── Tertiary glow — right accent, very subtle ── */}
      <div
        className="absolute"
        style={{
          top: '30vh',
          right: '-6%',
          width: '45%',
          height: '45vh',
          background:
            'radial-gradient(ellipse 75% 55% at 80% 35%, rgba(0,112,224,0.035) 0%, transparent 70%)',
        }}
      />

      {/* ── Mid-page refresh — a second, softer pulse further down ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '90vh',
          width: '120%',
          height: '50vh',
          background:
            'radial-gradient(ellipse 65% 50% at 50% 0%, rgba(0,112,224,0.04) 0%, transparent 70%)',
        }}
      />

      {/* ── Dot grid — ultra-faint structural texture ── */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #0070E0 0.5px, transparent 0.5px)',
          backgroundSize: '52px 52px',
        }}
      />
    </div>
  );
}
