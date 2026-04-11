import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { reviewService } from '../services/reviewService';

function LandingPage() {
  const { t } = useTranslation();
  const { language, theme, toggleLanguage, toggleTheme } = useSettings();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackReviews = [
    { text: 'Amazing', rating: 5 },
    { text: 'Outstanding results', rating: 5 },
    { text: 'A first class service', rating: 5 },
    { text: 'Results have been amazing', rating: 5 },
    { text: 'Cannot recommend highly enough', rating: 5 },
    { text: 'What a fabulous find', rating: 5 },
  ];

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await reviewService.getApprovedReviews({ limit: 6, offset: 0 });
        const apiReviews = Array.isArray(data?.reviews)
          ? data.reviews
              .slice(0, 6)
              .map((review) => ({
                text: review.comment,
                rating: review.rating,
                patientName: review.patient_name || null,
                createdAt: review.created_at || null,
              }))
              .filter((review) => review.text && review.rating)
          : [];

        if (mounted) {
          setReviews(apiReviews);
        }
      } catch {
        if (mounted) {
          setReviews([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, []);

  const reviewsToRender = !loading && reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-sky-100/80 bg-white/90 dark:border-slate-700 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm shadow-sky-100/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            {t('landing.title')}
          </div>
          <nav className="hidden items-center gap-3 md:flex">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center rounded-lg border border-sky-200 bg-white/90 dark:border-slate-600 dark:bg-slate-700 p-2.5 text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600 hover:border-sky-300"
              title={t('common.language')}
            >
              <span className="text-sm font-semibold">{language === 'ar' ? 'ع' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg border border-sky-200 bg-white/90 dark:border-slate-600 dark:bg-slate-700 p-2.5 text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600 hover:border-sky-300"
              title={t('common.theme')}
            >
              {theme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12H18.75m-3.75 3.75H16.5m-3.75-3.75H12m-3.75-3.75H7.5m-3.75 3.75H3m1.591-6.364l-1.591-1.591M12 18.75V21m-6.364-1.591l-1.591 1.591M18.75 12H21m-3.75 3.75H16.5m-3.75-3.75H12m-3.75-3.75H7.5m-3.75 3.75H3"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              )}
            </button>
            <a href="#about" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400">
              {t('landing.about')}
            </a>
            <a href="#treatments" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400">
              {t('landing.treatments')}
            </a>
            <a href="#reviews" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400">
              {t('landing.reviews')}
            </a>
            <a href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400">
              {t('common.login')}
            </a>
            <a
              href="/register"
              className="rounded-full bg-sky-600 dark:bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600"
            >
              {t('landing.bookAppointment')}
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-sky-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="mb-6 inline-block rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
              ✨ Advanced Aesthetic Treatments
            </div>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl lg:text-7xl">
              {t('landing.heroTitle')}
              <br />
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                {t('landing.heroSubtitle')}
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600 dark:text-slate-300 md:text-2xl">
              {t('landing.heroDescription')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/register"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10">{t('landing.bookConsultation')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-sky-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </a>
              <a
                href="#treatments"
                className="rounded-xl border-2 border-sky-600 bg-white px-8 py-4 text-base font-semibold text-sky-600 shadow-lg transition-all hover:scale-105 hover:bg-sky-50 hover:shadow-xl"
              >
                {t('landing.viewTreatments')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/80 py-20 backdrop-blur-[2px] dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-8 text-center transition-all hover:scale-105 hover:shadow-xl">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg transition-transform group-hover:rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-10 w-10 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Look brighter & fresher</h3>
              <p className="text-slate-700">
                Clearer younger looking skin with injectables, fillers, wrinkle removal, and
                rejuvenation
              </p>
            </div>

            <div className="group rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center transition-all hover:scale-105 hover:shadow-xl">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg transition-transform group-hover:rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-10 w-10 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.06 12.06 0 00-4.5 0m-4.5 0a12.06 12.06 0 00-4.5 0M9 12.75h.008v.008H9v-.008z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Advanced Tattoo Removal</h3>
              <p className="text-slate-700">
                The fastest, most painless laser removal of tattoos with Pico Pro Laser technology
              </p>
            </div>

            <div className="group rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center transition-all hover:scale-105 hover:shadow-xl">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg transition-transform group-hover:rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-10 w-10 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443a55.381 55.381 0 015.25 2.882V15m-9 0a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443a55.381 55.381 0 015.25 2.882V15"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Professional Qualifications</h3>
              <p className="text-slate-700">
                Postgraduate Level 7 – Master&apos;s level aesthetic medicine qualification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section id="treatments" className="bg-sky-100/40 py-16 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">Our Aesthetic Treatments</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Our friendly team are here to discuss your goals and how to achieve the best results.
              We start with a consultation to find out more about you and tailor treatments to your
              individual requirements.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Laser Tattoo Removal',
                description:
                  'The PICO PRO Laser that treats ALL colours and ALL skin types, with less treatments, less pain and faster than traditional lasers.',
              },
              {
                title: 'Pico Skin Rejuvenation',
                description:
                  'Removing unwanted pigment including Melasma, treating visible signs of ageing caused by sun damage, acne and general scarring.',
              },
              {
                title: 'Laser Hair Removal',
                description:
                  'A world-first in laser hair removal with the Motus Pro from Lynton able to treat ALL skin types. Fast & completely painless treatment.',
              },
              {
                title: 'Dermal Fillers',
                description:
                  'We use Revanesse, the highest quality FDA approved product containing hyaluronic acid to hydrate & refresh your skin.',
              },
              {
                title: 'Anti-Wrinkle Injections',
                description:
                  'A quick and effective non-surgical way to tackle the signs of ageing. We use Azzalure and Alluzience.',
              },
              {
                title: 'Microneedling',
                description:
                  'Two cutting edge technologies for active acne, skin texture, reducing fine lines, boosting collagen, and skin tightening.',
              },
            ].map((treatment, idx) => (
              <div
                key={idx}
                className="group rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-md transition-all hover:scale-105 hover:shadow-xl"
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg transition-transform group-hover:rotate-6">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">{treatment.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{treatment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white/80 py-16 backdrop-blur-[2px] dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">About Us</h2>
              <p className="mb-4 text-lg text-slate-600 dark:text-slate-300">
                Pure Skin Clinic provides expert skin treatments to clients. Our highly trained
                aesthetic practitioners use the latest technology to deliver results driven
                treatments in tattoo removal, pain free hair removal, anti-ageing solutions as well
                as a wide range of other advanced skin treatments, helping you look and feel your
                best.
              </p>
              <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
                All our practitioners are highly trained and qualified to the highest level in laser
                and aesthetics, with postgraduate Level 7 Diploma in Injectables. This Master&apos;s
                level aesthetic medicine qualification is regulated by Ofqual and approved by the
                JCCP.
              </p>
              <a
                href="/register"
                className="inline-block rounded-lg bg-sky-600 dark:bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600"
              >
                Book A Consultation
              </a>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-8 dark:border-transparent dark:bg-slate-800">
              <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Expert Aesthetics</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Level 7 Diploma in Injectables</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Level 5 in Laser & Aesthetics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Regulated by Ofqual</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Approved by JCCP</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Fully Insured Clinic</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="bg-sky-100/40 py-16 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-4xl font-bold text-slate-900 dark:text-slate-100">What our clients say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reviewsToRender.map((review, idx) => {
              const nameFromApi =
                typeof review.patient_name === 'string' ? review.patient_name.trim() : '';
              const nameFromMap =
                typeof review.patientName === 'string' ? review.patientName.trim() : '';
              const reviewerName = nameFromApi || nameFromMap || 'PureSkin Clinic Client';
              const createdRaw = review.createdAt ?? review.created_at ?? null;

              return (
                <div
                  key={idx}
                  className="group rounded-2xl bg-white dark:bg-slate-700 p-6 shadow-md transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="mb-4 flex gap-1 text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-6 w-6 transition-transform group-hover:scale-110"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{review.text}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{reviewerName}</p>
                  {createdRaw ? (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(createdRaw).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-sky-600 to-sky-700 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Feel confident in your own skin</h2>
          <p className="mb-8 text-xl text-sky-100">
            Got a treatment in mind? Want to explore the latest aesthetics treatments on offer?
            Our friendly team are here ready to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/register"
              className="rounded-lg border border-sky-200 bg-white px-8 py-3 text-base font-semibold text-sky-600 shadow-lg shadow-sky-100/40 transition-all hover:bg-sky-50"
            >
              Book A Treatment
            </a>
            <a
              href="/login"
              className="rounded-lg border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              Login
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-white">PureSkin Clinic</h3>
              <p className="text-sm">
                Expert skin treatments and aesthetic solutions to help you look and feel your best.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#treatments" className="hover:text-white">
                    Treatments
                  </a>
                </li>
                <li>
                  <a href="#reviews" className="hover:text-white">
                    Reviews
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Account</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/login" className="hover:text-white">
                    Login
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-white">
                    Register
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Contact</h4>
              <p className="text-sm">Get in touch with our team for consultations and bookings.</p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm">
            <p>PureSkin Clinic © 2025 All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
