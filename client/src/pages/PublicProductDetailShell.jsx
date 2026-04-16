import { useTranslation } from 'react-i18next';
import PublicPureHeader from '../components/PublicPureHeader';
import ProductDetailPage from './patient/ProductDetailPage';

export default function PublicProductDetailShell() {
  const { i18n } = useTranslation();
  const rtl = i18n.language === 'ar';

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F2F0E8] font-tajawal dark:bg-slate-900"
    >
      <PublicPureHeader />
      <ProductDetailPage />
    </div>
  );
}
