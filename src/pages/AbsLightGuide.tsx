import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GuideLayout from '../components/GuideLayout';
import { 
  AlertCircle, 
  Droplets, 
  ChevronRight, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Settings, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { ScrollProgress } from '../components/ui/scroll-progress-1';
import AuthorBox from '../components/ui/AuthorBox';
import TechnicalCallout from '../components/ui/TechnicalCallout';

const AbsLightGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('what-it-means');

  // Simple intersection observer for TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const tocItems = [
    { id: 'what-it-means', label: 'Definition & Meaning' },
    { id: 'common-causes', label: 'Common Failure Points' },
    { id: 'safety-assessment', label: 'Safety Assessment' },
    { id: 'quick-diagnosis', label: 'Quick Diagnosis' },
    { id: 'repair-economics', label: 'Repair Economics' },
    { id: 'technical-faq', label: 'Diagnostic FAQ' },
    { id: 'final-protocol', label: 'Final Protocol' }
  ];

  return (
    <GuideLayout 
      title="ABS Light: Definition, Causes, and Diagnostic Protocol" 
      metaTitle="ABS Light On: Causes, Safety, and Fixes | Carsafety Authority Guide"
      description="Technical analysis of the Anti-lock Braking System (ABS) warning light. Understand sensor data, mechanical failures, and safety protocols."
      variant="technical"
    >
      <ScrollProgress variant="solid" size="xs" glow="none" />
      
      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What does ABS light mean in a car?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The ABS light means there is an issue with the Anti-lock Braking System. It indicates that the ABS feature may be disabled, which can reduce braking safety in emergency or slippery conditions."
              }
            },
            {
              "@type": "Question",
              "name": "Why is my ABS light on?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Your ABS light can turn on due to a faulty wheel speed sensor, low brake fluid, a blown fuse, a damaged ABS module, or issues with the tone ring near the wheels."
              }
            },
            {
              "@type": "Question",
              "name": "Is it safe to drive with the ABS light on?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can still drive with the ABS light on, but it is not fully safe. Normal brakes work, but the anti-lock braking system will not activate during emergency braking or slippery road conditions."
              }
            },
            {
              "@type": "Question",
              "name": "How do I fix an ABS light?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Fixing an ABS light depends on the cause. It may require cleaning or replacing a wheel speed sensor, refilling brake fluid, replacing a fuse, or diagnosing the ABS module with a professional scanner."
              }
            },
            {
              "@type": "Question",
              "name": "How much does it cost to repair ABS light issues?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ABS repair costs vary depending on the issue. Sensors and fuses are usually cheap, while ABS modules and wiring repairs can be more expensive. A diagnostic scan is recommended first to identify the exact problem."
              }
            }
          ]
        })}
      </script>
      
      <div className="max-w-[1440px] mx-auto pt-10 md:pt-16">
        
        {/* Header Section */}
        <header className="max-w-4xl mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
            ABS Light: Definition, Causes, and Diagnostic Protocol
          </h1>
          <div className="relative border border-slate-100 shadow-sm rounded-sm overflow-hidden bg-slate-50 mt-12 mb-16">
            <img 
              src="/symptoms/ABS light is on.webp" 
              alt="Active ABS warning light indicator on modern vehicle dash"
              className="w-full h-auto max-h-[500px] object-cover"
            />
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">
              Live Diagnostic: System Warning
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 md:gap-24">
          
          {/* Main Column */}
          <article className="min-w-0">
            
            {/* Introduction */}
            <div className="space-y-8 text-xl text-slate-600 leading-relaxed font-medium mb-16 max-w-4xl">
              <p>When the ABS warning light illuminates on the instrumentation panel, it indicates a system-level fault detected by the Electronic Control Unit (ECU). Ignoring this signal compromises the vehicle's dynamic stability during high-load deceleration events.</p>
              <p>While the internal fault may range from a simple obstructed magnetic sensor to a complete hydraulic modulator failure, the implication remains constant: the vehicle's safety envelope has been reduced.</p>
              <p>The Anti-lock Braking System (ABS) is a closed-loop electronic system designed to prevent wheel lock-up by modulating hydraulic pressure. Understanding the specific diagnostic codes and mechanical triggers is essential for maintaining operational safety.</p>
            </div>

            {/* Image 1: Technical View */}
            <div className="my-16 group">
              <div className="relative border border-slate-100 shadow-sm rounded-sm overflow-hidden bg-slate-50">
                <img 
                  src="/symptoms/abs light in car s.webp" 
                  alt="ABS sensor interface on the wheel assembly"
                  className="w-full h-auto grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                Fig 1.1: Wheel Speed Sensor Alignment on a Standard Hub Assembly
              </p>
            </div>

            {/* Section 1: Meaning */}
            <section id="what-it-means" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 01: System Status Definition
              </h2>
              <div className="space-y-8 text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                <p>An active ABS light signifies that the system has transitioned into a "Fail-Safe" mode. In this state, the dedicated processing unit has isolated the fault and disabled the pressure modulation circuitry to prevent unpredictable braking behavior.</p>
                
                <TechnicalCallout type="warning" title="Operational Impact">
                  The primary braking system remains functional via traditional hydraulic application. However, the <strong>dynamic steering control</strong> during emergency maneuvers is entirely negated.
                </TechnicalCallout>

                <p>Transition to Fail-Safe mode typically involves:</p>
                <ul className="grid gap-6">
                  {[
                    "Complete bypass of the hydraulic control valves",
                    "Disabling the ABS return pump",
                    "Isolation of electronic sensor feedback loops"
                  ].map((point, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <div className="mt-2 w-1.5 h-1.5 bg-slate-900 shrink-0" />
                      <span className="font-bold text-slate-800">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section 2: Causes */}
            <section id="common-causes" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 02: Critical Failure Points
              </h2>
              <div className="space-y-12 text-lg text-slate-600">
                
                <div className="p-1 border-b border-slate-50 pb-12">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-navy" /> 2.1 Wheel Speed Sensor Degradation
                  </h3>
                  <p className="font-medium leading-relaxed">The most frequent failure point is the wheel speed sensor. These components operate in extreme environments close to the asphalt, making them susceptible to magnetic interference, debris accumulation, and thermal stress.</p>
                  <p className="mt-4 text-sm text-slate-400 font-bold uppercase tracking-widest italic">Common triggers: Environmental debris, fractured wiring harnesses, oxidized connectors.</p>
                </div>

                <div className="p-1 border-b border-slate-50 pb-12">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-navy" /> 2.2 Hydraulic Fluid Pressure Imbalance
                  </h3>
                  <p className="font-medium leading-relaxed">Brake fluid acts as the force-transfer medium. If the fluid level drops below the critical threshold or contains air pockets, the ABS pump cannot maintain the required pressure pulses for anti-lock activation.</p>
                  <TechnicalCallout type="tip" title="Immediate Action">
                    Verify the reservoir level immediately. A drop in fluid often indicates significant pad wear or a breach in the hydraulic lines.
                  </TechnicalCallout>
                </div>

                {/* Middle Image */}
                <div className="my-16">
                  <div className="border border-slate-100 shadow-sm rounded-sm overflow-hidden">
                    <img 
                      src="/symptoms/abs light in car 3.webp" 
                      alt="Technician monitoring hydraulic reservoir levels"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="p-1 border-b border-slate-50 pb-12">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-navy" /> 2.3 ABS Control Module Failure
                  </h3>
                  <p className="font-medium leading-relaxed">The Electronic Control Module serves as the brain of the system. Internal board failure, usually due to heat soak or voltage spikes, requires a module reset or complete hardware replacement.</p>
                </div>

                <div className="p-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-navy" /> 2.4 Diagnostic Trouble Codes (DTCs)
                  </h3>
                  <p className="font-medium leading-relaxed italic text-slate-500 underline decoration-slate-200 underline-offset-4">Reference codes: C0035, C0040, C0550, C1214. These codes pinpoint specific circuitry faults during an OBD-II scan.</p>
                </div>
              </div>
            </section>

            {/* Section 3: Safety */}
            <section id="safety-assessment" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 03: Safety Protocol & Compliance
              </h2>
              <div className="bg-slate-900 text-white p-12 rounded-lg space-y-8">
                <div className="flex items-center gap-4 text-red-400">
                  <AlertCircle size={32} />
                  <span className="text-2xl font-black uppercase tracking-tight">Risk Assessment: MODERATE-HIGH</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest">Mechanical Status</h4>
                    <ul className="space-y-3 font-bold group">
                      <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-400" /> Standard hydraulic braking active</li>
                      <li className="flex items-center gap-3 opacity-50"><CheckCircle2 size={16} /> EBD (Electronic Brakeforce Distribution)</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Risks</h4>
                    <ul className="space-y-3 font-bold text-red-300">
                      <li className="flex items-center gap-3">• Zero traction modulation on ice/wet surfaces</li>
                      <li className="flex items-center gap-3">• Extended stopping distance (15-25% increase)</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm font-medium leading-relaxed italic pt-8 border-t border-white/10">
                  Recommendation: Drive with maximum alert levels. Avoid high-speed cornering and utilize engine braking where possible until a professional diagnostic reset is performed.
                </p>
              </div>
            </section>

            {/* Section 4: Quick Checks */}
            <section id="quick-diagnosis" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 04: Preliminary Field Diagnosis
              </h2>
              <div className="grid md:grid-cols-2 gap-10">
                 {[
                   { label: "Brake Fluid Inspection", desc: "Check reservoir for sediment or low levels." },
                   { label: "Sensor Harness Integrity", desc: "Visually inspect cables for fraying or melted shielding." },
                   { label: "Fuse Box Continuity", desc: "Verify 10A/20A ABS fuses are intact." },
                   { label: "Exciter Ring Status", desc: "Check wheel hubs for cracked magnetic tone rings." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-6 items-start p-6 border border-slate-100 rounded-lg bg-slate-50/50">
                     <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1 shrink-0">0{i+1}</div>
                     <div>
                       <h5 className="text-slate-900 font-black text-sm uppercase tracking-tight mb-2">{item.label}</h5>
                       <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </section>

            {/* Section 5: Repairs */}
            <section id="repair-economics" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 05: Repair Economics and Logistics
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Component</th>
                      <th className="py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Labor Estimate</th>
                      <th className="py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Complexity</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Relative Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 font-medium">
                    <tr className="border-b border-slate-100">
                      <td className="py-6 font-bold text-slate-900">Wheel Speed Sensor</td>
                      <td className="py-6">1.0 hrs</td>
                      <td className="py-6">Low</td>
                      <td className="py-6 text-right">$</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-6 font-bold text-slate-900">ABS Harness Repair</td>
                      <td className="py-6">1.5 hrs</td>
                      <td className="py-6">Medium</td>
                      <td className="py-6 text-right">$$</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-6 font-bold text-slate-900">ABS Control Module</td>
                      <td className="py-6">2.5 hrs</td>
                      <td className="py-6">High</td>
                      <td className="py-6 text-right">$$$</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Dashboard Image */}
            <div className="my-20">
              <div className="border border-slate-100 shadow-sm rounded-sm overflow-hidden">
                <img 
                  src="/symptoms/abs light in car 2.webp" 
                  alt="Standard ABS warning lamp on generic instrumentation"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Section 6: FAQ */}
            <section id="technical-faq" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 06: Technical Diagnostic FAQ
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "What does ABS light mean in a car?",
                    a: "The ABS light means there is an issue with the Anti-lock Braking System. It indicates that the ABS feature may be disabled, which can reduce braking safety in emergency or slippery conditions."
                  },
                  {
                    q: "Why is my ABS light on?",
                    a: "Your ABS light can turn on due to a faulty wheel speed sensor, low brake fluid, a blown fuse, a damaged ABS module, or issues with the tone ring near the wheels."
                  },
                  {
                    q: "Is it safe to drive with the ABS light on?",
                    a: "You can still drive with the ABS light on, but it is not fully safe. Normal brakes work, but the anti-lock braking system will not activate during emergency braking or slippery road conditions."
                  },
                  {
                    q: "How do I fix an ABS light?",
                    a: "Fixing an ABS light depends on the cause. It may require cleaning or replacing a wheel speed sensor, refilling brake fluid, replacing a fuse, or diagnosing the ABS module with a professional scanner."
                  },
                  {
                    q: "How much does it cost to repair ABS light issues?",
                    a: "ABS repair costs vary depending on the issue. Sensors and fuses are usually cheap, while ABS modules and wiring repairs can be more expensive. A diagnostic scan is recommended first to identify the exact problem."
                  }
                ].map((faq, i) => (
                  <div key={i} className="p-8 border border-slate-100 rounded-lg bg-white shadow-sm">
                    <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-navy shrink-0" />
                      {faq.q}
                    </h4>
                    <p className="text-slate-600 font-medium leading-relaxed pl-4.5">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 7: Protocol */}
            <section id="final-protocol" className="mb-24 scroll-mt-32">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100 uppercase tracking-tight">
                Section 07: Final Internal Protocol
              </h2>
              <div className="space-y-8 text-lg font-medium text-slate-600 leading-relaxed">
                <p>The ABS light is technically an indicator of <strong>Braking Loss Protection</strong>. While your primary mechanical brakes operate via pedal pressure, the computerized safety buffer has been nullified.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Cease high-speed operations until scoped",
                    "Conduct brake fluid level verification",
                    "Schedule electronic module diagnostic",
                    "Prepare for sensor calibration"
                  ].map((step, i) => (
                    <div key={i} className="p-6 border border-slate-100 rounded bg-white flex items-center gap-4 group hover:bg-navy transition-colors cursor-default">
                       <ArrowRight size={16} className="text-navy group-hover:text-white" />
                       <span className="text-slate-900 font-bold group-hover:text-white">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Final Image */}
            <div className="my-20">
              <div className="border border-slate-100 shadow-sm rounded-sm overflow-hidden">
                <img 
                  src="/symptoms/abs light in car e.webp" 
                  alt="Diagnostic verification of wheel assembly"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Author Box */}
            <AuthorBox />

          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-12">
              
              {/* Quick Navigation */}
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 pb-4 border-b border-slate-100">
                  Quick Navigation
                </h5>
                <nav className="flex flex-col gap-4">
                  {tocItems.map((item) => (
                    <a 
                      key={item.id} 
                      href={`#${item.id}`}
                      className={`text-sm font-bold transition-all border-l-2 pl-4 py-1 flex items-center group ${
                        activeTab === item.id 
                          ? 'border-navy text-navy font-black' 
                          : 'border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                      {activeTab === item.id && <Zap size={10} className="ml-2 fill-navy" />}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Technical CTA Card */}
              <div className="p-8 rounded-lg bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded bg-navy/20 flex items-center justify-center mb-6 border border-navy/30">
                    <Activity className="w-6 h-6 text-navy" />
                  </div>
                  <h4 className="text-xl font-black leading-tight mb-4">Precision Diagnostic Tool</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                    Narrow down failure points via AI-driven sensor analysis. Input your fault signatures for an immediate verification plan.
                  </p>
                  <button className="w-full py-4 bg-navy text-white font-black text-xs uppercase tracking-widest rounded hover:bg-navy-dark transition-colors flex items-center justify-center gap-2 group">
                    Start Internal Scan
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-navy/10 rounded-full blur-3xl" />
              </div>

            </div>
          </aside>

        </div>

        {/* Technical Index Section */}
        <section className="mt-40 pt-40 border-t border-slate-900">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
               <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                 Symptomatic Logic Index
               </h2>
               <p className="text-xl text-slate-500 font-medium leading-relaxed">
                 A database of secondary mechanical flags identified across varying vehicle architectures. Cross-reference your telemetry for higher accuracy.
               </p>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 flex items-center gap-4">
               <div className="w-12 h-px bg-slate-200" />
               Technical Library v4.2
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden rounded-sm">
            {[
              { id: '1', title: 'Engine Won\'t Crank', status: 'CRITICAL', icon: <Cpu />, slug: 'engine-wont-crank', category: 'starting-battery' },
              { id: '2', title: 'Low Oil Pressure', status: 'CRITICAL', icon: <Droplets />, slug: 'oil-light-in-car', category: 'warning-lights' },
              { id: '3', title: 'ABS Failure Pulse', status: 'COMMON', icon: <Activity />, slug: 'abs-light', category: 'warning-lights' },
              { id: '4', title: 'Braking Shudder', status: 'MECHANICAL', icon: <Settings />, slug: 'car-shakes-when-braking', category: 'braking-problems' }
            ].map((item) => (
              <Link 
                key={item.id} 
                to={`/guides/${item.category}/${item.slug}`}
                className="bg-white p-8 group hover:bg-slate-50 transition-colors cursor-pointer border-transparent hover:border-slate-200 block"
              >
                <div className="mb-8 flex justify-between items-start">
                  <div className="w-10 h-10 rounded-sm bg-slate-50 group-hover:bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-navy transition-all">
                    {item.icon}
                  </div>
                  <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border border-current ${
                    item.status === 'CRITICAL' ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-4 group-hover:text-navy transition-colors underline decoration-slate-100 underline-offset-8">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-colors">
                  Reference: {item.slug} <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </GuideLayout>
  );
};

export default AbsLightGuide;
