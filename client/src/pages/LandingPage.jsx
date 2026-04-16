import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewService } from '../services/reviewService';
import PublicPureHeader from '../components/PublicPureHeader';
import PureTrustBar from '../components/PureTrustBar';
import { useAuth } from '../auth/AuthContext';

/** Clinic photo in client/public; SVG if the file is missing */
const HERO_PRIMARY = '/hero-clinic-interior.png';
const HERO_FALLBACK = '/hero-clinic.svg';

/** Sage-on-cream icons (Heroicons-style paths), no sparkle/star */
function PureGlyphIcon({ name, className = 'h-6 w-6' }) {
  const stroke = (extra) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      {extra}
    </svg>
  );
  switch (name) {
    case 'bolt':
      return stroke(
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      );
    case 'sun':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      );
    case 'fire':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361 6.868 8.955 8.955 0 00-2.862-3.223z"
        />
      );
    case 'hair':
      return stroke(
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 3.75c0 3.75 1.5 6.75 4.5 9M10.5 2.25c1.5 2.25 2.25 5.25 2.25 8.25s-.75 6-2.25 8.25M14.25 3c1.5 3 2.25 6 1.5 9s-2.25 5.25-4.5 7.5"
          />
        </>
      );
    case 'cube':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
        />
      );
    case 'arrows-in':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
        />
      );
    case 'squares':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      );
    case 'bookmark':
      return stroke(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      );
    default:
      return stroke(
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      );
  }
}

const pureIconTile =
  'mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E2D8] bg-[#F2F0E8] text-[#6B705C] shadow-sm transition-transform group-hover:scale-105 dark:border-slate-600 dark:bg-slate-800/90 dark:text-[#a8b396]';

const pureIconTileLg =
  'mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E5E2D8] bg-[#F2F0E8] text-[#6B705C] shadow-sm transition-transform group-hover:scale-105 dark:border-slate-600 dark:bg-slate-800/90 dark:text-[#a8b396]';

function LandingPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const rtl = i18n.language === 'ar';
  const shopHref = isAuthenticated && user?.role === 'patient' ? '/store' : '/products';
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSrc, setHeroSrc] = useState(HERO_PRIMARY);

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
    <div className="min-h-screen bg-transparent dark:bg-slate-900">
      <PublicPureHeader />

      {/* Hero — split layout + trust bar */}
      <section
        dir={rtl ? 'rtl' : 'ltr'}
        className="overflow-hidden bg-[#F2F0E8] py-12 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 md:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 font-tajawal">
          <div className="flex flex-col items-stretch gap-10 md:flex-row md:items-center md:gap-12">
            <div
              className={`relative w-full md:w-1/2 ${rtl ? 'md:order-2' : 'md:order-1'}`}
            >
              <div className="overflow-hidden rounded-[32px] border border-stone-200/90 bg-[#FAF9F6] shadow-lg shadow-stone-300/30 dark:border-slate-600 dark:bg-slate-800 dark:shadow-none">
                <div className="relative bg-[#e8e4dc] dark:bg-slate-900/50">
                  <img
                    src={heroSrc}
                    alt="PureSkin Clinic"
                    className="aspect-[4/3] w-full object-cover object-center md:aspect-[5/4]"
                    loading="eager"
                    decoding="async"
                    onError={() => setHeroSrc(HERO_FALLBACK)}
                  />
                </div>
              </div>
            </div>
            <div className={`w-full md:w-1/2 ${rtl ? 'md:order-1' : 'md:order-2'}`}>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] dark:text-slate-100 md:text-5xl lg:text-[2.75rem]">
                {t('landing.heroHeadingLine1')}
                <span className="text-[#6B705C] dark:text-[#8f9a7e]">{t('landing.heroHeadingAccent')}</span>
                {t('landing.heroHeadingLine2')}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#667085] dark:text-slate-400">
                {t('landing.heroDescription')}
              </p>
              <div className={`mt-8 flex flex-wrap gap-3 ${rtl ? 'justify-start' : 'justify-start'}`}>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[#6B705C] px-7 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#565a49] dark:bg-[#6b725c] dark:hover:bg-[#5a604f]"
                >
                  {t('landing.bookConsultation')}
                </Link>
                <Link
                  to={shopHref}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[#6B705C] bg-transparent px-7 py-3.5 text-base font-bold text-[#6B705C] transition-colors hover:bg-[#6B705C]/10 dark:border-[#8f9a7e] dark:text-[#8f9a7e]"
                >
                  {t('landing.shopProducts')}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <PureTrustBar />
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-[#E5E2D8]/80 bg-[#F2F0E8]/90 py-20 dark:border-transparent dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-[#E5E2D8] bg-white/80 p-8 text-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
              <div className={`${pureIconTileLg} mx-auto`}>
                <PureGlyphIcon name="sun" className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1A1A1A] dark:text-slate-100">Look brighter & fresher</h3>
              <p className="text-[#667085] dark:text-slate-400">
                Clearer younger looking skin with injectables, fillers, wrinkle removal, and
                rejuvenation
              </p>
            </div>

            <div className="group rounded-2xl border border-[#E5E2D8] bg-white/80 p-8 text-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
              <div className={`${pureIconTileLg} mx-auto`}>
                <PureGlyphIcon name="hair" className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1A1A1A] dark:text-slate-100">{t('landing.featureHairTitle')}</h3>
              <p className="text-[#667085] dark:text-slate-400">{t('landing.featureHairBody')}</p>
            </div>

            <div className="group rounded-2xl border border-[#E5E2D8] bg-white/80 p-8 text-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
              <div className={`${pureIconTileLg} mx-auto`}>
                <PureGlyphIcon name="bookmark" className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1A1A1A] dark:text-slate-100">Professional Qualifications</h3>
              <p className="text-[#667085] dark:text-slate-400">
                Postgraduate Level 7 – Master&apos;s level aesthetic medicine qualification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section id="treatments" className="border-t border-[#E5E2D8]/80 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#1A1A1A] dark:text-slate-100">Our Aesthetic Treatments</h2>
            <p className="mx-auto max-w-2xl text-lg text-[#667085] dark:text-slate-300">
              Our friendly team are here to discuss your goals and how to achieve the best results.
              We start with a consultation to find out more about you and tailor treatments to your
              individual requirements.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: 'bolt',
                title: 'Laser Tattoo Removal',
                description:
                  'The PICO PRO Laser that treats ALL colours and ALL skin types, with less treatments, less pain and faster than traditional lasers.',
              },
              {
                icon: 'sun',
                title: 'Pico Skin Rejuvenation',
                description:
                  'Removing unwanted pigment including Melasma, treating visible signs of ageing caused by sun damage, acne and general scarring.',
              },
              {
                icon: 'fire',
                title: 'Laser Hair Removal',
                description:
                  'A world-first in laser hair removal with the Motus Pro from Lynton able to treat ALL skin types. Fast & completely painless treatment.',
              },
              {
                icon: 'cube',
                title: 'Dermal Fillers',
                description:
                  'We use Revanesse, the highest quality FDA approved product containing hyaluronic acid to hydrate & refresh your skin.',
              },
              {
                icon: 'arrows-in',
                title: 'Anti-Wrinkle Injections',
                description:
                  'A quick and effective non-surgical way to tackle the signs of ageing. We use Azzalure and Alluzience.',
              },
              {
                icon: 'squares',
                title: 'Microneedling',
                description:
                  'Two cutting edge technologies for active acne, skin texture, reducing fine lines, boosting collagen, and skin tightening.',
              },
            ].map((treatment, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-[#E5E2D8] bg-[#FDFCFA] p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:border-slate-600 dark:bg-slate-800/90 dark:shadow-none"
              >
                <div className={pureIconTile}>
                  <PureGlyphIcon name={treatment.icon} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#1A1A1A] dark:text-slate-100">{treatment.title}</h3>
                <p className="leading-relaxed text-[#667085] dark:text-slate-300">{treatment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section — solid PURE cream, no pattern overlay */}
      <section
        id="about"
        className="border-y border-[#E5E2D8] bg-[#F2F0E8] py-16 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-4xl font-bold text-[#1A1A1A] dark:text-slate-100">About Us</h2>
              <p className="mb-4 text-lg leading-relaxed text-[#667085] dark:text-slate-300">
                Pure Skin Clinic provides expert skin treatments to clients. Our highly trained
                aesthetic practitioners use the latest technology to deliver results driven
                treatments in tattoo removal, pain free hair removal, anti-ageing solutions as well
                as a wide range of other advanced skin treatments, helping you look and feel your
                best.
              </p>
              <p className="mb-6 text-lg leading-relaxed text-[#667085] dark:text-slate-300">
                All our practitioners are highly trained and qualified to the highest level in laser
                and aesthetics, with postgraduate Level 7 Diploma in Injectables. This Master&apos;s
                level aesthetic medicine qualification is regulated by Ofqual and approved by the
                JCCP.
              </p>
              <a
                href="/register"
                className="inline-block rounded-2xl bg-[#6B705C] px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#565a49] dark:bg-[#6B705C] dark:hover:bg-[#5a604f]"
              >
                Book A Consultation
              </a>
            </div>
            <div className="rounded-2xl border border-[#E5E2D8] bg-white/90 p-8 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <h3 className="mb-4 text-2xl font-bold text-[#1A1A1A] dark:text-slate-100">Expert Aesthetics</h3>
              <ul className="space-y-3 text-[#667085] dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-[#6B705C] dark:text-[#8f9a7e]"
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
                    className="mt-1 h-5 w-5 flex-shrink-0 text-[#6B705C] dark:text-[#8f9a7e]"
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
                    className="mt-1 h-5 w-5 flex-shrink-0 text-[#6B705C] dark:text-[#8f9a7e]"
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
                    className="mt-1 h-5 w-5 flex-shrink-0 text-[#6B705C] dark:text-[#8f9a7e]"
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
                    className="mt-1 h-5 w-5 flex-shrink-0 text-[#6B705C] dark:text-[#8f9a7e]"
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
                  className="group rounded-2xl border border-sky-200/50 bg-white/75 p-6 shadow-md shadow-sky-200/20 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-transparent dark:bg-slate-700 dark:shadow-none"
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
      <section className="border-t border-[#E5E2D8] bg-[#F2F0E8] py-16 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#1A1A1A] dark:text-white md:text-4xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-[#667085] dark:text-slate-400 md:text-xl">
            {t('landing.ctaSubtitle')}
          </p>
          <div className={`flex flex-wrap justify-center gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
            <a
              href="/register"
              className="rounded-2xl bg-[#6B705C] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#565a49] dark:bg-[#6B705C] dark:hover:bg-[#5a604f]"
            >
              {t('landing.ctaBookTreatment')}
            </a>
            <a
              href="/login"
              className="rounded-2xl border-2 border-[#6B705C] bg-transparent px-8 py-3 text-base font-semibold text-[#6B705C] transition-colors hover:bg-[#6B705C]/10 dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              {t('common.login')}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E2D8] bg-[#F2F0E8] py-12 text-[#667085] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-[#1A1A1A] dark:text-white">{t('landing.title')}</h3>
              <p className="text-sm leading-relaxed">{t('landing.footerTagline')}</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-[#1A1A1A] dark:text-white">{t('landing.footerQuickLinks')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#about"
                    className="transition-colors hover:text-[#6B705C] dark:hover:text-white"
                  >
                    {t('landing.about')}
                  </a>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="transition-colors hover:text-[#6B705C] dark:hover:text-white"
                  >
                    {t('landing.treatments')}
                  </Link>
                </li>
                <li>
                  <a
                    href="#reviews"
                    className="transition-colors hover:text-[#6B705C] dark:hover:text-white"
                  >
                    {t('landing.reviews')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-[#1A1A1A] dark:text-white">{t('landing.footerAccount')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/login" className="transition-colors hover:text-[#6B705C] dark:hover:text-white">
                    {t('common.login')}
                  </a>
                </li>
                <li>
                  <a href="/register" className="transition-colors hover:text-[#6B705C] dark:hover:text-white">
                    {t('common.register')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-[#1A1A1A] dark:text-white">{t('landing.footerContact')}</h4>
              <p className="text-sm leading-relaxed">{t('landing.footerContactBlurb')}</p>
            </div>
          </div>
          <div className="mt-8 border-t border-[#E5E2D8] pt-8 text-center text-sm dark:border-slate-800">
            <p className="text-[#667085] dark:text-slate-500">
              {t('landing.footerCopyright', { name: t('landing.title'), year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
