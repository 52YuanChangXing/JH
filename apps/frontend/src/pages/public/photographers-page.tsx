import { useQuery } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { fetchPublicPhotographers } from '../../services/public';

export function PhotographersShowcasePage() {
  const { data } = useQuery({ queryKey: ['public-photographers'], queryFn: () => fetchPublicPhotographers() });

  if (!data) {
    return <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">遇见简浩影视的核心创作团队</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          由婚礼导演、商业摄影师与旅拍艺术家组成的跨领域团队，为每一次拍摄注入独特叙事与视觉语言。
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {data.map((photographer) => (
          <div key={photographer.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-4">
              {photographer.avatarUrl ? (
                <img src={photographer.avatarUrl} alt={photographer.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900">{photographer.name}</p>
                <p className="text-xs text-slate-500">{photographer.tagline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{photographer.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {photographer.specialties.map((specialty) => (
                <span key={specialty} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {specialty}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p>创作年资：{photographer.experienceYears} 年</p>
              <p>荣誉奖项：{photographer.accolades.join('、')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
