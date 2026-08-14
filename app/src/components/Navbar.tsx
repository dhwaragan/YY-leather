/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, User, LogOut, ShieldAlert, X, Menu, Settings, Check, CreditCard, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoNavbar } from './Logo';
import { TopSlider } from './TopSlider';
import { optimizeImage } from '../utils/images';

export const Navbar: React.FC = () => {
  const { 
    user, 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    currentPage, 
    navigateTo, 
    logout, 
    loginAsUser,
    bypassAdminLogin,
    contentBlocks
  } = useApp();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickLogin = async (email: string, asAdmin = false) => {
    await loginAsUser(email, asAdmin);
  };

  const cartTotal = cart.reduce((acc, item) => {
    const resolvedPrice = Number((item.product as any).sizePrices?.[item.selectedSize] ?? item.product.price) || 0;
    return acc + resolvedPrice * item.quantity;
  }, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { label: 'NEW ARRIVALS', page: 'new-arrivals' },
    { label: 'BEST SELLERS', page: 'best-sellers' },
    { label: "MEN'S COLLECTION", page: 'shop' },
    { label: 'WHY YOU CHOOSE US?', page: 'sell' },
    { label: 'LOCATE STORE', page: 'location' }
  ];

  const isHomePage = currentPage === 'home';
  const navBgClass = isHomePage
    ? (isScrolled ? 'bg-[#3b2416]/95 backdrop-blur-md shadow-2xl py-4 border-b border-white/5' : 'bg-transparent py-6')
    : 'bg-[#3b2416]/95 backdrop-blur-md shadow-2xl py-4 border-b border-white/5';

  const cbTopSlider = contentBlocks.find(cb => cb.key === 'top_slider');
  const topSliderMessages = cbTopSlider ? JSON.parse(cbTopSlider.value) : [];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <TopSlider messages={topSliderMessages} />
      <nav id="app-navbar" className={`w-full transition-all duration-700 ease-in-out ${navBgClass}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <LogoNavbar onClick={() => navigateTo('home')} />
            </div>

            {/* Desktop Navigation Links */}
            <div id="desktop-links" className="hidden lg:flex items-center space-x-12">
              {navLinks.map((link) => (
                <button
                  key={link.page}
                  id={`nav-link-${link.page}`}
                  onClick={() => navigateTo(link.page)}
                  className={`text-sm tracking-[0.25em] font-sans font-medium hover:text-[#c5a059] transition-all duration-700 ease-in-out cursor-pointer relative py-2 ${
                    currentPage === link.page ? 'text-[#c5a059] font-semibold' : 'text-neutral-200'
                  }`}
                >
                  {link.label}
                  {currentPage === link.page && (
                    <motion.div 
                      layoutId="activeUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right Controls Area featuring Search, Account, and Cart */}
            <div id="navbar-controls-tray" className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Settings icon for Admin login - ONLY visible to logged-in admin users */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsAdminModalOpen(true);
                    setAdminPassword('');
                    setAdminLoginError(false);
                  }}
                  className="p-2 text-neutral-400 hover:text-[#c5a059] transition-colors duration-700 cursor-pointer focus:outline-none rounded-full bg-white/5 border border-white/5"
                  title="Admin Settings"
                >
                  <Settings className="w-4 h-4 stroke-[1.5]" />
                </button>
              )}

              {/* Hamburger Menu bar toggle always visible */}
              <button
                id="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-neutral-300 hover:text-[#c5a059] transition-colors focus:outline-none cursor-pointer rounded-full bg-white/5 border border-white/5"
                aria-label="Navigation Menu"
                title="Menu Bar"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4 stroke-[1.5]" /> : <Menu className="w-4 h-4 stroke-[1.5]" />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-navigation-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-neutral-100 shadow-inner"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                
                {/* Quick Login removed for production security */}

                {navLinks.map((link) => (
                  <button
                    key={link.page}
                    onClick={() => { navigateTo(link.page); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-3 py-2.5 rounded-md text-sm font-sans tracking-widest uppercase font-medium hover:bg-neutral-50 ${
                      currentPage === link.page ? 'text-gold bg-gold/5 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Dynamic Shopping Cart Sidebar Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => setIsCartOpen(false)} 
            />
            {/* Slider Drawer */}
            <motion.div
              id="cart-sidebar-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white shadow-2xl z-50 flex flex-col pt-4"
            >
              <div className="px-6 pb-4 border-b border-neutral-100 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-leather" />
                  <h3 className="font-serif text-lg font-bold text-neutral-800 tracking-wide">
                    Your Shopping Trunk
                  </h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-1 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-20">
                    <ShoppingBag className="w-16 h-16 text-neutral-200 stroke-[1] mb-4" />
                    <p className="font-serif text-lg text-neutral-500 font-medium">Your luxury trunk is empty</p>
                    <p className="text-xs text-neutral-400 font-sans mt-1">Savor our collections to add handcrafted art.</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); navigateTo('shop'); }}
                      className="mt-6 px-6 py-2 border border-gold text-gold text-xs uppercase font-sans tracking-widest font-bold hover:bg-gold hover:text-white transition-all rounded"
                    >
                      Browse Sovereign Shop
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={`${item.product.id}-${item.selectedSize}-${idx}`} 
                      className="flex items-center space-x-4 border-b border-neutral-100 pb-4"
                    >
                      <img 
                        src={optimizeImage(item.product.images[0], 128) || undefined} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover border border-neutral-100 bg-neutral-50 rounded"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1">
                        <h4 className="font-serif text-xs font-bold text-neutral-800 tracking-wider line-clamp-1">
                          {item.product.name}
                        </h4>
                        <div className="flex space-x-2 text-[10px] uppercase font-sans tracking-widest text-neutral-400 mt-1">
                          <span>Size: <strong className="text-neutral-700">{item.selectedSize}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong className="text-neutral-700">{item.quantity}</strong></span>
                        </div>
                        
                        {/* Qty edit controllers */}
                        <div className="flex items-center space-x-2 mt-2">
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                            className="bg-neutral-100 text-neutral-700 w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-neutral-200"
                          >
                            -
                          </button>
                          <span className="text-xs font-semibold font-sans w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                            className="bg-neutral-100 text-neutral-700 w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-neutral-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-sans font-bold text-neutral-800">
                          ₹{((Number((item.product as any).sizePrices?.[item.selectedSize] ?? item.product.price) || 0) * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="block text-[10px] text-red-500 hover:underline mt-1 ml-auto font-sans font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Trunk Checkout Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 space-y-4">
                  <div className="flex justify-between items-center text-neutral-800">
                    <span className="font-serif text-sm font-semibold">Legacy Subtotal</span>
                    <span className="font-sans text-lg font-bold text-leather">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-neutral-400 font-sans tracking-wide leading-relaxed">
                    Including professional shoe adjustment coverage & standard insured white-glove transport within Chennai.
                  </div>

                   <button
                     id="checkout-checkout-btn"
                     onClick={() => {
                       setIsCartOpen(false);
                       navigateTo('checkout');
                     }}
                     className="w-full bg-leather dark:bg-leather-dark hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3 transition-all duration-300 rounded shadow-md flex items-center justify-center gap-2"
                   >
                     Proceed to Royal Checkout
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Admin Password Override Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Clickable Backdrop */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => setIsAdminModalOpen(false)} 
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 max-w-sm w-full relative z-10 p-6 shadow-2xl rounded-2xl text-center"
            >
              <h3 className="font-serif text-xl font-bold tracking-wide text-neutral-900 mb-2">
                Atelier Administration
              </h3>
              <p className="text-xs text-neutral-500 font-sans mb-6">
                Enter your secure password to access store controls.
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  bypassAdminLogin(authEmail || "", adminPassword).then((success) => {
                    if (success) {
                      setIsAdminModalOpen(false);
                      navigateTo('admin');
                    } else {
                      setAdminLoginError(true);
                    }
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => {
                      setAuthEmail(e.target.value);
                      setAdminLoginError(false);
                    }}
                    placeholder="Enter your admin email..."
                    className="w-full text-center px-4 py-3 bg-neutral-50 border border-neutral-300 focus:border-[#8B5A2B] focus:ring-1 focus:ring-[#8B5A2B] rounded-lg text-sm transition-all text-neutral-900 outline-none"
                    required
                  />
                  <p className="text-[9px] text-neutral-400 mt-2">Authorized admin emails are configured securely.</p>
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Enter secure password..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminLoginError(false);
                    }}
                    className="w-full text-center px-4 py-3 bg-neutral-50 border border-neutral-300 focus:border-[#8B5A2B] focus:ring-1 focus:ring-[#8B5A2B] rounded-lg text-sm transition-all text-neutral-900 font-mono tracking-widest placeholder:tracking-normal outline-none"
                    autoFocus
                    required
                    minLength={6}
                  />
                  {adminLoginError && (
                    <p className="text-red-500 text-[10px] mt-2 font-sans">
                      Invalid email or password. Access denied.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#8B5A2B] hover:bg-[#6b421a] transition-colors"
                >
                  Authenticate
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="w-full py-2 px-4 text-xs font-semibold rounded-lg text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
