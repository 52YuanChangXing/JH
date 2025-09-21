import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { fetchPublicServices } from '../../services/public';

export function ServicesShowcasePage() {
  const { data } = useQuery({ queryKey: ['public-services'], queryFn: fetchPublicServices });

  if (!data) {
    return <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">全流程摄影服务套餐</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          无论是婚礼、品牌大片还是环球旅拍，我们都以导演制协同模式为您提供前期策划、现场执行与后期交付的完整解决方案。
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {data.map((service) => (
          <div key={service.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{service.name}</h2>
              {service.isPopular && <span className="text-xs font-semibold text-amber-500">热门推荐</span>}
            </div>
            <p className="mt-3 text-sm text-slate-600">{service.description}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {service.deliverables.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>起步价 ¥{service.priceFrom.toLocaleString()}</span>
              <span>周期约 {service.duration} 小时</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
