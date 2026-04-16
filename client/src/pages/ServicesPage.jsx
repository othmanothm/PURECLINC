import { useTranslation } from 'react-i18next';
import PublicPureHeader from '../components/PublicPureHeader';
import PureTrustBar from '../components/PureTrustBar';

/* Order: hair, laser, skin */
const SERVICE_IMAGES = [
  '/service-hair-care.png',
  '/service-laser.png',
  '/service-skin-care.png',
];

const SERVICE_KEYS = ['hair', 'laser', 'skin'];

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === 'ar';

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F2F0E8] font-tajawal dark:bg-slate-900"
    >
      <PublicPureHeader />
      <PureTrustBar />

      <main className="bg-transparent dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-10 text-center md:mb-14">
            <h1 className="text-3xl font-extrabold text-[#1A1A1A] dark:text-slate-100 md:text-4xl">
              {t('publicSite.servicesSpecializedTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[#667085] dark:text-slate-400 md:text-lg">
              {t('publicSite.servicesSpecializedSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-5">
            {SERVICE_KEYS.map((key, index) => (
              <article
                key={key}
                className="group relative min-h-[260px] overflow-hidden rounded-3xl bg-white md:min-h-[280px]"
              >
                <img
                  src={SERVICE_IMAGES[index]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                  aria-hidden
                />
                <div
                  className={`absolute inset-x-0 bottom-0 p-6 text-white ${rtl ? 'text-right' : 'text-left'}`}
                >
                  <h2 className="text-xl font-bold leading-snug md:text-2xl">
                    {t(`publicSite.service_${key}_title`)}
                  </h2>
                  {t(`publicSite.service_${key}_desc`, { defaultValue: '' }).trim() ? (
                    <p className="mt-2 text-sm font-normal leading-relaxed text-white/95 md:text-base">
                      {t(`publicSite.service_${key}_desc`)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
