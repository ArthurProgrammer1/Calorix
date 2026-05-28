'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Activity, BarChart2, Droplets, Target, Utensils, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { getUser } from '@/lib/storage'
import { useRouter } from 'next/navigation'

const features = [
  { icon: Target, title: 'Smart Calorie Tracking', desc: 'Hit your daily target with precision. Real-time tracking keeps you on course all day.', color: '#22C55E' },
  { icon: BarChart2, title: 'Progress Visualisation', desc: 'Beautiful charts show your journey. See trends, celebrate wins, spot patterns.', color: '#3B82F6' },
  { icon: Utensils, title: 'Meal Logging', desc: 'Log breakfast, lunch, dinner and snacks in seconds with our food database.', color: '#F59E0B' },
  { icon: Droplets, title: 'Water Tracking', desc: 'Stay hydrated. Track your daily water intake against your personalised goal.', color: '#06B6D4' },
  { icon: Zap, title: 'Macro Breakdown', desc: 'Go beyond calories. Track protein, carbs and fat to optimise your nutrition.', color: '#A855F7' },
  { icon: Activity, title: 'Goal Setting', desc: 'Lose, maintain or gain — we calculate the exact calories you need automatically.', color: '#F97316' },
]

const testimonials = [
  { name: 'Sarah K.', role: 'Lost 12kg in 4 months', text: 'Calorix made tracking so simple. The calorie calculations are spot on and the UI is gorgeous.', rating: 5 },
  { name: 'Marcus T.', role: 'Gained 8kg muscle', text: 'Finally an app that does the maths for me. Set my goal, got my targets, started tracking. Done.', rating: 5 },
  { name: 'Emma R.', role: 'Maintaining for 6 months', text: 'The weekly progress charts keep me motivated. I can actually see my consistency paying off.', rating: 5 },
]

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-4xl font-bold text-white"
    >
      {value}
    </motion.span>
  )
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-64">
      <div className="rounded-[32px] bg-[#1A1A24] border border-[#2A2A3A] p-4 shadow-2xl shadow-black/50">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF]">Today</span>
          <span className="text-xs font-semibold text-[#22C55E]">On track ✓</span>
        </div>
        <div className="flex justify-center mb-3">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A3A" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#22C55E" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * 0.32}`}
                strokeLinecap="round" />
            </svg>
            <div className="text-center">
              <div className="text-xl font-bold text-white">1,240</div>
              <div className="text-[10px] text-[#9CA3AF]">of 1,800</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[['Protein', '68g', '#3B82F6'], ['Carbs', '142g', '#F59E0B'], ['Fat', '38g', '#A855F7']].map(([label, val, color]) => (
            <div key={label} className="rounded-xl bg-[#0F0F14] p-2 text-center">
              <div className="text-xs font-semibold" style={{ color }}>{val}</div>
              <div className="text-[10px] text-[#6B7280]">{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {[['🌅 Breakfast', '420 kcal'], ['🥗 Lunch', '580 kcal'], ['🍎 Snack', '240 kcal']].map(([meal, cal]) => (
            <div key={meal} className="flex items-center justify-between rounded-lg bg-[#0F0F14] px-2.5 py-1.5">
              <span className="text-[11px] text-[#F9FAFB]">{meal}</span>
              <span className="text-[11px] font-medium text-[#22C55E]">{cal}</span>
            </div>
          ))}
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-10 top-8 rounded-2xl bg-[#22C55E] px-3 py-2 shadow-lg"
      >
        <div className="text-xs font-bold text-black">+1,240 kcal</div>
        <div className="text-[10px] text-black/70">logged today</div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -left-12 bottom-16 rounded-2xl bg-[#3B82F6] px-3 py-2 shadow-lg"
      >
        <div className="text-xs font-bold text-white">560 kcal</div>
        <div className="text-[10px] text-white/70">remaining</div>
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (getUser()) router.push('/dashboard')
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [router])

  return (
    <div className="min-h-screen bg-[#0F0F14]">
      {/* Navbar */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'glass border-b border-[#2A2A3A]' : ''}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#22C55E]">
              <span className="text-sm font-bold text-black">C</span>
            </div>
            <span className="text-lg font-bold text-white">Calorix</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[#9CA3AF] transition-colors hover:text-white">Features</a>
            <a href="#how" className="text-sm text-[#9CA3AF] transition-colors hover:text-white">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#9CA3AF] transition-colors hover:text-white">Log In</Link>
            <Link href="/signup" className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[#16a34a]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#22C55E]/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 py-20 md:grid-cols-2 md:items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-1.5">
              <span className="text-[#22C55E]">✦</span>
              <span className="text-sm text-[#22C55E]">Free calorie tracking — no card needed</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              Track Smarter,{' '}
              <span className="gradient-text">Live Healthier</span>
            </h1>
            <p className="mb-8 text-lg text-[#9CA3AF]">
              Calculate your perfect calorie target, log meals instantly, and watch your progress unfold — all in one beautiful app.
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <Link href="/signup" className="group flex items-center gap-2 rounded-2xl bg-[#22C55E] px-6 py-3.5 text-base font-semibold text-black transition-all hover:bg-[#16a34a] hover:shadow-lg hover:shadow-[#22C55E]/25">
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#how" className="flex items-center gap-2 rounded-2xl border border-[#2A2A3A] px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-[#22C55E]/50">
                See how it works
              </a>
            </div>
            <div className="flex flex-wrap gap-4">
              {['100% Free', 'No account needed', 'Works offline'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
                  <CheckCircle className="h-4 w-4 text-[#22C55E]" />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex justify-center">
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#2A2A3A] bg-[#1A1A24]/50 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 px-6 text-center">
          {[['10,000+', 'Active Users'], ['1M+', 'Meals Logged'], ['95%', 'Goal Achievement']].map(([val, label]) => (
            <div key={label}>
              <AnimatedNumber value={val} />
              <p className="mt-1 text-sm text-[#9CA3AF]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">Everything you need to reach your goals</h2>
            <p className="text-lg text-[#9CA3AF]">Powerful features packed into a clean, simple interface</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-[#2A2A3A] bg-[#1A1A24] p-6 transition-all hover:border-[#22C55E]/30 hover:shadow-lg hover:shadow-[#22C55E]/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${f.color}18` }}>
                  <f.icon className="h-6 w-6" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-[#9CA3AF]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#1A1A24]/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">Start in 3 simple steps</h2>
            <p className="text-lg text-[#9CA3AF]">Be tracking your calories in under 2 minutes</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Create your profile', desc: 'Enter your age, height, weight and goals. Takes 60 seconds.' },
              { step: '02', title: 'Get your calorie target', desc: 'We calculate your perfect daily calorie goal using the Mifflin-St Jeor formula.' },
              { step: '03', title: 'Start tracking', desc: 'Log meals, track macros, and watch your progress with beautiful charts.' },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative rounded-2xl border border-[#2A2A3A] bg-[#1A1A24] p-8">
                <div className="mb-4 text-5xl font-bold text-[#22C55E]/20">{item.step}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-[#9CA3AF]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">People love Calorix</h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[#2A2A3A] bg-[#1A1A24] p-6">
                <div className="mb-3 flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />)}</div>
                <p className="mb-4 text-[#D1D5DB]">&quot;{t.text}&quot;</p>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-[#22C55E]">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl border border-[#22C55E]/20 bg-gradient-to-br from-[#1A1A24] to-[#0F0F14] p-12 text-center shadow-xl shadow-[#22C55E]/5">
            <h2 className="mb-4 text-4xl font-bold text-white">Start tracking today</h2>
            <p className="mb-8 text-lg text-[#9CA3AF]">Completely free. No credit card. No catch.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-2xl bg-[#22C55E] px-8 py-4 text-lg font-bold text-black transition-all hover:bg-[#16a34a] hover:shadow-lg hover:shadow-[#22C55E]/30">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A3A] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22C55E]">
              <span className="text-xs font-bold text-black">C</span>
            </div>
            <span className="font-semibold text-white">Calorix</span>
          </div>
          <p className="text-sm text-[#6B7280]">© 2026 Calorix. Track smarter, live healthier.</p>
        </div>
      </footer>
    </div>
  )
}
