import { motion } from 'framer-motion'
import { Bot, ShieldAlert, CheckCircle2, ShieldCheck, Zap, ChevronRight, Heart, BadgeCheck } from 'lucide-react'
import { useStoryReactions } from '../hooks/useStoryReactions'
import { useTranslation } from 'react-i18next'

export interface TrustSectionProps {
  onStoryClick: () => void;
}

export default function TrustSection({ onStoryClick }: TrustSectionProps) {
  const { t } = useTranslation();
  const { totalEngaged, counts } = useStoryReactions('car safety-origin');

  return (
    <section className="relative py-24 md:py-36 bg-slate-50/60 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
      {/* ── Section Header ── */}
      <div className="max-w-6xl mx-auto px-6 mb-16 md:mb-20 text-center flex flex-col items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: 'rgba(0,112,224,0.06)', border: '1px solid rgba(0,112,224,0.12)' }}
        >
          <ShieldCheck className="w-3 h-3 text-[#0070E0]" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#0070E0] font-black">{t('landing.trust_section.badge')}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#0F172A]"
        >
          {t('landing.trust_section.title_part1')} <br className="md:hidden" />
          <span className="text-[#0070E0]">{t('landing.trust_section.title_part2')}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[#64748B] text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          {t('landing.trust_section.subtitle')}
        </motion.p>

        {/* Story Trigger & Social Proof */}
        <div className="flex flex-col items-center">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            onClick={onStoryClick}
            className="mt-10 group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white font-black text-sm transition-all duration-300"
            style={{
              border: '1px solid rgba(0,112,224,0.12)',
              color: '#0E3882',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Zap size={15} className="text-[#0070E0] shrink-0" fill="currentColor" />
            {t('landing.trust_section.story_cta')}
            <div className="w-px h-3 bg-slate-200 mx-1 group-hover:bg-[#0070E0]/30 transition-colors" />
            <ChevronRight size={14} className="text-[#0E3882]/40 group-hover:translate-x-1 group-hover:text-[#0070E0] transition-all" />
          </motion.button>

          {/* Premium Social Proof Strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-col items-center gap-5"
          >
            <p
              className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-[0.3em] select-none"
              style={{ color: 'rgba(14,56,130,0.4)', letterSpacing: '0.3em' }}
            >
              <span
                className="block h-[1px] w-5"
                style={{ background: 'linear-gradient(to right, transparent, rgba(14,56,130,0.12))' }}
              />
              {t('landing.trust_section.social_proof_label')}
              <span
                className="block h-[1px] w-5"
                style={{ background: 'linear-gradient(to left, transparent, rgba(14,56,130,0.12))' }}
              />
            </p>

            <div className="flex items-center justify-center gap-2">
              {Object.entries(counts)
                .filter(([type, count]) => count > 0 && ['relate', 'respect', 'powerful'].includes(type))
                .sort((a, b) => b[1] - a[1])
                .map(([type, count], idx) => {
                  const Icon = type === 'relate' ? Heart : type === 'powerful' ? Zap : ShieldCheck;
                  const label = t(`landing.trust_section.reactions.${type}`);
                  const isTop = idx === 0;
                  const formatted = count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(count);

                  return (
                    <div
                      key={type}
                      className="group flex items-center gap-1.5 transition-all duration-500"
                      style={{
                        padding: '5px 12px 5px 10px',
                        borderRadius: '99px',
                        background: isTop ? 'rgba(0,112,224,0.05)' : 'rgba(248,250,252,0.8)',
                        border: isTop ? '1px solid rgba(0,112,224,0.14)' : '1px solid rgba(0,0,0,0.05)',
                        boxShadow: isTop
                          ? '0 1px 8px rgba(0,112,224,0.07), inset 0 1px 0 rgba(255,255,255,0.6)'
                          : '0 1px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Icon
                        size={10}
                        style={{ color: '#0070E0', flexShrink: 0 }}
                        fill={type === 'powerful' ? '#0070E0' : 'none'}
                        strokeWidth={2.2}
                      />
                      <span
                        className="whitespace-nowrap"
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: isTop ? '#0E3882' : '#475569',
                          letterSpacing: '-0.01em',
                          lineHeight: 1,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 500,
                          color: isTop ? 'rgba(14,56,130,0.45)' : '#94A3B8',
                          letterSpacing: '0.01em',
                          lineHeight: 1,
                          paddingLeft: '2px',
                        }}
                      >
                        {formatted}
                      </span>
                    </div>
                  );
                })}
            </div>

            {totalEngaged > 0 && (
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 450,
                  color: '#94A3B8',
                  letterSpacing: '0.04em',
                }}
              >
                {t('landing.trust_section.drivers_connected', { count: totalEngaged.toLocaleString() })}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Two-Column Content ── */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-start">

          {/* Left Column: Trust Value Propositions */}
          <div className="flex flex-col items-start text-left">
            <div className="space-y-6 md:space-y-8">
              {[
                {
                  icon: Bot,
                  title: t('landing.trust_section.points.p1.title'),
                  desc: t('landing.trust_section.points.p1.desc'),
                },
                {
                  icon: ShieldAlert,
                  title: t('landing.trust_section.points.p2.title'),
                  desc: t('landing.trust_section.points.p2.desc'),
                },
                {
                  icon: CheckCircle2,
                  title: t('landing.trust_section.points.p3.title'),
                  desc: t('landing.trust_section.points.p3.desc'),
                },
              ].map((pt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 md:gap-5 group"
                >
                  <div
                    className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105"
                    style={{
                      background: 'rgba(0,112,224,0.06)',
                      border: '1px solid rgba(0,112,224,0.10)',
                    }}
                  >
                    <pt.icon className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#0070E0]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] md:text-[17px] font-black text-[#0F172A] mb-1 tracking-tight">{pt.title}</h3>
                    <p className="text-[#64748B] font-medium text-[13px] md:text-[14.5px] leading-relaxed">{pt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Expert Profile Card */}
          <div className="relative mt-4 md:mt-0">
            {/* Ambient glow behind card */}
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ background: 'rgba(0,112,224,0.10)' }} />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: 'rgba(0,91,181,0.08)' }} />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden"
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(165deg, #ffffff 0%, #f8fbff 100%)',
                border: '1px solid rgba(0,112,224,0.10)',
                boxShadow: '0 0 0 1px rgba(0,112,224,0.04), 0 24px 60px -16px rgba(0,80,196,0.14), 0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* Top shimmer */}
              <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,112,224,0.20), transparent)' }} />

              <div className="p-6 md:p-8">
                {/* Profile Header */}
                <div className="flex flex-row items-center gap-4 md:gap-5 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(0,112,224,0.08)' }}>
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#0070E0] rounded-full blur-[12px] opacity-20" />
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[2.5px] border-white relative z-10 overflow-hidden"
                      style={{ boxShadow: '0 0 0 3px rgba(0,112,224,0.08), 0 6px 20px rgba(0,80,196,0.16)' }}
                    >
                      <img
                        src="/lukas_mechanic_avatar.jpg"
                        alt="Lukas Schneider"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white flex items-center justify-center z-20"
                      style={{ background: 'linear-gradient(135deg, #0070E0, #005BB5)', boxShadow: '0 2px 8px rgba(0,112,224,0.3)' }}
                    >
                      <BadgeCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                    </div>
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.14em] mb-1.5"
                      style={{ background: 'linear-gradient(135deg, #0070E0, #005BB5)', boxShadow: '0 2px 8px rgba(0,112,224,0.2)' }}
                    >
                      {t('landing.trust_section.expert.role')}
                    </div>
                    <div className="text-lg md:text-xl font-display font-black text-[#0F172A] tracking-tight leading-none mb-1">{t('landing.trust_section.expert.name')}</div>
                    <p className="text-[#0070E0] font-bold uppercase tracking-[0.12em] text-[9px] md:text-[10px]">{t('landing.trust_section.expert.title')}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: t('landing.trust_section.expert.stats.exp_label'), value: t('landing.trust_section.expert.stats.exp_value') },
                    { label: t('landing.trust_section.expert.stats.cases_label'), value: t('landing.trust_section.expert.stats.cases_value') }
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="relative overflow-hidden p-3.5 md:p-4 rounded-2xl"
                      style={{
                        background: 'rgba(0,112,224,0.04)',
                        border: '1px solid rgba(0,112,224,0.08)',
                      }}
                    >
                      <p className="text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-[#64748B] font-black mb-1">{label}</p>
                      <p className="text-lg md:text-xl font-black text-[#0E3882]">{value}</p>
                    </div>
                  ))}
                </div>
                {/* Specialties */}
                <div className="space-y-4 text-left">
                  <div>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-[#64748B] font-black mb-2.5">{t('landing.trust_section.expert.specialties_label')}</p>
                    <div className="flex flex-wrap gap-2">
                      {[t('landing.trust_section.expert.specialties.s1'), t('landing.trust_section.expert.specialties.s2')].map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl text-[10px] md:text-[11px] font-bold whitespace-nowrap"
                          style={{
                            background: 'rgba(0,112,224,0.05)',
                            border: '1px solid rgba(0,112,224,0.12)',
                            color: '#0E3882',
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
 
                  <blockquote
                    className="pl-4 text-[12.5px] md:text-[13px] text-[#64748B] font-medium leading-relaxed italic"
                    style={{ borderLeft: '2px solid rgba(0,112,224,0.18)' }}
                  >
                    "{t('landing.trust_section.expert.quote')}"
                  </blockquote>
                </div>
              </div>
            </motion.div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute -top-3 -left-3 md:-top-4 md:-left-4 z-20"
            >
              <div
                className="px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, #0070E0 0%, #005BB5 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 24px rgba(0,112,224,0.30), 0 1px 0 rgba(255,255,255,0.12) inset',
                }}
              >
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-[8px] md:text-[9px] leading-tight uppercase tracking-wider">{t('landing.trust_section.expert.verified_badge')}</p>
                  <p className="text-white/50 text-[7px] md:text-[8px] font-bold uppercase tracking-wider">{t('landing.trust_section.expert.engine_label')}</p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
