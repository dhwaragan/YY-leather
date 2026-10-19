/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ClipboardList, PackagePlus, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PreorderPage: React.FC = () => {
  const { user, loginAsUser, submitPreorder, navigateTo } = useApp();
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [orderRefId, setOrderRefId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper to ensure 10-digit Indian mobile number
  const sanitizeIndianMobile = (val: string): string => {
    if (!val) return '';
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
    else if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  // Sizing Preference Form States
  const [styleDesc, setStyleDesc] = useState('');
  const [size, setSize] = useState('9');
  const [phone, setPhone] = useState(() => sanitizeIndianMobile(user?.phone || ''));
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to submit a pre-order.');
      return;
    }

    const cleanedPhone = sanitizeIndianMobile(phone);
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);
    
    const payload = {
      name: user.name,
      email: user.email,
      phone: `+91 ${cleanedPhone}`,
      style_desc: styleDesc,
      image_urls: [],
      size,
      color: 'N/A',
      sole: 'N/A',
      budget_range: 'N/A',
      notes,
      delivery_address: date
    };

    const orderId = await submitPreorder(payload);
    setIsSubmitting(false);
    if (orderId) {
      setOrderRefId(orderId as string);
      setFormSubmitted(true);
    } else {
      alert("Server failed to register. Please try again.");
    }
  };

  const shoesSizes = ["7", "8", "9", "10", "11", "12"];

  return (
    <div id="preorder-page-stage" className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none">
      <div className="w-full">
        
        {/* Header section describing preorder context */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block">
            IN-STORE PRE-ORDER
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide text-leather">
            Reserve Your Pair Today
          </h1>
          <p className="font-sans text-xs sm:text-sm text-neutral-550 max-w-xl mx-auto leading-relaxed">
            Pre-order your desired shoe model online and pick it up at our shop. Let us know when you're visiting and we'll have it ready for you.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {formSubmitted ? (
            <motion.div
              id="preorder-submit-confirmation"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border-2 border-gold p-10 rounded-2xl shadow-xl text-center max-w-xl mx-auto space-y-6"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 border border-green-200 rounded-full flex items-center justify-center text-3xl font-bold mx-auto animate-bounce">
                ✓
              </div>
              
              <h3 className="font-serif text-2xl font-bold text-neutral-800">
                Pre-Order Reserved
              </h3>
              <p className="text-xs tracking-widest text-gold uppercase mt-1 font-bold">
                Order Reference: {orderRefId}
              </p>

              <div className="bg-neutral-50 p-6 border rounded-lg text-left text-xs font-sans text-neutral-600 space-y-2.5">
                <p><strong>Customer Name:</strong> {user?.name}</p>
                <p><strong>Configured Size:</strong> UK Size {size}</p>
                <p><strong>Desired Model / Brand:</strong> {styleDesc}</p>
                <p><strong>Expected Visit Date:</strong> {date}</p>
                <p className="text-[10px] text-neutral-400 mt-4 pt-4 border-t leading-relaxed">
                  Our store team will review the demand and prepare your selected brand/model. Please show this reference number when you visit the shop.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <button
                  id="preorder-go-profile"
                  onClick={() => {
                    navigateTo("user-profile");
                  }}
                  className="bg-leather text-white text-xs uppercase tracking-widest font-bold py-3 px-6 rounded hover:bg-gold transition-colors cursor-pointer"
                >
                  View My Profile
                </button>
                <button
                  onClick={() => {
                    setFormSubmitted(false);
                    setStyleDesc('');
                    setNotes('');
                  }}
                  className="border border-neutral-300 text-neutral-600 text-xs uppercase tracking-widest font-semibold py-3 px-6 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Reserve Another
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto"
            >
              <div className="bg-leather-dark text-white p-6 border-b border-gold/35 flex items-center gap-3">
                <PackagePlus className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="font-serif text-lg font-bold">Pre-Order Reservation Info</h3>
                  <p className="text-[10px] text-neutral-300 font-sans uppercase">Tell us what you need for pickup</p>
                </div>
              </div>

              <div className="p-8 space-y-6">

                {/* Auto-filled details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-neutral-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-wider block">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 text-neutral-500 rounded font-sans focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-wider block">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 text-neutral-500 rounded font-sans focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-neutral-700 block">
                      Desired Shoe Model or Brand *
                    </label>
                    <input
                      required
                      type="text"
                      value={styleDesc}
                      onChange={(e) => setStyleDesc(e.target.value)}
                      placeholder="e.g., Nike Air Force 1, Vintage YY Leather Oxford, etc..."
                      className="w-full text-xs p-3 border border-neutral-200 rounded bg-white text-neutral-800 focus:outline-none focus:border-gold font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-sans font-semibold text-neutral-700 block">
                        Customer Mobile Number (10 digits) *
                      </label>
                      <div className="relative flex rounded border border-neutral-200 overflow-hidden focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/20 bg-white">
                        <span className="inline-flex items-center px-3 bg-neutral-100 text-neutral-700 text-xs font-semibold border-r border-neutral-200 select-none">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          required
                          value={phone}
                          onChange={(e) => setPhone(sanitizeIndianMobile(e.target.value))}
                          placeholder="9876543210"
                          className="w-full text-xs p-3 text-neutral-800 focus:outline-none font-mono tracking-wider font-semibold"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-sans">
                        Enter 10-digit mobile number ({phone.length}/10)
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-sans font-semibold text-neutral-700 block">
                        Expected Visit / Pick-up Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs p-3 border border-neutral-200 rounded text-neutral-800 focus:outline-none focus:border-gold font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Sizing selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-neutral-600 block mb-1">
                      Foot Size (UK / India)
                    </label>
                    <div className="flex gap-2">
                      {shoesSizes.map((sz) => (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => setSize(sz)}
                          className={`py-2 px-4 text-[11px] font-sans font-bold rounded border cursor-pointer ${
                            size === sz
                              ? 'bg-gold text-white border-gold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-gold'
                          }`}
                        >
                          UK {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-neutral-700 block">
                      Additional Notes / Alternatives (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Specify color preference, alternate options, or any special requests..."
                      className="w-full text-xs p-3 border border-neutral-200 rounded text-neutral-800 focus:outline-none focus:border-gold font-sans"
                      rows={2}
                    />
                  </div>
                </div>

              </div>

              {/* Form Submission actions */}
              <div className="bg-neutral-50 px-8 py-5 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] text-neutral-450 font-sans tracking-wide">
                  * Triggers immediate notification to shop managers to prepare your order.
                </span>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-leather hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 px-8 rounded shadow-md transition-all duration-300 transform scroll-smooth cursor-pointer"
                >
                  {isSubmitting ? 'Reserving...' : 'Confirm Pre-order'}
                </button>
              </div>

            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

