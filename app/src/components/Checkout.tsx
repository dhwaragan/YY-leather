/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, MapPin, RefreshCw, ShoppingBag, ShieldCheck, GraduationCap, Gift, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { RazorpayPaymentForm } from './RazorpayPaymentForm';

const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

type AppliedOffer = 'none' | 'student' | 'birthday' | 'buyback' | 'both';

export const Checkout: React.FC = () => {
  const { cart, user, navigateTo, clearCart, sitewideDiscount, festivalCombineWithOffers, festivalName, isFestivalActive, refreshAllData, decrementStock } = useApp();
  
  const [address, setAddress] = useState(user?.address || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [editableName, setEditableName] = useState(user?.name || '');
  
  // Birthday Benefit state
  const [includeBirthdayBenefit, setIncludeBirthdayBenefit] = useState<boolean | undefined>(undefined);
  const [birthdayGovIdNumber, setBirthdayGovIdNumber] = useState('');
  const [birthdayDob, setBirthdayDob] = useState('');
  const [birthdayGovIdPhotoUrl, setBirthdayGovIdPhotoUrl] = useState('');

  // Student Discount state
  const [includeStudentDiscount, setIncludeStudentDiscount] = useState<boolean | undefined>(undefined);
  const [studentCollegeName, setStudentCollegeName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [studentIdPhotoUrl, setStudentIdPhotoUrl] = useState('');

  const [isAssemblingGateway, setIsAssemblingGateway] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);

  // Order body for saving after payment
  const [orderBody, setOrderBody] = useState<any>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('orderSuccess')) {
      setOrderSuccess(true);
      clearCart();
      setOrderId(query.get('session_id'));
    }
    if (query.get('orderCancelled')) {
      setCheckoutError('Your order was cancelled. Please try again.');
    }
  }, [clearCart]);

  const subtotal = cart.reduce((acc, item) => {
    const resolvedPrice = Number((item.product as any).sizePrices?.[item.selectedSize] ?? item.product.price) || 0;
    return acc + resolvedPrice * item.quantity;
  }, 0);
  const effectiveSitewideDiscount = (isFestivalActive && sitewideDiscount > 0) ? sitewideDiscount : 0;
  const subtotalAfterSitewide = effectiveSitewideDiscount > 0 ? Math.round(subtotal * (1 - effectiveSitewideDiscount / 100)) : subtotal;
  const processingFee = Math.round(subtotalAfterSitewide * 0.015);

  const getDeliveryCharge = (state: string, weightKg: number) => {
    const stateLower = state.toLowerCase();
    
    // Flat ₹1 - Take away from store (NOT per kg)
    if (stateLower === 'take away from store') {
      return 1;
    }
    
    // ₹60 Per KG - Chennai
    if (stateLower === 'chennai') {
      return 60 * weightKg;
    }
    
    // ₹80 Per KG - Tamil Nadu (Except Chennai)
    if (stateLower === 'tamil nadu') {
      return 80 * weightKg;
    }
    
    // ₹100 Per KG - Andhra Pradesh, Goa, Karnataka, Kerala, Odisha, Telangana, Puducherry
    if (['andhra pradesh', 'goa', 'karnataka', 'kerala', 'odisha', 'telangana', 'puducherry'].includes(stateLower)) {
      return 100 * weightKg;
    }
    
    // ₹180 Per KG - New Delhi, Bihar, Chhattisgarh, Gujarat, Jharkhand, Madhya Pradesh, Maharashtra, Uttar Pradesh
    if (['new delhi', 'delhi', 'bihar', 'chhattisgarh', 'gujarat', 'jharkhand', 'madhya pradesh', 'maharashtra', 'uttar pradesh'].includes(stateLower)) {
      return 180 * weightKg;
    }
    
    // ₹200 Per KG - Haryana, Himachal Pradesh, Punjab, Rajasthan, Uttarakhand, West Bengal
    if (['haryana', 'himachal pradesh', 'punjab', 'rajasthan', 'uttarakhand', 'west bengal'].includes(stateLower)) {
      return 200 * weightKg;
    }
    
    // ₹250 Per KG - Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura
    if (['arunachal pradesh', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'].includes(stateLower)) {
      return 250 * weightKg;
    }
    
    // Contact Us - Jammu & Kashmir, Andaman & Nicobar Islands
    if (['jammu & kashmir', 'jammu and kashmir', 'andaman & nicobar islands', 'andaman and nicobar islands'].includes(stateLower)) {
      return 0; // Will trigger manual quote
    }
    
    // Default: ₹1 for testing (any other states)
    return 1 * weightKg;
  };

  const deliveryRates = [
    { state: 'Take away from store', rate: 1, color: 'bg-green-100 border-green-300' },
    { state: 'Chennai', rate: 60, color: 'bg-purple-100 border-purple-300' },
    { state: 'Tamil Nadu', rate: 80, color: 'bg-blue-100 border-blue-300' },
    { state: 'Andhra Pradesh', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Goa', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Karnataka', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Kerala', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Odisha', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Telangana', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'Puducherry', rate: 100, color: 'bg-green-100 border-green-300' },
    { state: 'New Delhi', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Bihar', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Chhattisgarh', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Gujarat', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Jharkhand', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Madhya Pradesh', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Maharashtra', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Uttar Pradesh', rate: 180, color: 'bg-yellow-100 border-yellow-300' },
    { state: 'Haryana', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'Himachal Pradesh', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'Punjab', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'Rajasthan', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'Uttarakhand', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'West Bengal', rate: 200, color: 'bg-orange-100 border-orange-300' },
    { state: 'Arunachal Pradesh', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Assam', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Manipur', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Meghalaya', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Mizoram', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Nagaland', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Sikkim', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Tripura', rate: 250, color: 'bg-red-100 border-red-300' },
    { state: 'Jammu & Kashmir', rate: null, contact: true, color: 'bg-gray-100 border-gray-300' },
    { state: 'Andaman & Nicobar Islands', rate: null, contact: true, color: 'bg-gray-100 border-gray-300' },
  ];

  const estimatedWeightKg = cart.reduce((acc, item) => acc + (item.product.weight_kg ?? 1) * item.quantity, 0) || 1;
  const selectedDeliveryRate = deliveryRates.find((item) => item.state === selectedState);
  const deliveryCharge = getDeliveryCharge(selectedState, estimatedWeightKg);
  const requiresManualQuote = selectedDeliveryRate?.rate === null;

  // ----- OFFER LOGIC: Buyback and Student discount can apply simultaneously -----
  
  const [appliedOffer, setAppliedOffer] = useState<AppliedOffer>('none');
  const [selectedBuybackForCheckout, setSelectedBuybackForCheckout] = useState<boolean | undefined>(undefined);

  // Buyback and Student discount can be ON simultaneously; Birthday remains exclusive
  const handleStudentToggle = (value: boolean) => {
    // If festival combine is NO, disable student discount
    if (!festivalCombineWithOffers && sitewideDiscount > 0) {
      alert('Student discount is not available during this festival offer. Only festival discount applies.');
      return;
    }
    if (value) {
      setAppliedOffer(selectedBuybackForCheckout ? 'both' : 'student');
      setIncludeBirthdayBenefit(false);
      setIncludeStudentDiscount(true);
    } else {
      if (selectedBuybackForCheckout) {
        setAppliedOffer('buyback');
      } else {
        setAppliedOffer('none');
      }
      setIncludeStudentDiscount(false);
    }
  };

  const handleBirthdayToggle = (value: boolean) => {
    // If festival combine is NO, disable birthday benefit
    if (!festivalCombineWithOffers && sitewideDiscount > 0) {
      alert('Birthday benefit is not available during this festival offer. Only festival discount applies.');
      return;
    }
    if (value) {
      setAppliedOffer('birthday');
      setIncludeStudentDiscount(false);
      setSelectedBuybackForCheckout(false);
      setIncludeBirthdayBenefit(true);
    } else {
      setAppliedOffer('none');
      setIncludeBirthdayBenefit(false);
    }
  };

  const handleBuybackToggle = (value: boolean) => {
    // If festival combine is NO, disable buyback
    if (!festivalCombineWithOffers && sitewideDiscount > 0) {
      alert('Buyback benefit is not available during this festival offer. Only festival discount applies.');
      return;
    }
    if (value) {
      setAppliedOffer(includeStudentDiscount ? 'both' : 'buyback');
      setIncludeBirthdayBenefit(false);
      setSelectedBuybackForCheckout(true);
    } else {
      if (includeStudentDiscount) {
        setAppliedOffer('student');
      } else {
        setAppliedOffer('none');
      }
      setSelectedBuybackForCheckout(false);
    }
  };

  // Discount values - Buyback and Student discount can stack
  const studentDiscountAmount = includeStudentDiscount ? 100 : 0;
  const birthdayDiscount = includeBirthdayBenefit ? 250 : 0;
  // FIXED: YES = 0% OFF (no discount), NO = 10% OFF (compensation)
  // UPDATED: YES = 10% OFF, NO = 0% OFF (flipped logic)
  const buybackDiscountAmount = selectedBuybackForCheckout ? Math.min(subtotalAfterSitewide * 0.1, 500) : 0;
  
  // Total discount - Buyback + Student can stack, Birthday is separate
  const totalOfferDiscount = studentDiscountAmount + birthdayDiscount + buybackDiscountAmount;
  // 5% Tax applied on the discounted subtotal (after sitewide + offer discounts)
  const taxableAmount = Math.max(0, subtotalAfterSitewide - totalOfferDiscount);
  const taxAmount = Math.round(taxableAmount * 0.05);
  const orderTotal = Math.max(0, taxableAmount + processingFee + deliveryCharge + taxAmount);

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

  const handleBirthdayPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBirthdayGovIdPhotoUrl(dataUrl);
    } catch {
      alert('Could not read the selected ID image. Please try another file.');
    }
  };

  const handleStudentPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setStudentIdPhotoUrl(dataUrl);
    } catch {
      alert('Could not read the selected ID image. Please try another file.');
    }
  };

  // ----- ADMIN FREE ORDER STATE -----
  const [isAdminFreeOrder, setIsAdminFreeOrder] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (cart.length === 0) return;
    if (!address.trim()) {
      alert('Please provide shipping coordinates!');
      return;
    }

    if (requiresManualQuote) {
      setCheckoutError('Please contact us for shipping rates for this region. Automatic checkout is disabled for this delivery area.');
      return;
    }

    // Validate offer selections
    if (includeBirthdayBenefit && (!birthdayGovIdNumber || !birthdayDob || !birthdayGovIdPhotoUrl)) {
      alert('Please provide the government ID details for the birthday benefit request.');
      return;
    }

    if (includeStudentDiscount && (!studentCollegeName || !studentIdNumber || !studentIdPhotoUrl)) {
      alert('Please provide the college details and ID photo for the student discount.');
      return;
    }

    setIsAssemblingGateway(true);

    if (!user) {
      alert('Please log in before completing checkout.');
      return;
    }

    try {
      const body = {
        address,
        phone: phoneNumber,
        customer_email: user.email,
        customer_name: editableName || user.name, // Use editable name if changed
        user_id: user.id,
        items: cart,
        total: orderTotal,
        tax_amount: taxAmount,
        delivery_region: selectedState,
        delivery_charge: deliveryCharge,
        estimated_weight_kg: estimatedWeightKg,
        student_discount_requested: includeStudentDiscount,
        student_discount_details: includeStudentDiscount ? {
          college_name: studentCollegeName,
          student_id_number: studentIdNumber,
          student_id_photo_url: studentIdPhotoUrl,
          status: 'Pending'
        } : undefined,
        birthday_benefit_requested: includeBirthdayBenefit,
        birthday_benefit_details: includeBirthdayBenefit ? {
          gov_id_number: birthdayGovIdNumber,
          dob: birthdayDob,
          gov_id_photo_url: birthdayGovIdPhotoUrl,
          status: 'Pending'
        } : undefined,
        buyback_requested: selectedBuybackForCheckout,
        buyback_details: selectedBuybackForCheckout ? {
          status: 'Pending'
        } : undefined,
        applied_offer: appliedOffer,
        is_admin_free_order: isAdminFreeOrder,
        admin_password: adminPassword,
      };

      setOrderBody(body);

      // ----- ADMIN FREE ORDER BYPASS -----
      if (isAdminFreeOrder) {
        if (!adminPassword.trim()) {
          setCheckoutError('Admin password is required for free orders.');
          setIsAssemblingGateway(false);
          return;
        }

        const saveOrderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            delivery_state: selectedState,
            status: 'Ordered',
            phone: body.phone || phoneNumber,
          }),
        });

        const saveOrderData = await saveOrderResponse.json();
        
        if (!saveOrderResponse.ok) {
          throw new Error(saveOrderData.message || 'Failed to place admin free order.');
        }

        await decrementStock(cart);
        refreshAllData(true);
        
        setOrderId('admin_free_order');
        setOrderSuccess(true);
        clearCart();
        setTimeout(() => navigateTo('user-profile'), 2000);
        return;
      }
      // -----------------------------------

      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotal,
          receipt: `receipt_${Date.now()}`,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.id) {
        throw new Error(orderData.error || 'Unable to create Razorpay order.');
      }

      setRazorpayOrderId(orderData.id);
      setIsPaymentReady(true);
      setIsAssemblingGateway(false);
      return;
    } catch (err) {
      console.error(err);
      setCheckoutError('Unable to process payment at the moment.');
      setIsAssemblingGateway(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, rzpOrderId: string, signature: string) => {
    try {
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData.verified) {
        throw new Error(verifyData.message || 'Payment verification failed.');
      }

      if (orderBody) {
        // Save order with Ordered status - user sees it immediately, admin can approve to Pending
        const saveOrderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderBody,
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: paymentId,
            delivery_state: selectedState,
            status: 'Ordered', // Order starts as Ordered, admin approves to Pending
            phone: orderBody.phone || phoneNumber, // Ensure phone is saved
          }),
        });

        if (!saveOrderResponse.ok) {
          console.error('Failed to save order after payment, but payment was successful.');
        }
        
        // Decrement stock for purchased items
        await decrementStock(cart);
        
        // Refresh orders instantly so user can see it in "My Orders"
        refreshAllData(true);
      }

      setOrderId(paymentId);
      setOrderSuccess(true);
      clearCart();
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigateTo('user-profile');
      }, 2000);
    } catch (err) {
      console.error(err);
      setCheckoutError('Payment was successful but we encountered an issue verifying it. Please contact support with your payment ID: ' + paymentId);
      setIsPaymentReady(false);
      setRazorpayOrderId(null);
    }
  };

  const handlePaymentError = (message: string) => {
    setCheckoutError(message);
    setIsPaymentReady(false);
    setRazorpayOrderId(null);
  };

  const handlePaymentCancel = () => {
    setIsPaymentReady(false);
    setRazorpayOrderId(null);
    setCheckoutError('Payment was cancelled. You can try again.');
  };

  if (orderSuccess) {
    return (
      <div id="checkout-completed-stage" className="min-h-screen bg-neutral-50 pt-36 pb-24 px-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border-2 border-gold max-w-xl w-full p-10 rounded-2xl shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-green-50 text-green-500 border border-green-200 rounded-full flex items-center justify-center text-3xl font-bold mx-auto animate-pulse">✓</div>
          <h2 className="font-serif text-3xl font-bold text-neutral-800">Order Confirmed!</h2>
          <p className="text-xs text-gold uppercase tracking-[0.25em] font-bold">Razorpay Payment ID: {orderId}</p>
          <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-100 text-left text-xs font-sans text-neutral-600 space-y-2 max-w-md mx-auto">
            <p className="border-b pb-2"><strong>Your order has been successfully placed.</strong></p>
            <p><strong>Recipient:</strong> {user?.name}</p>
            <p><strong>Shipping Address:</strong> {address}</p>
            <p><strong>Total Paid:</strong> ₹{orderTotal.toLocaleString('en-IN')}</p>
            {appliedOffer !== 'none' && (
              <p className="text-green-700 font-semibold">✓ {appliedOffer === 'student' ? 'Student Discount' : appliedOffer === 'birthday' ? 'Birthday Benefit' : appliedOffer === 'both' ? 'Buyback + Student Benefits' : 'Buyback Benefit'} Applied</p>
            )}
            <p className="text-[10px] text-neutral-450 leading-relaxed pt-2.5">You will receive an email confirmation shortly. Thank you for your purchase from YY Leathers.</p>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <button onClick={() => navigateTo('user-profile')} className="bg-leather text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded hover:bg-gold transition-colors cursor-pointer">Track Order</button>
            <button onClick={() => navigateTo('shop')} className="border border-neutral-300 text-neutral-700 font-sans text-xs uppercase tracking-widest font-semibold py-3.5 px-6 rounded hover:bg-neutral-50 transition-colors cursor-pointer">Continue Shopping</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="checkout-page-viewport" className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center space-y-2 mb-12">
          <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block col-span-2">SECURE ROYAL BILLING PORTAL</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide text-leather">Handcrafted checkout</h1>
        </div>

        {checkoutError && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-center text-xs mb-8 max-w-lg mx-auto">{checkoutError}</div>}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 font-sans">
              <p className="font-bold mb-1">🎯 Offers Available</p>
              <p><strong>Buyback Benefit</strong> and <strong>Student Discount (₹100 OFF)</strong> can be applied together! <strong>Birthday Benefit (₹250 OFF)</strong> is exclusive.</p>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white border p-12 text-center rounded-2xl max-w-md mx-auto space-y-6">
            <ShoppingBag className="w-16 h-16 text-neutral-200 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-neutral-600">Your Checkout Trunk remains Empty</h3>
            <button onClick={() => navigateTo('shop')} className="bg-leather text-white text-xs uppercase font-sans tracking-widest font-bold py-3 px-6 rounded hover:bg-gold transition-all">Savor the Catalog</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl shadow-md overflow-hidden">
              <div className="bg-leather-dark text-white p-5 border-b border-gold/30 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="font-serif text-lg font-bold">Courier Shipping & Contact Details</h3>
                  <p className="text-[10px] text-neutral-300 font-sans uppercase">Secure Insured Freight Coverage</p>
                </div>
              </div>

              <div className="p-6 space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-neutral-500 uppercase tracking-wide">Patron Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={editableName} 
                      onChange={(e) => setEditableName(e.target.value)}
                      placeholder="Enter your full name" 
                      className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold text-xs" 
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-neutral-500 uppercase tracking-wide">Patron Contact Mail</label>
                    <input type="email" disabled value={user?.email || ''} className="w-full p-3 bg-neutral-55 border border-neutral-150 text-neutral-450 rounded-lg cursor-not-allowed text-[11px]" />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-600 uppercase tracking-wide">Mobile Number *</label>
                  <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Provide Chennai or national mobile coord (e.g., +91 98400 12345)" className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold text-xs" />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-600 uppercase tracking-wide">Address *</label>
                  <textarea required rows={4} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="State Gated apartments, Door levels, streets, City, State, and ZIP PIN code..." className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold text-xs leading-relaxed" />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-600 uppercase tracking-wide">Delivery State *</label>
                  <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold text-xs">
                    {deliveryRates.map((item) => (<option key={item.state} value={item.state}>{item.state} {typeof item.rate === 'number' ? (item.state === 'Take away from store' ? `(₹${item.rate})` : `(₹${item.rate}/Kg)`) : item.contact ? '(Contact for rate)' : ''}</option>))}
                  </select>
                  {requiresManualQuote && (
                    <div className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      📞 Special Destination Delivery: Please contact us at <strong>09344178585</strong> for custom shipping rates to your location.
                    </div>
                  )}
                  {!requiresManualQuote && (<p className="text-[10px] text-neutral-500 mt-2">
                    {selectedState === 'Take away from store' 
                      ? 'Store pickup: Flat ₹1 (no weight calculation)' 
                      : `Estimated weight: ${estimatedWeightKg.toFixed(1)} kg. Delivery fee = ₹${selectedDeliveryRate?.rate ?? 0} × ${estimatedWeightKg.toFixed(1)} = ₹${deliveryCharge.toLocaleString('en-IN')}.`
                    }
                  </p>)}
                </div>

                 {/* --- OFFER 1: BUYBACK --- */}
                <div className={`space-y-3 bg-white p-3 rounded border shadow-sm mt-3 font-sans ${!festivalCombineWithOffers && sitewideDiscount > 0 ? 'border-neutral-200 opacity-60' : 'border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                      Buyback / Upgrade Benefit No Needed?
                    </label>
                    <div className="flex bg-neutral-100 rounded p-1">
                      <button type="button" onClick={() => handleBuybackToggle(true)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${selectedBuybackForCheckout === true ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={includeBirthdayBenefit || (!festivalCombineWithOffers && sitewideDiscount > 0)}>YES</button>
                      <button type="button" onClick={() => handleBuybackToggle(false)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${selectedBuybackForCheckout === false ? 'bg-neutral-500 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={(!festivalCombineWithOffers && sitewideDiscount > 0)}>NO</button>
                    </div>
                  </div>
                  {!festivalCombineWithOffers && sitewideDiscount > 0 && (
                    <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded p-2">⚠️ Buyback benefit is disabled during festival offer. Only festival discount applies.</div>
                  )}
                  {selectedBuybackForCheckout && festivalCombineWithOffers && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">✅ No Buyback Needed — 10% OFF applied as thank you for choosing YY Leathers!</div>
                  )}
                  {selectedBuybackForCheckout === false && festivalCombineWithOffers && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">💸 Buyback Accepted — Your old YY Leathers footwear will be evaluated for store credit (0% OFF).</div>
                  )}
                </div>

                {/* --- OFFER 2: STUDENT DISCOUNT --- */}
                <div className={`space-y-3 bg-white p-3 rounded border shadow-sm mt-3 font-sans ${!festivalCombineWithOffers && sitewideDiscount > 0 ? 'border-neutral-200 opacity-60' : 'border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-blue-600" /> Student Discount? (Flat ₹100 OFF)</label>
                    <div className="flex bg-neutral-100 rounded p-1">
                      <button type="button" onClick={() => handleStudentToggle(true)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${includeStudentDiscount === true ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={includeBirthdayBenefit || (!festivalCombineWithOffers && sitewideDiscount > 0)}>YES</button>
                      <button type="button" onClick={() => handleStudentToggle(false)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${includeStudentDiscount === false ? 'bg-neutral-500 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={(!festivalCombineWithOffers && sitewideDiscount > 0)}>NO</button>
                    </div>
                  </div>
                  {!festivalCombineWithOffers && sitewideDiscount > 0 && (
                    <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded p-2">⚠️ Student discount is disabled during festival offer. Only festival discount applies.</div>
                  )}
                  {includeStudentDiscount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-neutral-200 p-1">
                      <div className="sm:col-span-2"><input type="text" value={studentCollegeName} onChange={(e) => setStudentCollegeName(e.target.value)} required placeholder="College / University Name" className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-blue-500" /></div>
                      <div><input type="text" value={studentIdNumber} onChange={(e) => setStudentIdNumber(e.target.value)} required placeholder="Student ID Number" className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-blue-500" /></div>
                      <div><div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-neutral-500 whitespace-nowrap">Upload College ID:</span><input type="file" accept="image/*" onChange={handleStudentPhotoChange} required className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-blue-500" /></div></div>
                      {studentIdPhotoUrl && <div className="sm:col-span-2"><img src={studentIdPhotoUrl} alt="Student ID" className="mt-1 h-24 w-full object-cover rounded border border-neutral-200" /></div>}
                    </div>
                  )}
                </div>

                {/* --- OFFER 3: BIRTHDAY BENEFIT --- */}
                <div className={`space-y-3 bg-white p-3 rounded border shadow-sm mt-3 font-sans ${!festivalCombineWithOffers && sitewideDiscount > 0 ? 'border-neutral-200 opacity-60' : 'border-pink-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide flex items-center gap-2"><Gift className="w-3.5 h-3.5 text-pink-600" /> Birthday Benefit? (Flat ₹250 OFF Online)</label>
                    <div className="flex bg-neutral-100 rounded p-1">
                      <button type="button" onClick={() => handleBirthdayToggle(true)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${includeBirthdayBenefit === true ? 'bg-pink-600 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={includeStudentDiscount || selectedBuybackForCheckout || (!festivalCombineWithOffers && sitewideDiscount > 0)}>YES</button>
                      <button type="button" onClick={() => handleBirthdayToggle(false)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${includeBirthdayBenefit === false ? 'bg-neutral-500 text-white' : 'text-neutral-500 hover:text-neutral-800'}`} disabled={(!festivalCombineWithOffers && sitewideDiscount > 0)}>NO</button>
                    </div>
                  </div>
                  {!festivalCombineWithOffers && sitewideDiscount > 0 && (
                    <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded p-2">⚠️ Birthday benefit is disabled during festival offer. Only festival discount applies.</div>
                  )}
                  {includeBirthdayBenefit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-neutral-200 p-1">
                      <div><input type="text" value={birthdayGovIdNumber} onChange={(e) => setBirthdayGovIdNumber(e.target.value)} required placeholder="Government ID number" className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-pink-500" /></div>
                      <div><input type="date" value={birthdayDob} onChange={(e) => setBirthdayDob(e.target.value)} required title="Date of birth" className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-pink-500" /></div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">Upload government ID photo</label>
                        <input type="file" accept="image/*" onChange={handleBirthdayPhotoChange} required className="w-full text-xs p-2 border rounded bg-white text-neutral-800 focus:border-pink-500" />
                        {birthdayGovIdPhotoUrl && <img src={birthdayGovIdPhotoUrl} alt="Selected government ID" className="mt-2 h-24 w-full object-cover rounded border border-neutral-200" />}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gold/5 border border-gold/15 p-4 rounded-lg flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gold flex-shrink-0" />
                  <div className="text-[11px] text-neutral-600 leading-relaxed">
                    <span className="font-bold text-leather-dark uppercase tracking-wider block mb-0.5">SECURE PAYMENT VIA RAZORPAY</span>
                    Your transaction will be securely processed by Razorpay. All major UPI, Credit/Debit Cards, Net Banking, and Wallets are accepted.
                    {razorpayKeyId ? <span className="block mt-1 text-[10px] text-green-700">Razorpay is configured for payments.</span> : <span className="block mt-1 text-[10px] text-amber-700">Razorpay key is not configured yet.</span>}
                  </div>
                </div>
                
                {user?.email === 'dhwaragandhwaragan9@gmail.com' && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900 text-xs">
                      <input 
                        type="checkbox" 
                        checked={isAdminFreeOrder}
                        onChange={(e) => setIsAdminFreeOrder(e.target.checked)}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      Bypass Payment (Admin Free Order)
                    </label>
                    {isAdminFreeOrder && (
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                        className="w-full p-2 border border-red-200 rounded text-xs focus:outline-none focus:border-red-400"
                        required={isAdminFreeOrder}
                      />
                    )}
                  </div>
                )}
              </div>

              {isPaymentReady && razorpayOrderId ? (
                <div className="border-t border-neutral-100 bg-neutral-50 p-6">
                  <RazorpayPaymentForm amount={orderTotal} orderId={razorpayOrderId} razorpayKeyId={razorpayKeyId} customerName={editableName || user?.name || 'Customer'} customerEmail={user?.email || ''} customerPhone={phoneNumber} notes={{ user_id: user?.id || '', address, customer_name: editableName || user?.name || '', delivery_region: selectedState, delivery_charge: String(deliveryCharge), estimated_weight_kg: String(estimatedWeightKg), items: JSON.stringify(cart), phone: phoneNumber, applied_offer: appliedOffer }} onSuccess={handlePaymentSuccess} onError={handlePaymentError} onCancel={handlePaymentCancel} />
                </div>
              ) : (
                <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-450 font-sans tracking-wide">※ High-Arch premium welt adjustments included on dispatch.</span>
                  <button type="submit" disabled={isAssemblingGateway || requiresManualQuote} className="bg-leather hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded-md shadow-md transition-all duration-350 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isAssemblingGateway ? (<><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</>) : (isAdminFreeOrder ? 'PLACE FREE ADMIN ORDER' : `PAY WITH RAZORPAY (₹${orderTotal.toLocaleString('en-IN')})`)}
                  </button>
                </div>
              )}
            </form>

            <div id="checkout-invoice-summary" className="lg:col-span-12 xl:col-span-5 bg-white border border-neutral-200 rounded-2xl shadow-md p-6 space-y-6">
              <h3 className="font-serif text-lg font-bold border-b border-neutral-100 pb-3 text-neutral-800">Your Luxury Trunk Details</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item, id) => (
                  <div key={id} className="flex items-center gap-4 text-xs">
                    <img src={item.product.images[0] || undefined} alt="" className="w-12 h-12 object-cover rounded border border-neutral-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-neutral-800 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-neutral-400 font-sans tracking-widest uppercase">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                    </div>
                    <span className="font-sans font-bold text-neutral-800">₹{((Number((item.product as any).sizePrices?.[item.selectedSize] ?? item.product.price) || 0) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-3 font-sans text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Trunk Subtotal</span>
                  <span className="font-bold text-neutral-800">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {effectiveSitewideDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>🎉 {festivalName || 'Festival Offer'} ({effectiveSitewideDiscount}% OFF)</span>
                    <span className="font-bold">-₹{(subtotal - subtotalAfterSitewide).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Processing Fee (1.5%)</span>
                  <span className="font-bold text-neutral-800">₹{processingFee.toLocaleString('en-IN')}</span>
                </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Delivery Charge ({selectedState})</span>
                    <span className="font-bold text-neutral-800">{requiresManualQuote ? 'Contact' : `₹${deliveryCharge.toLocaleString('en-IN')}`}</span>
                  </div>

                {includeStudentDiscount && (<div className="flex justify-between text-blue-600"><span>🎓 Student Discount</span><span className="font-bold">-₹{studentDiscountAmount.toLocaleString('en-IN')}</span></div>)}
                {includeBirthdayBenefit && (<div className="flex justify-between text-pink-600"><span>🎂 Birthday Benefit Discount</span><span className="font-bold">-₹{birthdayDiscount.toLocaleString('en-IN')}</span></div>)}
                {selectedBuybackForCheckout && (
                  <div className="flex justify-between text-amber-600">
                    <span>✅ No Buyback Needed (10% Off)</span>
                    <span className="font-bold">-₹{buybackDiscountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-500">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-neutral-800">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t border-neutral-150 pt-3 flex justify-between items-center text-neutral-800 font-bold text-sm">
                  <span>Grand Legacy Total</span>
                  <span className="text-lg text-leather text-black">₹{orderTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 border rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-gold flex-shrink-0" />
                <p className="text-[10px] text-neutral-450 leading-relaxed font-sans"><strong>YY Lifetime authentic Guarantee.</strong> Sourced from zero-waste local leather tanneries in Chennai. Blake-welted by hand.</p>
              </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-sm font-bold text-neutral-800">India Delivery Fee Rates</h4>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Per Kg</span>
                </div>
                
                {/* Chennai - Purple */}
                <div className="mb-3 p-3 rounded-xl border-2 border-purple-300 bg-purple-50">
                  <div className="text-xs font-bold text-purple-900 mb-1">🟣 Chennai</div>
                  <div className="text-sm font-bold text-purple-700">₹60 Per KG</div>
                </div>
                
                {/* Tamil Nadu - Blue */}
                <div className="mb-3 p-3 rounded-xl border-2 border-blue-300 bg-blue-50">
                  <div className="text-xs font-bold text-blue-900 mb-1">🔵 Tamil Nadu (Except Chennai)</div>
                  <div className="text-sm font-bold text-blue-700">₹80 Per KG</div>
                </div>
                
                {/* South States - Green */}
                <div className="mb-3 p-3 rounded-xl border-2 border-green-300 bg-green-50">
                  <div className="text-xs font-bold text-green-900 mb-1">🟢 Andhra Pradesh, Goa, Karnataka, Kerala, Odisha, Telangana, Puducherry</div>
                  <div className="text-sm font-bold text-green-700">₹100 Per KG</div>
                </div>
                
                {/* North States - Yellow */}
                <div className="mb-3 p-3 rounded-xl border-2 border-yellow-300 bg-yellow-50">
                  <div className="text-xs font-bold text-yellow-900 mb-1">🟡 New Delhi, Bihar, Chhattisgarh, Gujarat, Jharkhand, Madhya Pradesh, Maharashtra, Uttar Pradesh</div>
                  <div className="text-sm font-bold text-yellow-700">₹180 Per KG</div>
                </div>
                
                {/* North West & Himachal - Orange */}
                <div className="mb-3 p-3 rounded-xl border-2 border-orange-300 bg-orange-50">
                  <div className="text-xs font-bold text-orange-900 mb-1">🟠 Haryana, Himachal Pradesh, Punjab, Rajasthan, Uttarakhand, West Bengal</div>
                  <div className="text-sm font-bold text-orange-700">₹200 Per KG</div>
                </div>
                
                {/* North East - Red */}
                <div className="mb-3 p-3 rounded-xl border-2 border-red-300 bg-red-50">
                  <div className="text-xs font-bold text-red-900 mb-1">🔴 Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura</div>
                  <div className="text-sm font-bold text-red-700">₹250 Per KG</div>
                </div>
                
                {/* Contact Us - Black */}
                <div className="p-3 rounded-xl border-2 border-gray-300 bg-gray-50">
                  <div className="text-xs font-bold text-gray-900 mb-1">⚫ Jammu & Kashmir, Andaman & Nicobar Islands</div>
                  <div className="text-sm font-bold text-gray-700">Contact Us</div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-[10px] text-blue-800 font-semibold">📞 Special Destination?</p>
                  <p className="text-[10px] text-blue-700 mt-1">For Jammu & Kashmir and Andaman & Nicobar Islands, please contact us directly at <strong>09344178585</strong> for custom delivery rates.</p>
                </div>
                <p className="mt-2 text-[10px] text-neutral-500">Delivery is charged per kilogram. Rates are final and include insurance coverage.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};