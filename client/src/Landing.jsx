import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, Satellite, ShieldCheck, Activity, Globe, Zap, Cpu, MapPin, Podcast } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
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
      <nav className="navbar fixed top-0 left-0 w-full z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="text-[var(--alert-signal)]" />
            <span className="font-bold text-xl tracking-tighter">ForestGuard AI</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-[var(--ui-ghost)]/70">
            <a href="#mission" aria-label="Go to Mission section" className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--alert-signal)] focus:ring-offset-2 focus:ring-offset-[var(--deep-forest)] rounded-md px-2 pointer-events-auto cursor-pointer">Mission</a>
            <a href="#tech" aria-label="Go to Tech section" className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--alert-signal)] focus:ring-offset-2 focus:ring-offset-[var(--deep-forest)] rounded-md px-2 pointer-events-auto cursor-pointer">Tech</a>
            <a href="#impact" aria-label="Go to Impact section" className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-white transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--alert-signal)] focus:ring-offset-2 focus:ring-offset-[var(--deep-forest)] rounded-md px-2 pointer-events-auto cursor-pointer">Impact</a>
          </div>
          <Link to="/dashboard" aria-label="Access Dashboard command center" className="flex items-center justify-center min-h-[44px] px-5 bg-[var(--alert-signal)] hover:bg-red-600 text-white rounded-full font-bold text-sm btn-magnetic focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--deep-forest)] cursor-pointer">
            Access Dashboard
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
            Eyes in the Sky.
          </h2>
          <h1 className="hero-text text-5xl md:text-8xl lg:text-9xl font-drama tracking-tight leading-[0.9] mb-8">
            Voices on the <br/>
            <span className="text-[var(--alert-signal)]">Ground.</span>
          </h1>
          <p className="hero-text font-data text-xs md:text-sm text-[var(--ui-ghost)]/60 max-w-xl leading-relaxed uppercase tracking-widest border-l-2 border-[var(--alert-signal)] pl-4">
            Real-time wildfire disaster management powered by NASA FIRMS satellite telemetry and community ground-truth validation.
          </p>
        </div>
      </section>

      {/* C. THE THREE PILLARS — "Interactive Functional Artifacts" */}
      <section id="tech" className="pillars-section relative py-32 px-6 md:px-16 z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Cross-Validation Engine */}
          <div aria-label="Cross-Validation Engine Artifact" className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--alert-signal)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--deep-forest)]">
            <div className="flex justify-end mb-auto">
              <Cpu className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-right mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">Cross-Validation Engine</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">AI Alert Diagnostics</p>
            </div>
            
            <div className="mt-auto flex items-center justify-between font-data bg-black/30 p-4 rounded-xl">
              <div className="text-green-400 flex items-center gap-2 text-xs">
                Validated <ShieldCheck size={14} className="opacity-80" />
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center"><Podcast size={11} className="text-blue-500"/></div>
                <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center"><Satellite size={11} className="text-red-500"/></div>
              </div>
            </div>
          </div>

          {/* Card 2: Community Ground-Truth */}
          <div aria-label="Community Ground-Truth Artifact" className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--alert-signal)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--deep-forest)]">
            <div className="flex justify-end mb-auto">
              <Podcast className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-right mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">Community Ground-Truth</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">Telegram Bot Relays</p>
            </div>
            
            <div className="mt-auto bg-black/30 p-4 pt-5 rounded-xl flex justify-between items-start h-[4.5rem] relative">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <div className="text-right font-data text-[10px] text-green-400 leading-tight">
                <p>USER_092: Smoke spotted &lt;</p>
                <p className="opacity-50 mt-1.5">...Locating Sector 4 &lt;</p>
              </div>
              <div className="absolute bottom-2.5 right-4 w-6 h-3 bg-[#44554A] rounded-sm animate-pulse"></div>
            </div>
          </div>

          {/* Card 3: Satellite Telemetry */}
          <div aria-label="Satellite Telemetry Artifact" className="pillar-card bg-[var(--canopy-green)] p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group btn-magnetic flex flex-col h-80 hover:border-white/10 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--alert-signal)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--deep-forest)]">
            <div className="flex justify-end mb-auto">
              <Satellite className="text-white/80 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="text-right mb-6 mt-8">
              <h3 className="text-xl font-bold mb-1 text-white/95">Satellite Telemetry</h3>
              <p className="text-xs text-white/50 font-data tracking-wide">NASA FIRMS VIIRS/MODIS</p>
            </div>
            
            <div className="mt-auto bg-black/30 p-4 rounded-xl flex justify-between items-center h-[4.5rem]">
               <div className="w-0.5 h-full bg-blue-500/80 rounded-full"></div>
               <div className="text-[11px] font-data text-white/80 tracking-wide mt-1">Coordinates Scanned</div>
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
            Most disaster systems rely solely on delayed orbital imagery.
          </p>
          <h2 className="reveal-text text-4xl md:text-6xl lg:text-7xl font-drama leading-[1.1]">
            We focus on <br/>
            <span className="text-[var(--alert-signal)]">Real-time Cross-Validation.</span>
          </h2>
        </div>
      </section>

      {/* E. PROTOCOL — "Sticky Stacking Archive" */}
      <section className="protocol-container relative pb-32 pt-20">
        <div className="max-w-5xl mx-auto px-6 md:px-16 relative">
          
          <div className="protocol-card min-h-[70vh] w-full bg-[#111] border border-white/10 rounded-[2.5rem] p-10 md:p-16 mb-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <div className="text-blue-500 mb-6"><Globe size={48} strokeWidth={1}/></div>
            <h2 className="text-5xl font-bold tracking-tight mb-6">Step 1: Detect</h2>
            <p className="text-xl text-white/60 max-w-2xl font-light">Ingesting NASA FIRMS VIIRS/MODIS thermal scans, OpenWeatherMap conditions &amp; real-time weather data streams directly from orbit.</p>
          </div>
          
          <div className="protocol-card min-h-[70vh] w-full bg-[#151515] border border-white/10 rounded-[2.5rem] p-10 md:p-16 mb-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
            <div className="text-green-500 mb-6"><MapPin size={48} strokeWidth={1}/></div>
            <h2 className="text-5xl font-bold tracking-tight mb-6">Step 2: Verify</h2>
            <p className="text-xl text-white/60 max-w-2xl font-light">The localized Telegram Bot aggregates and structures civilian reports instantly, layering human ground-truth over satellite anomalies.</p>
          </div>
          
          <div className="protocol-card min-h-[70vh] w-full bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-10 md:p-16 mb-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
            <div className="text-[var(--alert-signal)] mb-6"><Activity size={48} strokeWidth={1}/></div>
            <h2 className="text-5xl font-bold tracking-tight mb-6">Step 3: Act</h2>
            <p className="text-xl text-white/60 max-w-2xl font-light">The Node.js &amp; React command center dispatches verified, high-confidence alerts to authorities minutes before standard APIs register the threat.</p>
            <Link to="/dashboard" aria-label="Launch Command Center" className="mt-12 px-8 py-4 min-h-[56px] min-w-[56px] bg-[var(--alert-signal)] hover:bg-red-600 text-white rounded-full font-bold btn-magnetic self-start flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1a1a1a]">
              Launch Command Center <Zap size={20} className="w-5 h-5 flex-shrink-0" />
            </Link>
          </div>

        </div>
      </section>

      {/* F. IMPACT & TECH STACK */}
      <section id="impact" className="impact-section py-32 px-6 md:px-16 border-t border-white/5 bg-gradient-to-b from-[var(--deep-forest)] to-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
               <h2 className="text-3xl font-drama mb-8">System Architecture</h2>
               <div className="flex flex-wrap gap-4">
                 {['React 19', 'Node.js', 'SQLite', 'NASA FIRMS', 'Google Cloud Vision', 'Telegram Bot API', 'OpenWeatherMap'].map((tech) => (
                   <span key={tech} className="impact-item px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-data">
                     {tech}
                   </span>
                 ))}
               </div>
            </div>
            <div>
               <h2 className="text-3xl font-drama mb-8 text-right">Global Impact Goals</h2>
               <div className="space-y-4">
                 {[
                   { sdg: "09", title: "Industry, Innovation & Infrastructure" },
                   { sdg: "13", title: "Climate Action" },
                   { sdg: "15", title: "Life on Land" }
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

      {/* G. FOOTER */}
      <footer className="bg-[#050A07] rounded-t-[4rem] py-16 px-6 md:px-16 mt-20 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2600&auto=format&fit=crop" 
          alt="" 
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.04] mix-blend-screen pointer-events-none"
        />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center z-10 relative">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="text-[var(--alert-signal)]" />
              <span className="font-bold text-2xl tracking-tighter">ForestGuard AI</span>
            </div>
            <p className="text-white/40 text-sm font-data">Global Real-Time Monitoring Network</p>
          </div>

        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[var(--canopy-green)] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
      </footer>

    </div>
  );
}
