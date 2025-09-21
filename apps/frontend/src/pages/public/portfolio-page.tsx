import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicPortfolio } from '../../services/public';
import { Button } from '../../components/ui/button';

const categories = ['婚礼', '商业', '旅拍', '纪录', '品牌'];

export function PortfolioGalleryPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['public-portfolio', page, category],
    queryFn: () => fetchPublicPortfolio({ page, pageSize: 9, category: category || undefined })
  });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">典藏作品集</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          精选记录婚礼、商业广告与环球旅拍的高光瞬间，每一组作品都由导演统筹团队操刀，呈现简浩影视的影像美学。
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          onClick={() => {
            setCategory('');
            setPage(1);
          }}
        >
          全部
        </Button>
        {categories.map((item) => (
          <Button
            key={item}
            variant={category === item ? 'default' : 'outline'}
            onClick={() => {
              setCategory(item);
              setPage(1);
            }}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-60 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        {data?.data.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <img src={item.coverImageUrl} alt={item.title} className="h-60 w-full object-cover" />
            <div className="space-y-2 p-6">
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.categories.join(' / ')}</p>
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
            上一页
          </Button>
          <span className="text-sm text-slate-500">
            第 {data.pagination.page} / {data.pagination.totalPages} 页
          </span>
          <Button
            variant="outline"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
