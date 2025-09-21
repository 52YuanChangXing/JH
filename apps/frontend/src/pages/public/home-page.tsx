import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { fetchLanding } from '../../services/public';

export function HomePage() {
  const { data } = useQuery({ queryKey: ['landing'], queryFn: fetchLanding });

  if (!data) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-3xl bg-slate-900 text-white">
        <div className="relative">
          <img
            src={data.hero.background}
            alt="Jianhao Studio"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="relative px-6 py-16 md:px-12 md:py-24">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold md:text-5xl"
            >
              {data.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 max-w-2xl text-lg text-slate-200"
            >
              {data.hero.description}
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/booking">
                <Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-slate-100">
                  {data.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Play className="mr-2 h-4 w-4" /> {data.hero.ctaSecondary}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white p-6 shadow-lg md:grid-cols-4">
        <MetricCard label="团队年资" value={`${data.metrics.experienceYears}+`} />
        <MetricCard label="服务城市" value={`${data.metrics.globalCities}`} />
        <MetricCard label="客户好评" value={`${data.metrics.satisfaction}%`} />
        <MetricCard label="专业奖项" value={`${data.metrics.awards}`} />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">我们如何讲述故事</h2>
            <p className="text-sm text-slate-500">电影叙事的调度 + 多学科团队协作，确保每一次拍摄皆为精品。</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data.features.map((feature) => (
            <Card key={feature.title} className="border-none bg-white/80 shadow-xl backdrop-blur">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">精选作品</h2>
          <Link to="/portfolio" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            查看全部
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data.featuredPortfolio.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -6 }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
            >
              <img src={item.coverImageUrl} alt={item.title} className="h-60 w-full object-cover" />
              <div className="space-y-2 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.categories.join(' / ')}</p>
                <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">明星团队</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {data.photographers.map((photographer) => (
            <div key={photographer.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-4">
                {photographer.avatarUrl && (
                  <img src={photographer.avatarUrl} alt={photographer.name} className="h-16 w-16 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">{photographer.name}</p>
                  <p className="text-xs text-slate-500">{photographer.tagline}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 line-clamp-3">{photographer.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {photographer.specialties.slice(0, 4).map((specialty) => (
                  <span key={specialty} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {data.services.map((service) => (
          <Card key={service.id} className="border-none bg-white/90 shadow-lg backdrop-blur">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                {service.isPopular && <span className="text-xs font-semibold text-amber-500">热门</span>}
              </div>
              <p className="text-sm text-slate-600">{service.summary}</p>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">交付内容</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {service.deliverables.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>起步价 ¥{service.priceFrom.toLocaleString()}</span>
                <span>周期约 {service.duration} 小时</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {data.testimonials.map((testimonial) => (
          <div key={testimonial.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-4">
              {testimonial.avatarUrl && (
                <img src={testimonial.avatarUrl} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
              )}
              <div>
                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.title}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{testimonial.message}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-slate-900 p-10 text-white">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">常见问题</h2>
            <p className="mt-2 text-sm text-slate-300">
              若未找到答案，可通过预约页面留下您的问题，我们会在 24 小时内与您联系。
            </p>
            <Link to="/booking" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-200">
              立即预约咨询 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {data.faqs.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{faq.question}</p>
                <p className="mt-2 text-sm text-slate-200">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg">
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
