import { PageShell } from '../components/ui'
import { useI18n } from '../lib/i18n'

export default function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useI18n()
  return (
    <PageShell title={t(titleKey)}>
      <div className="card p-8 text-slate-600">{t('comingSoon')}</div>
    </PageShell>
  )
}
