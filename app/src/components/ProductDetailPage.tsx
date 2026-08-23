/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { X, ShoppingBag, Eye, Calendar, Sparkles, Shield, RefreshCw, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { optimizeImage } from '../utils/images';

interface ProductDetailPageProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onClose }) => {
  const { addToCart, navigateTo, user, checkout, updateProduct, sitewideDiscount } = useApp();
  
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState<string>(() => (product.sizePrices ? Object.keys(product.sizePrices)[0] : '9'));
  const [qty, setQty] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [buyNowAddress, setBuyNowAddress] = useState(user?.address || '');
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  
  // Get available stock for selected size
  const getAvailableStock = (size: string): number => {
    return (product as any).sizeQuantities?.[size] ?? Infinity;
  };
  
  const currentStock = getAvailableStock(selectedSize);
  const maxAllowedQty = currentStock === Infinity ? 10 : Math.min(10, currentStock);

  React.useEffect(() => {
    if (product.sizePrices) {
      const first = Object.keys(product.sizePrices)[0];
      if (first) setSelectedSize(first);
    }
  }, [product]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Premium interactive states
  const [selectedColor, setSelectedColor] = useState(
    product.id === "prod-1021" ? "Rich Tan" : "Original"
  );
  const [accordionTab, setAccordionTab] = useState<string | null>("features");

  // Buy back offer states
  const [includeBuyBack, setIncludeBuyBack] = useState<boolean | undefined>(undefined);
  const [bbShoeDetails, setBbShoeDetails] = useState('');
  const [bbBillNo, setBbBillNo] = useState('');
  const [bbBoughtDate, setBbBoughtDate] = useState('');
  const [bbPhotoUrl, setBbPhotoUrl] = useState('');
  const [includeBirthdayBenefit, setIncludeBirthdayBenefit] = useState<boolean | undefined>(undefined);
  const [birthdayGovIdNumber, setBirthdayGovIdNumber] = useState('');
  const [birthdayDob, setBirthdayDob] = useState('');
  const [birthdayGovIdPhotoUrl, setBirthdayGovIdPhotoUrl] = useState('');
  const [includeStudentDiscount, setIncludeStudentDiscount] = useState<boolean | undefined>(undefined);
  const [studentCollegeName, setStudentCollegeName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [studentIdPhotoUrl, setStudentIdPhotoUrl] = useState('');

  // 3D viewer controls
  const [rotateDeg, setRotateDeg] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [activeView, setActiveView] = useState<'image' | 'rotate'>('image');
  const [isZoomed, setIsZoomed] = useState(false);
  const [blowoutTab, setBlowoutTab] = useState<'leather' | 'welt' | 'sole'>('leather');

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

  const handleBbPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBbPhotoUrl(dataUrl);
    } catch {
      alert('Could not read the selected shoe image. Please try another file.');
    }
  };

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
      alert('Could not read the selected student ID image. Please try another file.');
    }
  };

  const handleColorChange = (colorName: string, colorImg: string) => {
    setSelectedColor(colorName);
    setActiveImage(colorImg);
  };

  const currentPrice = product.sizePrices && selectedSize ? (product.sizePrices as any)[selectedSize] ?? product.price : product.price;
  const currentMRP = product.sizeMRPs && selectedSize ? (product.sizeMRPs as any)[selectedSize] ?? product.mrp : product.mrp;
  const showMRP = currentMRP != null && currentMRP > currentPrice;
  const totalValue = currentPrice * qty;
  const sitewideDiscountedPrice = sitewideDiscount > 0 ? Math.round(currentPrice * (1 - sitewideDiscount / 100)) : currentPrice;

  const totalValueWithBuyback = includeBuyBack
    ? Math.round(totalValue * 0.9)
    : includeBirthdayBenefit
    ? Math.max(0, totalValue - 250)
    : totalValue;




  const handleAddToCart = () => {
    if (!user) {
      alert("Please sign in to add products to your cart and make purchases.");
      navigateTo("user-profile");
      onClose();
      return;
    }
    for (let i = 0; i < qty; i++) {
      addToCart(product, selectedSize);
    }
    onClose();
  };

  const handleBuyNowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to make purchases.");
      navigateTo("user-profile");
      onClose();
      return;
    }
    if (!buyNowAddress.trim()) {
      alert("Please enter your delivery coordinates address!");
      return;
    }
    
    if (includeBuyBack && (!bbShoeDetails || !bbBillNo || !bbBoughtDate || !bbPhotoUrl)) {
      alert("Please fill all the buy back details to proceed with the offer.");
      return;
    }

    if (includeBirthdayBenefit && (!birthdayGovIdNumber || !birthdayDob || !birthdayGovIdPhotoUrl)) {
      alert("Please provide the government ID number, date of birth, and ID photo for the birthday benefit.");
      return;
    }

    if (includeStudentDiscount && (!studentCollegeName || !studentIdNumber || !studentIdPhotoUrl)) {
      alert("Please provide college name, student ID number, and ID photo for the student discount.");
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Add product to cart first
      addToCart(product, selectedSize);
      
      const currentPrice = product.sizePrices && selectedSize ? (product.sizePrices as any)[selectedSize] ?? product.price : product.price;
      
      const buybackData = includeBuyBack ? {
        shoe_details: bbShoeDetails,
        bill_no: bbBillNo,
        bought_date: bbBoughtDate,
        photo_url: bbPhotoUrl
      } : undefined;

      const birthdayBenefitData = includeBirthdayBenefit ? {
        gov_id_number: birthdayGovIdNumber,
        dob: birthdayDob,
        gov_id_photo_url: birthdayGovIdPhotoUrl
      } : undefined;

      if (!user) {
        alert('Please log in before completing your purchase.');
        return;
      }

      const studentDiscountData = includeStudentDiscount ? {
        college_name: studentCollegeName,
        student_id_number: studentIdNumber,
        student_id_photo_url: studentIdPhotoUrl
      } : undefined;

      // Save pending order to localStorage for checkout page
      const pendingOrder = {
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        address: buyNowAddress,
        phone: user.phone || '',
        delivery_region: 'TN',
        delivery_charge: 0,
        estimated_weight_kg: 1,
        total: currentPrice * qty,
        items: JSON.parse(localStorage.getItem('yy_cart') || '[]'),
        buyback_requested: !!includeBuyBack,
        buyback_details: buybackData ? { ...buybackData, status: 'Pending' } : undefined,
        birthday_benefit_requested: !!includeBirthdayBenefit,
        birthday_benefit_details: birthdayBenefitData ? { ...birthdayBenefitData, status: 'Pending' } : undefined,
        student_discount_requested: !!includeStudentDiscount,
        student_discount_details: studentDiscountData ? { ...studentDiscountData, status: 'Pending' } : undefined,
        applied_offer: includeBuyBack ? 'buyback' : includeBirthdayBenefit ? 'birthday' : includeStudentDiscount ? 'student' : 'none',
      };
      
      localStorage.setItem('yy_pending_order', JSON.stringify(pendingOrder));
      
      setIsProcessingPayment(false);
      onClose();
      navigateTo('checkout');
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const shoesSizes = product.sizePrices ? Object.keys(product.sizePrices) : ["7", "8", "9", "10", "11", "12"];
  const getSizeQuantity = (size: string) => {
    return (product as any).sizeQuantities?.[size] ?? Infinity; // Infinity means unlimited stock
  };


  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(product.description);

  const handleSaveDescription = async () => {
    if (user?.role === 'admin' && editedDescription !== product.description) {
      await updateProduct(product.id, { description: editedDescription });
      product.description = editedDescription;
      setIsEditingDescription(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-neutral-950/70 backdrop-blur-sm overflow-y-auto pt-16 pb-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/90 border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer shadow-lg">
          <X className="w-4 h-4 text-neutral-600" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-100 p-4 lg:p-8">
          
          {/* LEFT: Image */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50 group">
              <img
                src={optimizeImage(activeImage || product.images[0], 800)}
                alt={product.name || "Crafted Leather Shoes"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              {product.is_new_arrival && (
                <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                  New Craft
                </span>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {(product.images || []).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${activeImage === img ? 'border-leather shadow-md' : 'border-neutral-150 opacity-75 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="space-y-5 flex-1">
              {/* Category tag */}
              <span className="inline-block bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg">
                {product.category || "Heritage Collection"}
              </span>

              {/* Name */}
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-leather">₹{currentPrice.toLocaleString('en-IN')}</span>
                {showMRP && (
                  <span className="text-sm text-neutral-400 line-through">₹{currentMRP.toLocaleString('en-IN')}</span>
                )}
                {showMRP && (
                  <span className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                    {Math.round((1 - currentPrice / currentMRP) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Size Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Select Size (UK)</label>
                <div className="flex flex-wrap gap-2">
                  {shoesSizes.map((size) => {
                    const qty = getSizeQuantity(size);
                    const isSoldOut = qty === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !isSoldOut && setSelectedSize(size)}
                        disabled={isSoldOut}
                        className={`min-w-[48px] py-2.5 px-3 text-sm font-bold rounded-lg border-2 transition-all cursor-pointer ${
                          isSoldOut
                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                            : selectedSize === size
                            ? 'bg-leather text-white border-leather shadow-md'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-leather hover:text-leather'
                        }`}
                        title={isSoldOut ? 'Sold out' : `Size ${size} (${qty === Infinity ? 'In stock' : qty + ' left'})`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

               {/* Qty */}
               {(() => {
                 const currentStock = getSizeQuantity(selectedSize);
                 const maxQty = currentStock === Infinity ? 10 : Math.min(10, currentStock);
                 const isLowStock = currentStock !== Infinity && currentStock <= 3;
                 const isOutOfStock = currentStock === 0;
                
                 return (
                   <div className="space-y-2">
                     <div className="flex items-center gap-3">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Qty</span>
                       <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                         <button 
                           onClick={() => setQty(Math.max(1, qty - 1))} 
                           className="px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer transition-colors"
                           disabled={qty <= 1 || isOutOfStock}
                         >
                           −
                         </button>
                         <span className="px-4 py-2 text-sm font-bold text-neutral-800 border-x border-neutral-200 min-w-[40px] text-center">{qty}</span>
                         <button 
                           onClick={() => setQty(Math.min(maxQty, qty + 1))} 
                           className="px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer transition-colors"
                           disabled={qty >= maxQty || isOutOfStock}
                         >
                           +
                         </button>
                       </div>
                     </div>
                     
                     {/* Stock Warning Messages */}
                     {isOutOfStock && (
                       <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                         <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                         Out of Stock
                       </p>
                     )}
                     {isLowStock && !isOutOfStock && (
                       <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                         <span className="inline-block w-2 h-2 bg-amber-600 rounded-full"></span>
                         Only {currentStock} left in stock
                       </p>
                     )}
                   </div>
                 );
               })()}

              {/* Description - Made larger and more visible, shown FIRST before offers */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-leather-dark">Artisan Description</h4>
                {user?.role === 'admin' ? (
                  isEditingDescription ? (
                    <div className="space-y-2">
                      <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={4} className="w-full text-sm p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold" />
                      <div className="flex gap-2">
                        <button onClick={handleSaveDescription} className="text-xs bg-leather text-white px-4 py-2 rounded-lg font-bold">Save</button>
                        <button onClick={() => { setIsEditingDescription(false); setEditedDescription(product.description); }} className="text-xs bg-neutral-100 text-neutral-600 px-4 py-2 rounded-lg font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setIsEditingDescription(true)} className="cursor-pointer group">
                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                      <span className="text-[10px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</span>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                )}
              </div>
              {/* Offer Toggles - simplified to show only titles without detailed text */}
              <div className="space-y-2.5 bg-neutral-50 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  Offers & Benefits
                </h4>
                
                {/* Buyback Benefit - title only */}
                <div className="space-y-0 ml-2 p-2 border-l-2 border-amber-400 bg-amber-50/50 rounded">
                  <p className="text-[11px] font-semibold text-neutral-700">♻️ Buyback / Upgrade Benefit</p>
                </div>

                {/* Birthday Benefit - title only */}
                <div className="space-y-0 ml-2 p-2 border-l-2 border-pink-400 bg-pink-50/50 rounded">
                  <p className="text-[11px] font-semibold text-neutral-700">🎂 Birthday Benefit</p>
                </div>

                {/* Student Discount - title only */}
                <div className="space-y-0 ml-2 p-2 border-l-2 border-blue-400 bg-blue-50/50 rounded">
                  <p className="text-[11px] font-semibold text-neutral-700">🎓 Student Discount</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-3 border-t border-neutral-100 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3.5 border-2 border-leather text-leather font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-leather hover:text-white transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Trunk
                </button>
                <button
                  onClick={() => { navigateTo('checkout'); onClose(); }}
                  className="w-full py-3.5 bg-leather text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gold transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Cart
                </button>
              </div>
              
              <form onSubmit={handleBuyNowSubmit}>
                <div className="space-y-2">
                  <textarea
                    value={buyNowAddress}
                    onChange={(e) => setBuyNowAddress(e.target.value)}
                    placeholder="Enter delivery address for instant buy..."
                    rows={2}
                    className="w-full text-xs p-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-leather resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-4 bg-gradient-to-r from-amber-700 to-gold text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:brightness-110 transition-all duration-300 shadow-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        🔥 Buy Now — ₹{totalValueWithBuyback.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};