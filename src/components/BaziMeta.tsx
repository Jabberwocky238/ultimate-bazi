export function BaziMeta({ solar, lunar }: { solar: string; lunar: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-5 md:gap-7 text-sm text-slate-500 dark:text-slate-400">
      <div>
        <b className="font-medium text-slate-800 dark:text-slate-200 mr-2">公历</b>
        {solar}
      </div>
      <div>
        <b className="font-medium text-slate-800 dark:text-slate-200 mr-2">农历</b>
        {lunar}
      </div>
    </div>
  )
}
