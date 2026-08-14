/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { PromoSlider } from "./components/PromoSlider";
import { HeroVideo } from "./components/HeroVideo";
import { MapEmbed } from "./components/MapEmbed";
import { ProductCard } from "./components/ProductCard";
import { optimizeImage } from "./utils/images";

// Lazy-loaded pages - split the bundle to reduce initial load
const ProductDetailPage = lazy(() => import("./components/ProductDetailPage").then(m => ({ default: m.ProductDetailPage })));
const BuybackPage = lazy(() => import("./components/BuybackPage").then(m => ({ default: m.BuybackPage })));
const Checkout = lazy(() => import("./components/Checkout").then(m => ({ default: m.Checkout })));
const AdminPanel = lazy(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const LoginPage = lazy(() => import("./components/LoginPage").then(m => ({ default: m.LoginPage })));
const UserProfile = lazy(() => import("./components/UserProfile").then(m => ({ default: m.UserProfile })));

import {
  Sparkles,
  MapPin,
  Layers,
  History,
  Phone,
  Compass,
  ArrowRight,
  User,
  Home,
  FileText,
  CheckCircle,
  Check,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  PenTool,
  ShoppingBag,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ---------------- TIMER CAMPAIGN COMPONENT ----------------
const PromotionCountdown: React.FC<{ validUntil: string }> = ({
  validUntil,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(validUntil) - +new Date();
      if (difference <= 0) return;

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [validUntil]);

  return (
    <div className="flex justify-center sm:justify-start gap-4 font-mono select-none">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hrs", value: timeLeft.hours },
        { label: "Min", value: timeLeft.minutes },
        { label: "Sec", value: timeLeft.seconds },
      ].map((block, id) => (
        <div
          key={id}
          className="bg-black/90 border border-gold/40 px-3.5 py-2.5 rounded text-center min-w-[65px] shadow-lg"
        >
          <span className="text-xl sm:text-2xl font-bold text-gold font-sans block leading-none">
            {String(block.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-neutral-450 font-sans font-medium">
            {block.label}
          </span>
        </div>
      ))}
    </div>
  );
};

import { SplashLoader } from "./components/SplashLoader";

// Suspense fallback for lazy-loaded pages
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-neutral-400 text-[10px] uppercase tracking-widest">Loading...</p>
    </div>
  </div>
);

// ---------------- MAIN APP CORE INTERNALS ----------------
const AppCore: React.FC = () => {
  const {
    currentPage,
    navigateTo,
    products,
    selectedProductDetail,
    setSelectedProductDetail,
    offers,
    contentBlocks,
    customCategories,
    user,
    orders,
    updateUserProfile,
    isLoading,
    cart,
    removeFromCart,
    updateCartQuantity,
    shopCategory,
    setShopCategory,
    isMaintenanceMode,
    maintenanceTitle,
    maintenanceMessage,
    isAdminEmail
  } = useApp();

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // Shop page filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [colorFilter, setColorFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [activeHomeTab, setActiveHomeTab] = useState<"new" | "best" | "men">(
    "new",
  );

  // CMS Content selectors
  const cbAbout = contentBlocks.find((cb) => cb.key === "about");
  const aboutData = cbAbout
    ? JSON.parse(cbAbout.value)
    : { title: "", tagline: "", mission: "", paragraphs: [] };

  const cbHistory = contentBlocks.find((cb) => cb.key === "history");
  const historyData = cbHistory ? JSON.parse(cbHistory.value) : [];

  const cbPolicies = contentBlocks.find((cb) => cb.key === "policies");
  const policiesData = cbPolicies
    ? JSON.parse(cbPolicies.value)
    : { returns: "", privacy: "", terms: "", shipping: "", buyback: "" };

  // Secret maintenance override hooks
  const [clickCount, setClickCount] = useState(0);
  const [secretOverride, setSecretOverride] = useState(false);

  // Maintenance Mode Gate: block normal users if mode is ON
  const isAdmin = user ? isAdminEmail(user.email) : false;
  
  if (isMaintenanceMode && !isAdmin && !secretOverride) {
    const handleIconClick = () => {
      const nextCount = clickCount + 1;
      if (nextCount >= 10) {
        setClickCount(0);
        const pass = prompt("Enter Master Admin Password:");
        const securePass = import.meta.env.VITE_ADMIN_PASSWORD || "YYLeathers@SecureAdmin2026!";
        if (pass === securePass) {
          setSecretOverride(true);
          navigateTo("admin");
        } else if (pass !== null) {
          alert("Incorrect master password.");
        }
      } else {
        setClickCount(nextCount);
      }
    };

    return (
      <div className="min-h-screen bg-[#3b2416] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,90,43,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="relative max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex justify-center">
            <button 
              onClick={handleIconClick}
              className="p-3 bg-gold/15 border border-gold/30 rounded-full animate-pulse focus:outline-none hover:bg-gold/20 active:scale-95 transition-all cursor-pointer"
              title="Under Maintenance"
            >
              <span className="text-4xl">🔧</span>
            </button>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-wide uppercase">
            {maintenanceTitle || "We'll Be Back Soon"}
          </h1>
          <div className="w-12 h-0.5 bg-gold mx-auto"></div>
          <p className="text-white/70 text-sm leading-relaxed font-body">
            {maintenanceMessage || "We're currently updating our store. Please check back shortly."}
          </p>
          <p className="text-gold text-xs uppercase tracking-widest font-bold">
            Thank you for your patience
          </p>
        </div>
        <div className="absolute bottom-6 text-[9px] text-white/40 uppercase tracking-widest">
          YY Leathers · Chennai Premium Leather Artisan
        </div>
      </div>
    );
  }

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#3b2416] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest">Loading YY Leathers...</p>
        </div>
      </div>
    );
  }

  // Show login only after data is loaded (prevents flash on refresh)
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-50 flex flex-col justify-between">
      {/* Universal Sticky Navbar */}
      {currentPage !== "admin" && <Navbar />}

      {/* Screen Routing Switchboard */}
      <main className="flex-1">
        <SplashLoader />

        <AnimatePresence mode="wait">
          {/* ================= 1. HOME SCREEN ================= */}
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-12 pb-24 bg-white text-neutral-900 selection:bg-leather/15"
            >
              {/* Apple Scroller 3D Scrub Video Hero */}
              <HeroVideo />

              {/* DISCOUNT HERO BANNER CHERISHED OFFER CARD */}
              <PromoSlider
                offers={offers.filter((o) => o.is_active)}
                navigateTo={navigateTo}
              />

              {/* POPULAR TRENDING FOOTWEAR */}
              <section
                id="popular-footwear-section"
                className="w-full px-4 sm:px-6 lg:px-8 space-y-8 select-none"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-neutral-200/60 pb-4">
                  <div>
                    <span className="text-leather text-[10px] sm:text-xs tracking-[0.25em] font-sans font-bold uppercase block">
                      THE ROYAL COLLECTION OUTLINES
                    </span>
                    <h2 className="font-serif text-2xl sm:text-4xl font-bold text-neutral-905 mt-1">
                      Popular & Trending Footwear
                    </h2>
                  </div>
                  <button
                    onClick={() => navigateTo("shop")}
                    className="text-xs font-sans font-bold text-leather hover:text-gold uppercase tracking-widest border-b border-leather hover:border-gold transition-colors duration-300 pb-1 cursor-pointer"
                  >
                    View Sovereign Catalogue
                  </button>
                </div>

                {/* Horizontal touch scroll wrapper */}
                <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-thin scrollbar-thumb-leather/30 scroll-smooth snap-x snap-mandatory">
                  {products
                    .filter((p) => p.is_published)
                    .slice(0, 6)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="min-w-[280px] sm:min-w-[320px] w-14 snap-start"
                      >
                        <ProductCard product={p} />
                      </div>
                    ))}
                </div>
              </section>

              {/* WHY CHOOSE US BRAND COVENANTS */}
              <section
                id="brand-covenants-section"
                className="relative w-full px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-[#1A120B] via-[#2A1D13] to-[#140D08] rounded-3xl border border-[#3E2B20] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden select-none"
              >
                {/* Decorative noise/texture overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')] mix-blend-overlay"></div>
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gold/5 blur-[100px] pointer-events-none" />

                {/* Centered luxury heading */}
                <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block shadow-sm">
                    THE YY LEATHERS ATELIER STATEMENT
                  </span>
                  <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white">
                    The Heart of YY Leathers
                  </h2>
                  <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
                </div>

                {/* 3-column Layout mimicking image_cdad28.jpg */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                  <div className="group bg-[#24170F]/80 backdrop-blur-sm border border-[#3E2B20] hover:border-gold/30 p-8 rounded-2xl shadow-xl space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                    <h4 className="font-serif text-lg font-bold text-neutral-100 group-hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-3">
                      <span className="text-3xl text-gold font-serif font-bold italic opacity-80 group-hover:opacity-100 transition-opacity">
                        01
                      </span>
                      <span className="text-gold/50 font-light">|</span>
                      Honesty
                    </h4>
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed group-hover:text-neutral-300 transition-colors">
                      We believe trust is earned through transparency. From materials to pricing, we strive to provide clear and honest information, ensuring genuine value without hidden conditions.
                    </p>
                  </div>

                  <div className="group bg-[#24170F]/80 backdrop-blur-sm border border-[#3E2B20] hover:border-gold/30 p-8 rounded-2xl shadow-xl space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                    <h4 className="font-serif text-lg font-bold text-neutral-100 group-hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-3">
                      <span className="text-3xl text-gold font-serif font-bold italic opacity-80 group-hover:opacity-100 transition-opacity">
                        02
                      </span>
                      <span className="text-gold/50 font-light">|</span>
                      Loyalty
                    </h4>
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed group-hover:text-neutral-300 transition-colors">
                      Our customers are the foundation of our success. We reward your trust through exclusive benefits, student discounts, buy-back programs, and building lasting relationships.
                    </p>
                  </div>

                  <div className="group bg-[#24170F]/80 backdrop-blur-sm border border-[#3E2B20] hover:border-gold/30 p-8 rounded-2xl shadow-xl space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                    <h4 className="font-serif text-lg font-bold text-neutral-100 group-hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-3">
                      <span className="text-3xl text-gold font-serif font-bold italic opacity-80 group-hover:opacity-100 transition-opacity">
                        03
                      </span>
                      <span className="text-gold/50 font-light">|</span>
                      Quality
                    </h4>
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed group-hover:text-neutral-300 transition-colors">
                      Quality is at the heart of every pair. From material selection to craftsmanship, we focus on delivering footwear that offers durability, comfort, style, and unmatched reliability.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* ================= WHY CHOOSE US PAGE ================= */}
          {currentPage === "why-choose-us" && (
            <motion.div
              key="why-choose-us"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Suspense fallback={<PageLoader />}>
                <BuybackPage />
              </Suspense>
            </motion.div>
          )}

          {/* ================= 2. SHOP MODULE ================= */}
          {currentPage === "shop" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none"
            >
              <div className="w-full space-y-8">
                <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-neutral-800 text-center sm:text-left">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600')] bg-cover bg-center opacity-10 hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900 to-transparent z-0" />
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="text-gold text-[10px] sm:text-xs tracking-[0.4em] font-sans font-bold uppercase block">THE PREMIUM COLLECTION</span>
                    <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-normal uppercase leading-tight">Premium Footwear</h1>
                    <p className="font-sans text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">Discover Chennai's peak luxury dress shoes and boots. Handbuilt in our ateliers using our historic 150-step welting method with premium French calf skin and organic oak wood extracts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs h-fit font-sans">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-extrabold text-neutral-450 uppercase tracking-widest block">Search Catalog</label>
                      <div className="relative font-sans">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                        <input type="text" placeholder="Search shoes, leather boots..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-xs pl-10 pr-4 py-3 border border-neutral-200 focus:outline-none focus:border-gold rounded-lg font-sans bg-neutral-50 text-neutral-800" />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[10px] font-sans font-extrabold text-neutral-450 uppercase tracking-widest block">Product Style</label>
                      <div className="flex flex-col gap-1">
                        {Array.from(new Set(["All", ...(customCategories || [])])).map((cat) => (
                          <button key={cat} onClick={() => setShopCategory(cat)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex justify-between items-center ${shopCategory === cat ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}>
                            <span>{cat}</span>
                            {shopCategory === cat && <Check className="w-3.5 h-3.5 text-gold" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 border-t border-neutral-100 pt-4">
                      <label className="text-[10px] font-sans font-extrabold text-neutral-450 uppercase tracking-widest block">Shoe Color</label>
                      <div className="flex flex-wrap gap-2">
                        {[{ name: "All", bg: "bg-gradient-to-tr from-rose-450 via-teal-400 to-amber-300" },{ name: "Tan", bg: "bg-amber-600" },{ name: "Black", bg: "bg-black" },{ name: "Brown", bg: "bg-amber-900" },{ name: "Cherry", bg: "bg-red-950" }].map((col) => (
                          <button key={col.name} onClick={() => setColorFilter(col.name)} className={`w-7 h-7 rounded-full cursor-pointer transition-all flex items-center justify-center relative p-0.5 ${colorFilter === col.name ? "ring-2 ring-gold ring-offset-2 ring-offset-white" : "hover:scale-105"}`} title={`Show ${col.name}`}>
                            <span className={`w-full h-full rounded-full ${col.bg} border border-neutral-200`} />
                            {colorFilter === col.name && <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full" />}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-450 mt-1 block">Active: <strong>{colorFilter}</strong></span>
                    </div>

                    <div className="space-y-2.5 border-t border-neutral-100 pt-4">
                      <label className="text-[10px] font-sans font-extrabold text-neutral-450 uppercase tracking-widest block">Filter Sizing (UK/IND)</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["All", "7", "8", "9", "10", "11", "12"].map((sz) => (
                          <button key={sz} onClick={() => setSizeFilter(sz)} className={`py-1.5 rounded text-xs font-bold font-sans cursor-pointer transition-all border ${sizeFilter === sz ? "bg-neutral-900 text-white border-neutral-900 shadow-sm" : "bg-white text-neutral-600 border-neutral-200 hover:border-gold hover:text-neutral-900"}`}>{sz === "All" ? "All" : `${sz}`}</button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => { setShopCategory("All"); setTagFilter("All"); setColorFilter("All"); setSizeFilter("All"); setSearchQuery(""); setSortBy("featured"); }} className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 font-sans text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer mt-4">Clear All Filters</button>
                  </div>

                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-4 border border-neutral-150 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 font-sans text-xs">
                      <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider block">{(() => { const mc = products.filter(p => p.is_published).filter(p => { const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()); const mc2 = shopCategory === "All" || p.category.toLowerCase() === shopCategory.toLowerCase(); let mt = true; if (tagFilter === "New Arrivals") mt = p.is_new_arrival; else if (tagFilter === "Best Sellers") mt = p.is_best_seller; let mcol = true; if (colorFilter !== "All") { const d = p.description.toLowerCase(), t = p.name.toLowerCase(); if (colorFilter === "Tan") mcol = d.includes("tan")||t.includes("tan")||d.includes("mahogany"); else if (colorFilter === "Black") mcol = d.includes("black")||t.includes("black"); else if (colorFilter === "Brown") mcol = d.includes("brown")||t.includes("brown")||d.includes("suede"); else if (colorFilter === "Cherry") mcol = d.includes("cherry")||t.includes("cherry")||d.includes("red")||d.includes("mahogany"); } let msz = true; if (sizeFilter !== "All") { const sizes = p.sizePrices ? Object.keys(p.sizePrices) : []; msz = sizes.includes(sizeFilter); } return ms && mc2 && mt && mcol && msz; }).length; return `Showing ${mc} of ${products.filter(p => p.is_published).length} luxury styles`; })()}</span>
                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
                        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/60 font-sans">
                          {["All", "New Arrivals", "Best Sellers"].map((tag) => (<button key={tag} onClick={() => setTagFilter(tag)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${tagFilter === tag ? "bg-neutral-900 text-white shadow-xs font-bold" : "hover:bg-neutral-150 text-neutral-600"}`}>{tag === "All" ? "Collections" : tag}</button>))}
                        </div>
                        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200/60 font-sans hidden sm:flex">
                          <button onClick={() => setSortBy('featured')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${sortBy === 'featured' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>Default</button>
                          <button onClick={() => setSortBy('price-low-high')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 ${sortBy === 'price-low-high' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>Price ↓</button>
                          <button onClick={() => setSortBy('price-high-low')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 ${sortBy === 'price-high-low' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>Price ↑</button>
                        </div>
                        <div className="flex sm:hidden items-center gap-1">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Sort:</span>
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-neutral-50 px-3 py-1.5 border border-neutral-200 rounded-lg text-[10px] uppercase font-bold tracking-wider text-neutral-700 outline-none focus:border-gold cursor-pointer">
                            <option value="featured">Featured Style</option>
                            <option value="price-low-high">Price: Low to High</option>
                            <option value="price-high-low">Price: High to Low</option>
                            <option value="title-a-z">Alphabetical: A-Z</option>
                            <option value="title-z-a">Alphabetical: Z-A</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {products && (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {(() => {
                          const filtered = products.filter(p => p.is_published).filter(p => {
                            const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
                            const mc2 = shopCategory === "All" || p.category.toLowerCase() === shopCategory.toLowerCase();
                            let mt = true;
                            if (tagFilter === "New Arrivals") mt = p.is_new_arrival;
                            else if (tagFilter === "Best Sellers") mt = p.is_best_seller;
                            let mcol = true;
                            if (colorFilter !== "All") {
                              const d = p.description.toLowerCase(), t = p.name.toLowerCase();
                              if (colorFilter === "Tan") mcol = d.includes("tan")||t.includes("tan")||d.includes("mahogany");
                              else if (colorFilter === "Black") mcol = d.includes("black")||t.includes("black");
                              else if (colorFilter === "Brown") mcol = d.includes("brown")||t.includes("brown")||d.includes("suede");
                              else if (colorFilter === "Cherry") mcol = d.includes("cherry")||t.includes("cherry")||d.includes("red")||d.includes("mahogany");
                            }
                            let msz = true;
                            if (sizeFilter !== "All") { const sizes = p.sizePrices ? Object.keys(p.sizePrices) : []; msz = sizes.includes(sizeFilter); }
                            return ms && mc2 && mt && mcol && msz;
                          });
                          const sorted = [...filtered].sort((a,b) => { if (sortBy === "price-low-high") return a.price - b.price; if (sortBy === "price-high-low") return b.price - a.price; if (sortBy === "title-a-z") return a.name.localeCompare(b.name); if (sortBy === "title-z-a") return b.name.localeCompare(a.name); return 0; });
                          if (sorted.length === 0) return (<div className="col-span-full py-16 text-center space-y-4 bg-white border border-neutral-150 rounded-2xl p-8"><p className="text-sm font-medium text-neutral-500">No Premium Pairs Match Sourced Criteria.</p><button onClick={() => { setShopCategory("All"); setTagFilter("All"); setColorFilter("All"); setSizeFilter("All"); setSearchQuery(""); }} className="px-5 py-2.5 bg-neutral-900 text-white rounded text-xs uppercase font-sans tracking-widest font-bold hover:bg-neutral-800 transition-colors">Browse Complete Line</button></div>);
                          return sorted.map((p) => (<ProductCard key={p.id} product={p} />));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 2B. CART SCREEN TAB ================= */}
          {currentPage === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="min-h-screen bg-[#FAF6F0]/30 pt-32 pb-24 px-4 sm:px-6 lg:px-8 font-sans"
            >
              <div className="w-full space-y-8 select-none">
                <div className="text-center space-y-2">
                  <span className="text-[#5C3317] text-xs tracking-[0.3em] font-sans font-bold uppercase block">YOUR EXQUISITE COMMISSIONS</span>
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#361904]">Your Shopping Trunk</h1>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-sans font-semibold">Handcrafted bespoke items prepared for checkout travel</p>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-neutral-300 stroke-[1] mb-4" />
                    <h3 className="font-serif text-xl text-neutral-700 font-bold">Your luxury trunk is empty</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-2 max-w-sm">No individual shoe builds have been allocated. Indulge in our bespoke selections to load your trunk.</p>
                    <button onClick={() => navigateTo("shop")} className="mt-6 px-6 py-3 bg-leather hover:bg-gold text-white text-xs uppercase font-sans tracking-widest font-bold transition-all rounded hover:shadow-md">Browse Sovereign Shop</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 bg-white border border-neutral-150 rounded-2xl p-6 shadow-xs space-y-6">
                      {cart.map((item, idx) => (
                        <div key={`${item.product.id}-${item.selectedSize}-${idx}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6 last:border-0 last:pb-0 font-sans">
                          <div className="flex items-center gap-4">
                            <img src={optimizeImage(item.product.images[0], 160) || undefined} alt={item.product.name} loading="lazy" decoding="async" className="w-20 h-20 object-cover border border-neutral-150 bg-neutral-50 rounded-lg shadow-2xs" />
                            <div>
                              <h4 className="font-serif text-sm font-bold text-neutral-900 group-hover:text-leather">{item.product.name}</h4>
                              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-0.5 font-sans">{item.product.category}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs font-sans text-neutral-600">
                                <span>Size (UK): <strong className="text-neutral-900">{item.selectedSize}</strong></span>
                                <span className="text-neutral-300">•</span>
                                <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                                  <button onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)} className="text-neutral-600 w-4 h-4 flex items-center justify-center hover:text-[#5C3317] font-bold">-</button>
                                  <span className="font-bold font-sans text-xs min-w-[12px] text-center">{item.quantity}</span>
                                  <button onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)} className="text-neutral-600 w-4 h-4 flex items-center justify-center hover:text-[#5C3317] font-bold">+</button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0">
                            <span className="font-sans font-bold text-sm text-neutral-905">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                            <button onClick={() => removeFromCart(item.product.id, item.selectedSize)} className="text-xs text-red-500 hover:underline mt-1 font-sans font-semibold cursor-pointer">Remove Item</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-4 bg-white border border-neutral-150 rounded-2xl p-6 shadow-xs space-y-6">
                      <h3 className="font-serif text-sm font-bold tracking-widest text-[#5C3317] uppercase border-b border-neutral-100 pb-3">Carriage Summary</h3>
                        <div className="space-y-3 text-xs font-sans">
                          <div className="flex justify-between text-neutral-600">
                            <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} Items)</span>
                            <span className="font-semibold text-neutral-800">₹{cartTotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="border-t border-neutral-100 pt-4 mt-2 flex justify-between items-center text-sm">
                          <span className="font-serif font-bold text-neutral-900">Total Valuation</span>
                          <span className="font-sans font-bold text-lg text-leather">₹{cartTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="bg-neutral-50 border border-neutral-200/60 p-3 rounded-lg text-[10px] text-neutral-500 leading-relaxed font-sans">Sovereign custom builds are fully backed by standard 30-day adjustments and active circular buy-back options in Surapet flagship workshop.</div>
                      <button onClick={() => { if (!user) { navigateTo("user-profile"); } else { navigateTo("checkout"); } }} className="w-full bg-leather hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 rounded transition-all cursor-pointer shadow-md text-center block">{user ? "Proceed to Royal Checkout" : "Login Signature to Checkout"}</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= 3. NEW ARRIVALS ================= */}
          {currentPage === "new-arrivals" && (
            <motion.div key="new-arrivals" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }} className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none">
              <div className="w-full space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block">EXQUISITE SPRING CHROME CAPSULES</span>
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide text-leather">Latest Footwear Arrivals</h1>
                  <p className="font-sans text-xs text-neutral-450 uppercase tracking-widest">Crafted during the spring seasons and tagged is_new_arrival in Chennai.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  {products.filter((p) => p.is_new_arrival && p.is_published).map((p) => (<ProductCard key={p.id} product={p} />))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 4. BEST SELLERS ================= */}
          {currentPage === "best-sellers" && (
            <motion.div key="best-sellers" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }} className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
              <div className="w-full space-y-16">
                <div className="text-center space-y-2">
                  <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block">THE CROWNED INDIAN LEGACY CHROME</span>
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide text-leather">Atelier Best Sellers</h1>
                </div>
                <div className="space-y-24">
                  {products.filter((p) => p.is_best_seller && p.is_published).map((p, index) => (
                    <div key={p.id} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                      <div className="w-full md:w-1/2 overflow-hidden rounded-xl border-2 border-gold/10 aspect-[4/3] relative shadow-lg"><img src={optimizeImage(p.images[0], 800) || undefined} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
                      <div className="w-full md:w-1/2 space-y-4 font-sans select-none">
                        <span className="text-gold text-[10px] uppercase font-bold tracking-widest block">SPECIAL CROWN 0{index + 1}</span>
                        <h2 className="font-serif text-2xl sm:text-4xl text-neutral-900 font-bold">{p.name}</h2>
                        <p className="text-neutral-650 text-xs sm:text-sm leading-relaxed font-body">{p.description}</p>
                        <p className="font-bold text-leather text-lg">INR {p.price.toLocaleString("en-IN")}</p>
                        <button id={`best-seller-inspect-btn-${p.id}`} onClick={() => setSelectedProductDetail(p)} className="bg-leather hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded transition-all cursor-pointer shadow">Examine Foot Sizing Specifications</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 6. HISTORY ================= */}
          {currentPage === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }} className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none">
              <div className="w-full space-y-16">
                <div className="text-center space-y-2">
                  <span className="text-gold text-xs tracking-[0.3em] font-sans font-bold uppercase block">CHRONOLOGY OF CRAFTSMANSHIP</span>
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold text-leather">Our History & Milestones</h1>
                  <p className="font-sans text-xs text-neutral-450 uppercase tracking-widest">The step-by-step journey of YY Leathers Chennai.</p>
                </div>
                <div className="space-y-8 relative before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-0.5 before:bg-gold/30">
                  {historyData.map((milestone: any, i: number) => (
                    <motion.div key={milestone.year} initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className={`flex w-full justify-between items-center ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                      <div className="w-[45%]" />
                      <div className="z-10 bg-leather-dark border-2 border-gold text-gold w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs select-none">{milestone.year.substring(2)}</div>
                      <div className="w-[45%] bg-white border p-5 rounded-xl shadow-sm space-y-2 hover:border-gold/40 transition-colors">
                        <span className="text-gold font-bold text-xs">{milestone.year}</span>
                        <h3 className="font-serif text-sm font-bold text-leather-dark">{milestone.title}</h3>
                        <p className="font-sans text-[11px] text-neutral-500 leading-relaxed">{milestone.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 7. LOCATION ================= */}
          {currentPage === "location" && (
            <motion.div key="location" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }} className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none font-sans">
              <div className="w-full space-y-12">
                <div className="text-center space-y-2">
                  <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase block">THE PHYSICAL SANCTUARY COORDS</span>
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold text-leather">YY Leathers (Near Godson School)</h1>
                  <p className="text-xs text-neutral-450 uppercase tracking-widest">Walk-in measurings and material leather audits accepted.</p>
                </div>
                <MapEmbed />
              </div>
            </motion.div>
          )}

          {/* ================= 8. LEGAL POLICIES PAGE ================= */}
          {currentPage === "policies" && (
            <motion.div key="policies" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }} className="min-h-screen bg-neutral-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-none font-sans">
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-4 bg-white border p-6 rounded-xl shadow-sm space-y-4">
                  <span className="text-gold text-[9px] uppercase font-bold tracking-widest block">POLICIES DOCUMENTS INDEX</span>
                  <h3 className="font-serif text-lg font-bold text-leather-dark border-b pb-2">Atelier Discipline</h3>
                  <div className="flex flex-col gap-2 text-xs text-neutral-600 select-none">
                    <button onClick={(e) => { e.preventDefault(); document.getElementById('sec-return')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gold block transition-colors text-left">1. Return & Exchange Policy</button>
                    <button onClick={(e) => { e.preventDefault(); document.getElementById('sec-privacy')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gold block transition-colors text-left">2. Privacy Information</button>
                    <button onClick={(e) => { e.preventDefault(); document.getElementById('sec-terms')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gold block transition-colors text-left">3. Terms & Conditions</button>
                    <button onClick={(e) => { e.preventDefault(); document.getElementById('sec-shipping')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gold block transition-colors text-left">4. Shipping & Transit</button>
                    <button onClick={(e) => { e.preventDefault(); document.getElementById('sec-buyback')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gold block transition-colors text-left">5. Buy Back Terms & Conditions</button>
                  </div>
                </div>
                <div className="md:col-span-8 bg-white border p-8 rounded-xl shadow-sm text-xs text-neutral-700 space-y-8 max-h-[80vh] overflow-y-auto leading-relaxed">
                  <div id="sec-return" className="space-y-2">
                    <h2 className="font-serif text-lg font-bold text-leather-dark border-b pb-1.5 uppercase tracking-wide">1. Return & Exchange Policy</h2>
                    <p className="font-sans text-[11px] text-neutral-550 leading-relaxed font-medium">{policiesData.returns}</p>
                  </div>
                  <div id="sec-privacy" className="space-y-2">
                    <h2 className="font-serif text-lg font-bold text-leather-dark border-b pb-1.5 uppercase tracking-wide">2. Privacy Policy</h2>
                    <p className="font-sans text-[11px] text-neutral-550 leading-relaxed font-medium whitespace-pre-wrap">{policiesData.privacy}</p>
                  </div>
                  <div id="sec-terms" className="space-y-2">
                    <h2 className="font-serif text-lg font-bold text-leather-dark border-b pb-1.5 uppercase tracking-wide">3. Terms & Conditions</h2>
                    <p className="font-sans text-[11px] text-neutral-550 leading-relaxed font-medium whitespace-pre-wrap">{policiesData.terms || 'Welcome to YY Leathers. By using our website and services, you agree to comply with our general terms. Please contact our support for full details.'}</p>
                  </div>
                  <div id="sec-shipping" className="space-y-2">
                    <h2 className="font-serif text-lg font-bold text-leather-dark border-b pb-1.5 uppercase tracking-wide">4. Shipping & Insured Transit</h2>
                    <p className="font-sans text-[11px] text-neutral-550 leading-relaxed font-medium whitespace-pre-wrap">{policiesData.shipping}</p>
                    <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-[11px] text-neutral-700">
                      <div className="font-bold text-neutral-900 mb-2">India Delivery Fees (per Kg)</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">Chennai</div><div className="mt-1 font-bold text-leather">₹60</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">TN</div><div className="mt-1 font-bold text-leather">₹80</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">South</div><div className="mt-1 font-bold text-leather">₹100</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">North</div><div className="mt-1 font-bold text-leather">₹180</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">North East</div><div className="mt-1 font-bold text-leather">₹250</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">North West</div><div className="mt-1 font-bold text-leather">₹200</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3"><div className="font-semibold">Himachal</div><div className="mt-1 font-bold text-leather">₹280</div></div>
                        <div className="rounded-lg bg-white border border-neutral-150 p-3 col-span-2"><div className="font-semibold">Other</div><div className="mt-1 font-bold text-leather">Contact</div></div>
                      </div>
                    </div>
                  </div>
                  <div id="sec-buyback" className="space-y-2">
                    <h2 className="font-serif text-lg font-bold text-leather-dark border-b pb-1.5 uppercase tracking-wide">5. Buy Back Terms & Conditions</h2>
                    <p className="font-sans text-[11px] text-neutral-550 leading-relaxed font-medium whitespace-pre-wrap">{policiesData.buyback}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 9. USER PROFILE ================= */}
          {currentPage === "user-profile" && !user && <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>}
          {currentPage === "user-profile" && user && <Suspense fallback={<PageLoader />}><UserProfile /></Suspense>}

          {/* ================= 10. CHECKOUT ================= */}
          {currentPage === "checkout" && (<motion.div key="checkout" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }}><Suspense fallback={<PageLoader />}><Checkout /></Suspense></motion.div>)}

          {/* ================= 11. ADMIN ================= */}
          {currentPage === "admin" && (<motion.div key="admin" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }}><Suspense fallback={<PageLoader />}><AdminPanel /></Suspense></motion.div>)}

          {/* ================= 12. BUYBACK PAGE ================= */}
          {(currentPage === "sell" || currentPage === "buyback") && (<motion.div key="sell" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.4, ease: "easeOut" }}><Suspense fallback={<PageLoader />}><BuybackPage /></Suspense></motion.div>)}
        </AnimatePresence>
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProductDetail && (
          <Suspense fallback={<PageLoader />}>
            <ProductDetailPage product={selectedProductDetail} onClose={() => setSelectedProductDetail(null)} />
          </Suspense>
        )}
      </AnimatePresence>

      {currentPage !== "admin" && <Footer />}

      {/* Mobile Bottom Tab Navigation */}
      {currentPage !== "admin" && (
        <div id="persistent-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/85 shadow-lg px-4 py-2 flex justify-around items-center h-16 pointer-events-auto">
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "shop", label: "Browser", icon: Compass },
          { id: "sell", label: "WHY you choose us ?", icon: RefreshCw },
          { id: "cart", label: "Cart", icon: ShoppingBag, badge: cart.reduce((sum, item) => sum + item.quantity, 0) },
          { id: "user-profile", label: "Profile", icon: User }
        ].map((tab) => {
          const IconComponent = tab.icon;
          let isActive = currentPage === tab.id;
          if (tab.id === "shop" && currentPage === "new-arrivals") isActive = true;
          if (tab.id === "shop" && currentPage === "best-sellers") isActive = true;
          if (tab.id === "sell" && currentPage === "buyback") isActive = true;
          return (
            <button key={tab.id} id={`tab-btn-${tab.id}`} onClick={() => navigateTo(tab.id)} className={`flex flex-col items-center justify-center flex-1 h-full font-sans cursor-pointer transition-all duration-300 relative ${isActive ? "text-leather font-bold" : "text-neutral-400 hover:text-[#5C3317]"}`}>
              <div className="relative">
                <IconComponent className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 text-leather" : "text-neutral-405"}`} />
                {tab.badge !== undefined && tab.badge > 0 && (<span className="absolute -top-1.5 -right-2 bg-[#5C3317] text-white rounded-full text-[8px] font-sans font-bold h-4 w-4 flex items-center justify-center shadow-xs border border-white">{tab.badge}</span>)}
              </div>
              <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 font-sans ${isActive ? "text-[#5C3317]" : "text-neutral-400"}`}>{tab.label}</span>
              {isActive && (<motion.div layoutId="activeBottomTabDot" className="absolute bottom-0 w-1 bg-[#5C3317] h-1 rounded-full" transition={{ type: "spring", stiffness: 350, damping: 30 }} />)}
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppCore />
    </AppProvider>
  );
}