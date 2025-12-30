import React, { useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
const SupportCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) => (
  <div
    className={`group bg-white p-8 rounded-3xl border border-black/5 shadow-premium hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 ${delay}`}
  >
    <div className="w-14 h-14 bg-alloro-bg text-alloro-navy/40 rounded-2xl flex items-center justify-center border border-black/5 shadow-inner-soft group-hover:bg-alloro-orange/5 group-hover:text-alloro-orange transition-all duration-500 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-black font-heading text-alloro-navy mb-3 group-hover:text-alloro-orange transition-colors">
      {title}
    </h3>
    <p className="text-slate-500 font-bold text-sm leading-relaxed tracking-tight">
      {description}
    </p>
    <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-alloro-navy uppercase tracking-[0.2em] group-hover:gap-5 transition-all cursor-pointer">
      Learn More <ChevronRight size={14} />
    </div>
  </div>
);

const Help = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-alloro-bg font-body text-alloro-textDark">
      {/* Header */}
      <header className="glass-header border-b border-black/5 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle size={20} />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-[11px] font-black font-heading text-alloro-textDark uppercase tracking-[0.25em] leading-none">
                Support Intelligence
              </h1>
              <span className="text-[9px] font-bold text-alloro-textDark/40 uppercase tracking-widest mt-1.5 hidden sm:inline">
                Concierge Strategy Access
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-black/5 shadow-inner-soft">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Verified Channel
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-12 lg:space-y-20">
        {/* Hero Section */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 text-left pt-2">
          <div className="flex items-center gap-4 mb-3">
            <div className="px-3 py-1.5 bg-alloro-orange/5 rounded-lg text-alloro-orange text-[10px] font-black uppercase tracking-widest border border-alloro-orange/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-alloro-orange"></span>
              Human Support Online
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-heading text-alloro-navy tracking-tight leading-none mb-4">
            How can we serve you?
          </h1>
          <p className="text-xl lg:text-2xl text-slate-500 font-medium tracking-tight leading-relaxed max-w-4xl">
            Connect with your dedicated{" "}
            <span className="text-alloro-orange underline underline-offset-8 font-black">
              Alloro Strategist
            </span>{" "}
            for technical, operational, or marketing guidance.
          </p>
        </section>

        {/* Support Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SupportCard
            icon={<Zap size={28} />}
            title="Technical Support"
            description="Issues with data sync, PMS integration, or platform navigation? Our engineering team is here to help."
            delay="duration-300"
          />
          <SupportCard
            icon={<Sparkles size={28} />}
            title="Marketing Strategy"
            description="Need guidance on keyword shifts, local SEO, or review velocity tactics? Book a session with a lead strategist."
            delay="duration-500"
          />
          <SupportCard
            icon={<MessageSquare size={28} />}
            title="Practice Ops"
            description="Questions about the Treatment Coordinator hub or peer-to-peer outreach protocols? Let's optimize your flow."
            delay="duration-700"
          />
        </section>

        {/* Inquiry Form & Side Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 space-y-10">
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-premium p-10 lg:p-14 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-alloro-orange/[0.02] rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-alloro-orange/[0.05] transition-all duration-700"></div>

              {submitted ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black font-heading text-alloro-navy tracking-tight">
                      Message Received.
                    </h3>
                    <p className="text-slate-500 font-bold max-w-sm">
                      Your strategist has been alerted and will respond via your
                      registered email shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-alloro-orange hover:underline underline-offset-4"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-8 relative z-10"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black font-heading text-alloro-navy tracking-tight leading-none">
                      Submit an Inquiry
                    </h2>
                    <p className="text-slate-400 font-bold text-sm tracking-tight leading-none">
                      Bypass the email queue and reach us directly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] ml-1">
                        Subject Matter
                      </label>
                      <select className="w-full bg-alloro-bg border border-black/5 rounded-2xl px-6 py-4 text-alloro-navy font-bold text-sm focus:outline-none focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/5 transition-all appearance-none cursor-pointer">
                        <option>General Support</option>
                        <option>Technical Issue</option>
                        <option>Marketing Strategy</option>
                        <option>Revenue Attribution</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] ml-1">
                        Urgency Tier
                      </label>
                      <select className="w-full bg-alloro-bg border border-black/5 rounded-2xl px-6 py-4 text-alloro-navy font-bold text-sm focus:outline-none focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/5 transition-all appearance-none cursor-pointer">
                        <option>Normal Protocol</option>
                        <option>High Priority</option>
                        <option>Immediate Assistance Required</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] ml-1">
                      Directive Details
                    </label>
                    <textarea
                      required
                      placeholder="Please describe your challenge or question in detail..."
                      className="w-full h-40 bg-alloro-bg border border-black/5 rounded-3xl px-6 py-5 text-alloro-navy font-bold text-sm focus:outline-none focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/5 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-12 py-5 bg-alloro-navy text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      "Transmitting Intelligence..."
                    ) : (
                      <>
                        DISPATCH TO STRATEGY TEAM{" "}
                        <Send
                          size={16}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-10">
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-premium p-10 lg:p-14 text-left space-y-10">
              <div className="space-y-1">
                <h3 className="text-xl font-black font-heading text-alloro-navy tracking-tight leading-none">
                  Instant Channels
                </h3>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                  Real-time reach protocol
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-black/5 shadow-inner-soft group-hover:bg-alloro-navy group-hover:text-white transition-all duration-500 group-hover:-rotate-6">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] mb-1">
                      Direct Strategy Email
                    </p>
                    <p className="text-xl font-black text-alloro-navy tracking-tight group-hover:text-alloro-navy transition-colors">
                      info@getalloro.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-black/[0.03] space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm font-bold text-slate-500 tracking-tight">
                    Average response: {"<"} 2 hours
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm font-bold text-slate-500 tracking-tight">
                    Expert orthodonic strategists
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-alloro-orange rounded-[2.5rem] p-10 lg:p-14 text-white shadow-premium text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="relative z-10 space-y-6">
                <h4 className="text-2xl font-black font-heading tracking-tight leading-tight">
                  Need a Strategy Deep Dive?
                </h4>
                <p className="text-white/80 font-bold text-base leading-relaxed tracking-tight">
                  Schedule a 30-minute growth audit with your lead analyst to
                  review your market data.
                </p>
                <button className="px-8 py-4 bg-white text-alloro-orange rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl active:scale-95 transition-all">
                  Book Growth Audit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 pb-12 flex flex-col items-center gap-10 text-center">
          <div className="w-16 h-16 bg-alloro-orange text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">
            A
          </div>
          <p className="text-[11px] text-alloro-textDark/20 font-black tracking-[0.4em] uppercase">
            Alloro Intelligence Support • v2.6.0
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Help;
