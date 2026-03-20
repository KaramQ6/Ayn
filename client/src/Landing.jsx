import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, Satellite, ShieldCheck, Activity, Globe, Zap, Cpu, MapPin, Podcast, ArrowRight, Plus } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const { t } = useTranslation();
  const comp = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      
      // A. NAVBAR Background Transition
      ScrollTrigger.create({
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          if (self.progress > 0.1) {
            gsap.to(".navbar", { backgroundColor: "rgba(10, 20, 14, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(240, 239, 244, 0.1)", duration: 0.3 });
          } else {
            gsap.to(".navbar", { backgroundColor: "transparent", backdropFilter: "blur(0px)", borderBottom: "1px solid transparent", duration: 0.3 });
          }
        }
      });

      // B. HERO SECTION Staggered Entrance
      gsap.from(".hero-text", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      });

      // C. THE THREE PILLARS Entrance
      gsap.from(".pillar-card", {
        scrollTrigger: {
          trigger: ".pillars-section",
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });

      // C.1 Eliminated for visual redesign

      // D. PHILOSOPHY Parallax & Text Reveal
      gsap.to(".philosophy-bg", {
        scrollTrigger: {
          trigger: ".philosophy-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        },
        y: "20%",
        ease: "none"
      });

      gsap.from(".reveal-text", {
        scrollTrigger: {
          trigger: ".philosophy-section",
          start: "top 60%",
        },
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
      });

      // E. PROTOCOL Sticky Stacking Archive
      const protocolCards = gsap.utils.toArray(".protocol-card");
      protocolCards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          pin: true,
          pinSpacing: false,
          endTrigger: ".protocol-container",
          end: "bottom bottom",
        });
        
        if (i < protocolCards.length - 1) {
           gsap.to(card, {
             scale: 0.95 - (i * 0.02),
             opacity: 0.5,
             scrollTrigger: {
               trigger: card,
               start: "top top",
               end: "bottom top",
               scrub: true
             }
           });
        }
      });

      // F. IMPACT Fade Up
      gsap.from(".impact-item", {
        scrollTrigger: {
          trigger: ".impact-section",
          start: "top 75%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });

    }, comp);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={comp} className="bg-[var(--deep-forest)] font-sans text-[var(--ui-ghost)] selection:bg-[var(--alert-signal)] selection:text-white">
      
      {/* A. NAVBAR — "The Floating Island" */}
      <nav className="navbar fixed top-0 start-0 w-full z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="text-[var(--alert-signal)]" />
            <span className="font-bold text-xl tracking-tighter">{t('app.name')}</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-[var(--ui-ghost)]/70">
            <a href="#mission" aria-label={t('nav.mission')} className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus-ring rounded-md px-2 pointer-events-auto cursor-pointer">{t('nav.mission')}</a>
            <a href="#tech" aria-label={t('nav.tech')} className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus-ring rounded-md px-2 pointer-events-auto cursor-pointer">{t('nav.tech')}</a>
            <a href="#impact" aria-label={t('nav.impact')} className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus-ring rounded-md px-2 pointer-events-auto cursor-pointer">{t('nav.impact')}</a>
          </div>
          <Link to="/dashboard" aria-label={t('nav.accessDashboard')} className="flex items-center justify-center min-h-[44px] px-5 bg-[var(--alert-signal)] hover:bg-red-600 text-white rounded-full font-bold text-sm btn-magnetic focus-ring click-scale cursor-pointer">
            {t('nav.accessDashboard')}
          </Link>
        </div>
      </nav>

      {/* B. HERO SECTION — "The Opening Shot" */}
      <section className="hero-section relative min-h-[100dvh] flex flex-col justify-end pb-24 px-6 md:px-16 overflow-hidden">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2600&auto=format&fit=crop" 
            alt="" 
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.07] mix-blend-screen scale-110"
          />
          <img 
            src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2600&auto=format&fit=crop" 
            alt="" 
            aria-hidden="true"
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--deep-forest)] via-[var(--deep-forest)]/80 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl">
          <h2 className="hero-text text-xl md:text-3xl font-medium tracking-tight mb-2 text-[var(--ui-ghost)]/80">
            {t('hero.eyesInSky')}
          </h2>
          <h1 className="hero-text text-5xl md:text-8xl lg:text-9xl font-drama tracking-tight leading-[0.9] mb-8">
            {t('hero.voicesOn')} <br/>
            <span className="text-[var(--alert-signal)]">{t('hero.ground')}</span>
          </h1>
          <p className="hero-text font-data text-xs md:text-sm text-[var(--ui-ghost)]/60 max-w-xl leading-relaxed uppercase tracking-widest border-s-2 border-[var(--alert-signal)] ps-4">
            {t('hero.description')}
          </p>
        </div>
      </section>

      {/* C. THE THREE PILLARS — "Interactive Functional Artifacts" */}
      <section id="tech" className="pillars-section relative py-32 px-6 md:px-16 z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Cross-Validation Engine */}
          <div aria-label={t('pillars.crossValidation.title')} className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-ring hover-lift click-scale" tabIndex="0">
            <div className="flex justify-end mb-auto">
              <Cpu className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-end mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">{t('pillars.crossValidation.title')}</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">{t('pillars.crossValidation.subtitle')}</p>
            </div>
            
            <div className="mt-auto flex items-center justify-between font-data bg-black/30 p-4 rounded-xl">
              <div className="text-green-400 flex items-center gap-2 text-xs">
                {t('pillars.crossValidation.validated')} <ShieldCheck size={14} className="opacity-80" />
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center"><Podcast size={11} className="text-blue-500"/></div>
                <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center"><Satellite size={11} className="text-red-500"/></div>
              </div>
            </div>
          </div>

          {/* Card 2: Community Ground-Truth */}
          <div aria-label={t('pillars.community.title')} className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-ring hover-lift click-scale" tabIndex="0">
            <div className="flex justify-end mb-auto">
              <Podcast className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-end mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">{t('pillars.community.title')}</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">{t('pillars.community.subtitle')}</p>
            </div>
            
            <div className="mt-auto bg-black/30 p-4 pt-5 rounded-xl flex justify-between items-start h-[4.5rem] relative">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <div className="text-end font-data text-[10px] text-green-400 leading-tight">
                <p>{t('pillars.community.userReport')}</p>
                <p className="opacity-50 mt-1.5">{t('pillars.community.locating')}</p>
              </div>
              <div className="absolute bottom-2.5 end-4 w-6 h-3 bg-[#44554A] rounded-sm animate-pulse"></div>
            </div>
          </div>

          {/* Card 3: Satellite Telemetry */}
          <div aria-label={t('pillars.satellite.title')} className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-ring hover-lift click-scale" tabIndex="0">
            <div className="flex justify-end mb-auto">
              <Satellite className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-end mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">{t('pillars.satellite.title')}</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">{t('pillars.satellite.subtitle')}</p>
            </div>
            
            <div className="mt-auto bg-black/30 p-4 rounded-xl flex justify-between items-center h-[4.5rem]">
               <div className="w-0.5 h-full bg-blue-500/80 rounded-full"></div>
               <div className="text-[11px] font-data text-white/80 tracking-wide mt-1">{t('pillars.satellite.coordsScanned')}</div>
            </div>
          </div>
          
        </div>
      </section>

      {/* D. PHILOSOPHY — "The Manifesto" */}
      <section id="mission" className="philosophy-section relative py-40 overflow-hidden border-y border-white/5">
        <div className="absolute inset-0 z-0 opacity-10 philosophy-bg">
          <img 
            src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2600&auto=format&fit=crop" 
            alt="" 
            aria-hidden="true"
            className="w-full h-[150%] object-cover"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 text-center">
          <p className="reveal-text text-sm md:text-base text-white/50 font-data uppercase tracking-[0.2em] mb-8">
            {t('philosophy.problem')}
          </p>
          <h2 className="reveal-text text-4xl md:text-6xl lg:text-7xl font-drama leading-[1.1]">
            {t('philosophy.focusOn')} <br/>
            <span className="text-[var(--alert-signal)]">{t('philosophy.solution')}</span>
          </h2>
        </div>
      </section>

      {/* E. PROTOCOL — "Tactical Response" */}
      <section className="protocol-container relative pb-32 pt-20 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="text-center mb-24">
            <h2 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-white/90 uppercase mb-4">TACTICAL RESPONSE PROTOCOL</h2>
            <div className="h-0.5 w-16 bg-[var(--alert-signal)] mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* STEP 1: DETECT */}
            <div className="group bg-[#0A0A0A] border border-white/5 rounded-sm p-12 relative overflow-hidden transition-all duration-500 hover:border-white/10">
              <div className="absolute top-8 right-8 text-6xl font-black text-white/[0.03] select-none tracking-tighter">01</div>
              <div className="text-[var(--alert-signal)] mb-12">
                <Globe size={32} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-bold tracking-widest mb-6 text-white uppercase">STEP 1: DETECT</h3>
              <p className="text-[10px] text-white/30 leading-relaxed font-data uppercase tracking-[0.2em]">
                Ingesting NASA FIRMS VIIRS/MODIS thermal scans, OpenWeatherMap conditions & real-time weather data streams directly from orbit.
              </p>
            </div>

            {/* STEP 2: VERIFY */}
            <div className="group bg-[#0A0A0A] border border-white/5 rounded-sm p-12 relative overflow-hidden transition-all duration-500 hover:border-white/10">
              <div className="absolute top-8 right-8 text-6xl font-black text-white/[0.03] select-none tracking-tighter">02</div>
              <div className="text-[var(--alert-signal)] mb-12">
                <MapPin size={32} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-bold tracking-widest mb-6 text-white uppercase">STEP 2: VERIFY</h3>
              <p className="text-[10px] text-white/30 leading-relaxed font-data uppercase tracking-[0.2em]">
                The localized Telegram Bot aggregates and structures civilian reports instantly, layering human ground-truth over satellite anomalies.
              </p>
            </div>

            {/* STEP 3: ACT */}
            <div className="group bg-[#0A0A0A] border border-white/5 rounded-sm p-12 relative overflow-hidden transition-all duration-500 hover:border-white/10">
              <div className="absolute top-8 right-8 text-6xl font-black text-white/[0.03] select-none tracking-tighter">03</div>
              <div className="text-[var(--alert-signal)] mb-12">
                <Activity size={32} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-bold tracking-widest mb-6 text-white uppercase">STEP 3: ACT</h3>
              <p className="text-[10px] text-white/30 leading-relaxed font-data uppercase tracking-[0.2em] mb-12">
                The Node.js & React command center dispatches verified, high-confidence alerts to authorities minutes before standard APIs register the threat.
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--alert-signal)] text-[10px] font-bold tracking-[0.3em] uppercase hover:gap-4 transition-all group/btn">
                LAUNCH COMMAND CENTER <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* F. COMMUNITY & EXPLORE SECTION */}
      <section className="py-40 px-6 md:px-16 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 uppercase">JOIN THE COMMUNITY</h2>
            <p className="text-sm md:text-base text-white/30 max-w-2xl mx-auto font-data uppercase tracking-[0.2em]">{t('community.sectionDesc', 'Share experiences, ask questions about hiking trails, and discover the most famous forests in our region.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {[
              { icon: '❓', title: t('community.feature1Title', 'Ask Questions'), desc: t('community.feature1Desc', 'Get advice on hiking spots, camping areas, and trail conditions from the community.') },
              { icon: '⭐', title: t('community.feature2Title', 'Share Recommendations'), desc: t('community.feature2Desc', 'Post your favorite forest trails, campgrounds, and mountain experiences.') },
              { icon: '📷', title: t('community.feature3Title', 'Trip Reports'), desc: t('community.feature3Desc', 'Document your adventures with photos and detailed trip reports.') },
            ].map((feature, i) => (
              <div key={i} className="group bg-[#0A0A0A] p-12 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-500 text-center flex flex-col items-center">
                <h3 className="text-xs font-bold tracking-[0.3em] text-white/30 uppercase mb-10 group-hover:text-white/50 transition-colors">{feature.title}</h3>
                <div className="text-7xl mb-10 transform group-hover:scale-110 transition-transform duration-500 filter grayscale group-hover:grayscale-0">{feature.icon}</div>
                <p className="text-sm text-white/40 leading-relaxed max-w-[240px]">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Link to="/community" className="px-12 py-5 bg-[#9333EA] hover:bg-[#A855F7] text-white rounded-full font-bold tracking-[0.2em] text-[10px] uppercase shadow-[0_0_40px_rgba(147,51,234,0.3)] hover:shadow-[0_0_60px_rgba(147,51,234,0.5)] transition-all hover-lift click-scale focus-ring border-0">
              {t('community.joinCTA', 'Join Community')}
            </Link>
            <button onClick={() => setShowForestExplorer(true)} className="px-12 py-5 bg-[#10B981] hover:bg-[#34D399] text-[#050505] rounded-full font-bold tracking-[0.2em] text-[10px] uppercase shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-all hover-lift click-scale focus-ring border-0">
              EXPLORE FORESTS
            </button>
          </div>
        </div>
      </section>

      {/* G. IMPACT & TECH STACK */}
      <section id="impact" className="impact-section py-32 px-6 md:px-16 border-t border-white/5 bg-gradient-to-b from-[var(--deep-forest)] to-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
               <h2 className="text-3xl font-drama mb-8">{t('impact.sysArch')}</h2>
               <div className="flex flex-wrap gap-4">
                 {['React 19', 'Node.js', 'SQLite', 'Supabase', 'NASA FIRMS', 'Google Cloud Vision', 'Telegram Bot API', 'OpenWeatherMap'].map((tech) => (
                    <span key={tech} className="impact-item px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-data">
                      {tech}
                    </span>
                  ))}
               </div>
            </div>
            <div>
               <h2 className="text-3xl font-drama mb-8 text-end">{t('impact.globalGoals')}</h2>
               <div className="space-y-4">
                 {[
                    { sdg: "09", title: t('impact.sdg09') },
                    { sdg: "13", title: t('impact.sdg13') },
                    { sdg: "15", title: t('impact.sdg15') }
                  ].map((goal) => (
                    <div key={goal.sdg} className="impact-item flex items-center justify-end gap-6 border-b border-white/10 pb-4">
                      <span className="text-xl font-light text-white/70">{goal.title}</span>
                      <span className="text-4xl font-bold text-[var(--alert-signal)] font-data bg-red-500/10 px-4 py-2 rounded-xl">#{goal.sdg}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* H. FOOTER */}
      <footer className="bg-[#050A07] rounded-t-[4rem] py-16 px-6 md:px-16 mt-20 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2600&auto=format&fit=crop" 
          alt="" 
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.04] mix-blend-screen pointer-events-none"
        />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center z-10 relative">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-[var(--alert-signal)]" />
              <span className="font-bold text-2xl tracking-tighter">{t('app.name')}</span>
            </div>
            <p className="text-white/40 text-sm font-data">{t('footer.tagline')}</p>
          </div>

        </div>
        
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[var(--canopy-green)] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
      </footer>

    </div>
  );
}
