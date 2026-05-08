import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

export default function Terms() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-surface-low dark:bg-surface-low pt-32 pb-20 px-6">
      <Navbar />
      <div className="max-w-3xl mx-auto bg-surface dark:bg-surface-high/40 p-8 md:p-12 rounded-[32px] border border-overlay shadow-sm text-start">
        <h1 className="text-3xl font-display font-bold text-on-surface mb-6">{t('legal.terms_title')}</h1>
        <p className="text-muted mb-4">{t('legal.last_updated')}</p>
        
        <div className="space-y-6 text-muted">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">{t('legal.terms.s1_title')}</h2>
            <p>{t('legal.terms.s1_desc')}</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">{t('legal.terms.s2_title')}</h2>
            <p>{t('legal.terms.s2_desc')}</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">{t('legal.terms.s3_title')}</h2>
            <p>{t('legal.terms.s3_desc')}</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">{t('legal.terms.s4_title')}</h2>
            <p>{t('legal.terms.s4_desc')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
