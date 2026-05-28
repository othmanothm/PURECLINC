import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  clampPrice,
  FIXED_PRICE_BOUNDS,
  formatUsdPrice,
  resolvePriceRange,
} from '../../utils/productPrice';

const VARIANT_STYLES = {
  patient: {
    panel:
      'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800',
    label: 'text-sm font-semibold text-slate-800 dark:text-slate-100',
    input:
      'w-full rounded-lg border border-slate-300 bg-white py-1.5 ps-6 pe-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
    select:
      'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
    sectionTitle: 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
    range: 'price-range-input price-range-input--patient price-range-input--compact',
    rangeLabel: 'shrink-0 text-xs text-slate-500 dark:text-slate-400',
    rangeSelected: 'min-w-0 truncate px-1 text-center text-xs font-semibold text-sky-600 dark:text-sky-400',
  },
  public: {
    panel:
      'rounded-xl border border-[#E5E2D8] bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800',
    label: 'text-sm font-bold text-[#1A1A1A] dark:text-slate-100',
    input:
      'w-full rounded-lg border border-[#E5E2D8] bg-white py-1 ps-5 pe-2 text-xs text-[#1A1A1A] focus:border-[#6B705C] focus:outline-none focus:ring-1 focus:ring-[#6B705C]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
    select:
      'w-full rounded-lg border border-[#E5E2D8] bg-white px-2 py-1.5 text-xs text-[#1A1A1A] focus:border-[#6B705C] focus:outline-none focus:ring-1 focus:ring-[#6B705C]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
    sectionTitle: 'mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#667085] dark:text-slate-400',
    range: 'price-range-input price-range-input--public price-range-input--compact',
    rangeLabel: 'text-[10px] text-[#667085] dark:text-slate-400',
    rangeSelected: 'text-[10px] font-semibold text-[#6B705C] dark:text-[#8f9a7e]',
  },
};

function PriceRangeFilter({
  minBound,
  maxBound,
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  styles,
}) {
  const { t } = useTranslation();
  const { min: activeMin, max: activeMax } = resolvePriceRange(minPrice, maxPrice);
  const span = Math.max(maxBound - minBound, 1);
  const minPercent = ((activeMin - minBound) / span) * 100;
  const maxPercent = ((activeMax - minBound) / span) * 100;

  const minInputValue = minPrice === '' ? '' : String(minPrice);
  const maxInputValue = maxPrice === '' ? '' : String(maxPrice);

  const handleMinSlider = (e) => {
    const next = clampPrice(e.target.value, minBound, maxBound);
    onMinChange(String(Math.min(next, activeMax)));
  };

  const handleMaxSlider = (e) => {
    const next = clampPrice(e.target.value, minBound, maxBound);
    onMaxChange(String(Math.max(next, activeMin)));
  };

  const handleMinInput = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onMinChange('');
      return;
    }
    onMinChange(raw);
  };

  const handleMaxInput = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onMaxChange('');
      return;
    }
    onMaxChange(raw);
  };

  return (
    <div className="space-y-2">
      <p className={styles.sectionTitle}>{t('store.priceFilter')}</p>

      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute start-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
            $
          </span>
          <input
            type="number"
            min={minBound}
            max={maxBound}
            value={minInputValue}
            onChange={handleMinInput}
            placeholder={String(minBound)}
            aria-label={t('store.priceMin')}
            className={styles.input}
          />
        </div>
        <span className="shrink-0 text-xs text-slate-400">–</span>
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute start-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
            $
          </span>
          <input
            type="number"
            min={minBound}
            max={maxBound}
            value={maxInputValue}
            onChange={handleMaxInput}
            placeholder={String(maxBound)}
            aria-label={t('store.priceMax')}
            className={styles.input}
          />
        </div>
      </div>

      <div className="relative h-8 w-full pt-0.5">
        <div
          className="pointer-events-none absolute top-2.5 h-1 rounded-full bg-slate-200 dark:bg-slate-600"
          style={{ left: 0, right: 0 }}
          aria-hidden
        />
        <div
          className="price-range-track-active pointer-events-none absolute top-2.5 h-1 rounded-full bg-sky-500 dark:bg-sky-400"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(maxPercent - minPercent, 0)}%`,
          }}
          aria-hidden
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={activeMin}
          onChange={handleMinSlider}
          className={`${styles.range} price-range-input--min`}
          aria-label={t('store.priceMin')}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={activeMax}
          onChange={handleMaxSlider}
          className={`${styles.range} price-range-input--max`}
          aria-label={t('store.priceMax')}
        />
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className={styles.rangeLabel}>{formatUsdPrice(minBound)}</span>
        <span className={styles.rangeSelected}>
          {formatUsdPrice(activeMin)} – {formatUsdPrice(activeMax)}
        </span>
        <span className={styles.rangeLabel}>{formatUsdPrice(maxBound)}</span>
      </div>
    </div>
  );
}

PriceRangeFilter.propTypes = {
  minBound: PropTypes.number.isRequired,
  maxBound: PropTypes.number.isRequired,
  minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onMinChange: PropTypes.func.isRequired,
  onMaxChange: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired,
};

export default function ProductCatalogFilters({
  variant = 'patient',
  sidebarClassName,
  search,
  category,
  onSearchChange,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}) {
  const { t } = useTranslation();
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.patient;

  const panelClass =
    variant === 'public'
      ? `${styles.panel} product-catalog-filters--public`
      : styles.panel;

  const sidebarWidth =
    sidebarClassName ?? 'w-full shrink-0 sm:max-w-[200px] lg:w-52';

  return (
    <aside className={`${sidebarWidth} ${panelClass} lg:sticky lg:top-6 lg:self-start`}>
      <h2 className={`mb-3 ${styles.label}`}>{t('common.filter')}</h2>

      <div className="space-y-4">
        <div>
          <label className={`block ${styles.sectionTitle}`} htmlFor="catalog-search">
            {t('common.search')}
          </label>
          <input
            id="catalog-search"
            type="text"
            placeholder={t('store.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.input.replace('ps-5', 'px-2')}
          />
        </div>

        <div>
          <label className={`block ${styles.sectionTitle}`} htmlFor="catalog-category">
            {t('store.allCategories')}
          </label>
          <select
            id="catalog-category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={styles.select}
          >
            <option value="">{t('store.allCategories')}</option>
            <option value="Skin Care">Skin Care</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Body Care">Body Care</option>
          </select>
        </div>

        <PriceRangeFilter
          minBound={FIXED_PRICE_BOUNDS.min}
          maxBound={FIXED_PRICE_BOUNDS.max}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinChange={onMinPriceChange}
          onMaxChange={onMaxPriceChange}
          styles={styles}
        />
      </div>
    </aside>
  );
}

ProductCatalogFilters.propTypes = {
  variant: PropTypes.oneOf(['patient', 'public']),
  sidebarClassName: PropTypes.string,
  search: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onMinPriceChange: PropTypes.func.isRequired,
  onMaxPriceChange: PropTypes.func.isRequired,
};
