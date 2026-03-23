import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';

function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    paymentMethod: 'cash_on_delivery',
    phone: '',
    address: '',
    cardNumber: '',
    cvv: '',
    cardholderName: '',
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const stored = localStorage.getItem('pureskin_cart');
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        setCart([]);
      }
    }
  };

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('pureskin_cart', JSON.stringify(newCart));
    // Trigger custom event to update cart count in header
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const removeItem = (productId) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    updateCart(newCart);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const newCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    updateCart(newCart);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCheckoutData({ ...checkoutData, cardNumber: formatted });
  };

  const handleCvvChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCheckoutData({ ...checkoutData, cvv: cleaned });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Validate checkout data
    if (!checkoutData.phone || !checkoutData.address) {
      toast.error(t('cart.fillPhoneAddress'));
      return;
    }

    // Validate card details if payment method is card
    if (checkoutData.paymentMethod === 'card') {
      const cardNumberDigits = checkoutData.cardNumber.replace(/\D/g, '');
      if (cardNumberDigits.length !== 16) {
        toast.error(t('cart.validCardNumber'));
        return;
      }
      if (checkoutData.cvv.length < 3 || checkoutData.cvv.length > 4) {
        toast.error(t('cart.validCVV'));
        return;
      }
      if (!checkoutData.cardholderName.trim()) {
        toast.error(t('cart.cardholderNameRequired'));
        return;
      }
    }

    setLoading(true);
    try {
      // Ensure productId is an integer and quantity is valid
      const items = cart
        .filter((item) => item.productId && item.quantity > 0)
        .map((item) => ({
          productId: parseInt(item.productId, 10),
          quantity: parseInt(item.quantity, 10),
        }));

      if (items.length === 0) {
        toast.error('Cart is empty or invalid');
        setLoading(false);
        return;
      }

      // Prepare payment data
      const paymentData = {
        paymentMethod: checkoutData.paymentMethod,
        phone: checkoutData.phone,
        address: checkoutData.address,
      };

      // Add card details if payment method is card
      if (checkoutData.paymentMethod === 'card') {
        paymentData.cardNumber = checkoutData.cardNumber.replace(/\D/g, '');
        paymentData.cvv = checkoutData.cvv;
        paymentData.cardholderName = checkoutData.cardholderName;
      }

      // If cash on delivery, create order directly
      if (checkoutData.paymentMethod === 'cash_on_delivery') {
        const data = await orderService.createCheckoutSession(items, paymentData);
        
        if (data.url) {
          localStorage.removeItem('pureskin_cart');
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          window.location.href = data.url;
        }
      } else {
        // For card/apple pay, use Stripe
        const data = await orderService.createCheckoutSession(items, paymentData);
        
        if (data.url) {
          if (data.directOrder) {
            localStorage.removeItem('pureskin_cart');
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            window.location.href = data.url;
          } else {
            // Redirect to Stripe Checkout
            window.location.href = data.url;
          }
        } else {
          throw new Error('No checkout URL received');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create checkout session';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('cart.title')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('cart.subtitle')}</p>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-12 text-center shadow-lg">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-300">{t('cart.empty')}</p>
            <button
              onClick={() => navigate('/store')}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              {t('cart.browseStore')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="group flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-lg transition-all hover:shadow-xl">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0021.75 5.25h-16.5A1.5 1.5 0 003.75 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">${parseFloat(item.price).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-sky-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-sky-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-28 text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    aria-label="Remove item"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {!showCheckoutForm ? (
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('cart.total')}:</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  {t('cart.proceedToCheckout')}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{t('cart.checkoutInfo')}</h2>
                
                {/* Payment Method */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.paymentMethod')}</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'cash_on_delivery' })}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        checkoutData.paymentMethod === 'cash_on_delivery'
                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <svg className="mx-auto mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                      <p className="text-sm font-semibold">{t('cart.cashOnDelivery')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'card' })}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        checkoutData.paymentMethod === 'card'
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <svg className="mx-auto mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v12.75A2.25 2.25 0 004.5 21.75z" />
                      </svg>
                      <p className="text-sm font-semibold">{t('cart.card')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'apple_pay' })}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        checkoutData.paymentMethod === 'apple_pay'
                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <svg className="mx-auto mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold">{t('cart.applePay')}</p>
                    </button>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.phoneNumber')}</label>
                  <input
                    type="tel"
                    value={checkoutData.phone}
                    onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                    placeholder={t('cart.phoneNumber')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* Address */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.deliveryAddress')}</label>
                  <textarea
                    value={checkoutData.address}
                    onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                    placeholder={t('cart.deliveryAddress')}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* Card Details - Only show when Card/Visa is selected */}
                {checkoutData.paymentMethod === 'card' && (
                  <div className="mb-6 rounded-xl border-2 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                      <svg className="h-5 w-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v12.75A2.25 2.25 0 004.5 21.75z" />
                      </svg>
                      {t('cart.paymentMethod')}
                    </h3>
                    
                    {/* Cardholder Name */}
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.cardholderName')}</label>
                      <input
                        type="text"
                        value={checkoutData.cardholderName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, cardholderName: e.target.value.toUpperCase() })}
                        placeholder="JOHN DOE"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm uppercase focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                        maxLength={50}
                      />
                    </div>

                    {/* Card Number */}
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.cardNumber')}</label>
                      <input
                        type="text"
                        value={checkoutData.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                        maxLength={19}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('cart.validCardNumber')}</p>
                    </div>

                    {/* CVV */}
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('cart.cvv')}</label>
                      <input
                        type="text"
                        value={checkoutData.cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                        maxLength={4}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('cart.validCVV')}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <p className="text-xs text-blue-700">
                          Your payment information is secure and encrypted. We do not store your card details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total and Actions */}
                <div className="mb-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('cart.total')}:</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckoutForm(false)}
                    className="flex-1 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={
                      loading || 
                      !checkoutData.phone || 
                      !checkoutData.address ||
                      (checkoutData.paymentMethod === 'card' && (!checkoutData.cardNumber || !checkoutData.cvv || !checkoutData.cardholderName))
                    }
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('cart.processing')}
                      </span>
                    ) : (
                      t('cart.completeOrder')
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;

