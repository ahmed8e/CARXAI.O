import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { motion } from 'framer-motion'

import {
  siBmw,
  siAudi,
  siVolkswagen,
  siToyota,
  siFord,
  siHyundai,
  siKia,
  siRenault,
  siPeugeot,
  siNissan,
  siDacia,
  siVolvo,
  siFiat,
  siSkoda,
  siSeat,
  siOpel,
  siCitroen,
} from 'simple-icons'

// ── Brand registry ────────────────────────────────────────────────────────

type Brand = {
  id: string
  label: string
  path: string
  color: string   // Official brand hex color
  scale?: number
}

const BRANDS: Brand[] = [
  { id: 'bmw',     label: 'BMW',        path: siBmw.path,        color: '#0066B1', scale: 1.05 },
  { id: 'audi',    label: 'Audi',       path: siAudi.path,       color: '#BB0A30', scale: 1.1  },
  { id: 'vw',      label: 'Volkswagen', path: siVolkswagen.path, color: '#151F5D', scale: 1.0  },
  { id: 'toyota',  label: 'Toyota',     path: siToyota.path,     color: '#EB0A1E', scale: 1.0  },
  { id: 'ford',    label: 'Ford',       path: siFord.path,       color: '#003478', scale: 1.0  },
  { id: 'hyundai', label: 'Hyundai',    path: siHyundai.path,    color: '#002C5E', scale: 1.1  },
  { id: 'kia',     label: 'Kia',        path: siKia.path,        color: '#05141F', scale: 0.95 },
  { id: 'renault', label: 'Renault',    path: siRenault.path,    color: '#FFCC33', scale: 0.95 },
  { id: 'peugeot', label: 'Peugeot',    path: siPeugeot.path,    color: '#1a1a1a', scale: 1.0  },
  { id: 'nissan',  label: 'Nissan',     path: siNissan.path,     color: '#C3002F', scale: 1.0  },
  { id: 'dacia',   label: 'Dacia',      path: siDacia.path,      color: '#646B52', scale: 1.0  },
  { id: 'volvo',   label: 'Volvo',      path: siVolvo.path,      color: '#003057', scale: 1.0  },
  { id: 'fiat',    label: 'Fiat',       path: siFiat.path,       color: '#941711', scale: 1.0  },
  { id: 'skoda',   label: 'Škoda',      path: siSkoda.path,      color: '#0E3A2F', scale: 1.0  },
  { id: 'seat',    label: 'SEAT',       path: siSeat.path,       color: '#33302E', scale: 1.0  },
  { id: 'opel',    label: 'Opel',       path: siOpel.path,       color: '#929292', scale: 1.0  },
  { id: 'citroen', label: 'Citroën',    path: siCitroen.path,    color: '#DA291C', scale: 1.0  },
]

const BASE_SIZE = 34

function BrandLogo({ id, label, path, color, scale = 1 }: Brand) {
  const size = Math.round(BASE_SIZE * scale)
  return (
    <div
      key={id}
      title={label}
      aria-label={label}
      className="
        flex-shrink-0 flex items-center justify-center
        opacity-[0.85] hover:opacity-100
        transition-all duration-500 ease-out
        cursor-default select-none
        hover:scale-110
      "
      style={{ width: size, height: size }}
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        fill={color}
        width={size}
        height={size}
        aria-label={label}
      >
        <path d={path} />
      </svg>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────

export function BrandSlider() {
  return (
    <section
      className="relative w-full py-20 md:py-28 overflow-hidden"
      style={{
        // Matches the "slate-50/60 backdrop-blur" sections in Landing.tsx
        background: 'linear-gradient(180deg, rgba(248,250,252,0.7) 0%, rgba(255,255,255,0.9) 50%, rgba(248,250,252,0.7) 100%)',
        borderTop: '1px solid rgba(226,232,240,0.8)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
      }}
    >
      {/* ── Soft background glow — CarxAI blue, very subtle ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="w-[900px] h-[500px] rounded-full opacity-[0.045] blur-[80px]"
          style={{ background: 'radial-gradient(ellipse at center, #0070E0, transparent 70%)' }}
        />
      </div>

      {/* ── Optional faint blueprint dot grid — very light ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0070E0 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Heading ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge — identical style to Landing.tsx section badges */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(0,112,224,0.06)', border: '1px solid rgba(0,112,224,0.12)' }}
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#0070E0] font-black">
              Trust &amp; Compatibility
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-[#0F172A] mb-5 tracking-tight">
            Compatible with the vehicles{' '}
            <br className="hidden md:block" />
            <span className="text-[#0070E0]">people rely&nbsp;on</span>
          </h2>

          <p className="text-[#64748B] text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            CarxAI delivers expert diagnostics across every major automotive
            brand — from everyday city cars to premium series.
          </p>
        </motion.div>
      </div>

      {/* ── Logo cloud slider ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full z-10"
      >
        {/* Inner separator lines — hairline, matching Landing card borders */}
        <div style={{ borderTop: '1px solid rgba(0,112,224,0.07)' }} />

        <div
          className="relative py-6 md:py-8"
          style={{ background: 'linear-gradient(90deg, rgba(248,250,252,0.9), rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, rgba(248,250,252,0.9))' }}
        >
          <InfiniteSlider
            gap={48}
            duration={50}
            durationOnHover={180}
            className="flex items-center"
          >
            {BRANDS.map((brand) => (
              <BrandLogo key={brand.id} {...brand} />
            ))}
          </InfiniteSlider>

          {/* Fade edges — significantly narrower on mobile to preserve central clarity */}
          <ProgressiveBlur
            blurIntensity={1.4}
            className="pointer-events-none absolute top-0 left-0 h-full w-[40px] md:w-[180px] z-10"
            direction="left"
          />
          <ProgressiveBlur
            blurIntensity={1.4}
            className="pointer-events-none absolute top-0 right-0 h-full w-[40px] md:w-[180px] z-10"
            direction="right"
          />
        </div>

        <div style={{ borderBottom: '1px solid rgba(0,112,224,0.07)' }} />
      </motion.div>
    </section>
  )
}
