import { LoadingLabel, Sk, SkGrid, SkTable, SkText } from "./Skeleton";

export function BrowseSkeleton({ label = "Loading lots" }: { label?: string }) {
  return (
    <div className="container-pp py-8">
      <LoadingLabel text={label} />
      <Sk className="mb-3 h-3 w-32" />
      <Sk className="mb-2 h-8 w-64" />
      <Sk className="mb-6 h-4 w-40" />
      <Sk className="mb-6 h-11 w-full max-w-2xl rounded-full" />
      <div className="mb-6 flex flex-wrap gap-2">{Array.from({ length: 6 }, (_, i) => <Sk key={i} className="h-7 w-24 rounded-full" />)}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        <Sk className="h-11 w-full rounded-xl lg:hidden" />
        <aside className="hidden space-y-6 lg:block">
          {[5, 4, 3].map((n, i) => (
            <div key={i} className="space-y-2">
              <Sk className="h-3 w-24" />
              {Array.from({ length: n }, (_, j) => <Sk key={j} className="h-7 w-full" />)}
            </div>
          ))}
        </aside>
        <SkGrid count={9} cols="sm:grid-cols-2 xl:grid-cols-3" />
      </div>
    </div>
  );
}

export function LotDetailSkeleton() {
  return (
    <div className="container-pp py-6">
      <LoadingLabel text="Loading lot" />
      <Sk className="mb-4 h-3 w-64" />
      <div className="mb-6 space-y-2">
        <div className="flex gap-2"><Sk className="h-6 w-20" /><Sk className="h-6 w-28 rounded-full" /></div>
        <Sk className="h-8 w-3/4" />
        <Sk className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Sk className="aspect-[16/10] w-full rounded-2xl" />
          <div className="grid grid-cols-5 gap-2">{Array.from({ length: 5 }, (_, i) => <Sk key={i} className="aspect-[16/10] rounded-lg" />)}</div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="space-y-2 bg-white p-3"><Sk className="h-2.5 w-16" /><Sk className="h-4 w-24" /></div>)}
          </div>
          <SkText lines={4} />
          <SkTable rows={5} />
        </div>
        <aside className="space-y-4">
          <div className="card space-y-4 p-5">
            <div className="flex justify-between"><div className="space-y-2"><Sk className="h-3 w-20" /><Sk className="h-10 w-36" /></div><div className="space-y-2"><Sk className="h-3 w-16" /><Sk className="h-6 w-24" /></div></div>
            <div className="flex gap-2">{[1, 2, 3].map((i) => <Sk key={i} className="h-9 flex-1" />)}</div>
            <Sk className="h-11 w-full rounded-full" />
            <SkText lines={3} />
          </div>
          <div className="card space-y-3 p-5"><Sk className="h-4 w-32" /><Sk className="h-10 w-full" /><Sk className="h-16 w-full" /></div>
        </aside>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="container-pp py-8">
      <LoadingLabel text="Loading checkout" />
      <Sk className="mb-6 h-8 w-40" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3"><Sk className="h-7 w-7 rounded-full" /><Sk className="h-5 w-40" /></div>
              <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: n === 1 ? 6 : 2 }, (_, i) => <Sk key={i} className="h-10 w-full" />)}</div>
            </div>
          ))}
        </div>
        <div className="card h-fit space-y-4 p-5">
          <Sk className="h-5 w-32" />
          {[1, 2, 3].map((i) => <div key={i} className="flex gap-3"><Sk className="h-12 w-16" /><SkText lines={2} className="flex-1" /></div>)}
          <SkText lines={4} />
          <Sk className="h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton({ title = true, withSidebar = false, label = "Loading" }: { title?: boolean; withSidebar?: boolean; label?: string }) {
  const body = (
    <div className="space-y-4">
      {title && <Sk className="h-8 w-48" />}
      <div className="flex gap-2">{[1, 2, 3].map((i) => <Sk key={i} className="h-8 w-24 rounded-full" />)}</div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Sk className="h-14 w-20 shrink-0" />
          <SkText lines={2} className="flex-1" />
          <Sk className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
  return (
    <div className="container-pp py-10">
      <LoadingLabel text={label} />
      {withSidebar ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden space-y-2 lg:block">{Array.from({ length: 7 }, (_, i) => <Sk key={i} className="h-8 w-full" />)}</div>
          {body}
        </div>
      ) : body}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <LoadingLabel text="Loading admin" />
      <Sk className="mb-8 h-8 w-56" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card space-y-2 p-5"><Sk className="h-3 w-24" /><Sk className="h-7 w-20" /></div>)}
      </div>
      <SkTable rows={6} />
    </div>
  );
}
