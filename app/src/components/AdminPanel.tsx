
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order, Offer } from '../types';
import { isAdminEmail } from '../context/AppContext';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import {
  Settings, Plus, Edit2, Trash2, Check, X, ShieldAlert,
  Filter, ListCollapse, Award, DollarSign, PenTool, Sparkles,
  RefreshCw, Calendar, FileText, Database, Upload, Image as ImageIcon,
  Loader2, CheckCircle2, XCircle, AlertCircle, SlidersHorizontal, Star,
  Lock, MessageSquare, Gift, Percent, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Chart from 'chart.js/auto';
import { supabase } from '../supabase';
import { MultiImageUploader } from './MultiImageUploader';
import { optimizeImage } from '../utils/images';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string || 'https://joutnmqckfwtfwicfqrm.supabase.co';
const DEFAULT_ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.VITE_DATABASE_PASSWORD || "chennaileather2026";

const defaultReviews = [
  {
    name: 'Vishal Veeramani',
    quote: 'Really happy with this purchase 😊 The shoes quality is very good, super comfortable and soft to wear. Perfect fitting and nice finishing too. Also the owner was very kind and spoke very politely. Had a good experience overall. Highly recommended 👍',
    rating: 5,
  },
  {
    name: 'Nivethan Sakthi',
    quote: "It's been a long time since I purchased from YY Leathers and I must say their collection still impresses. I bought Clarks formal, Boss inspired and a Chelsea and all of them provide exceptional comfort and quality.",
    rating: 5,
  },
  {
    name: 'Aravindhan',
    quote: "Bought a pair of Chelsea boots from here and I'm beyond impressed. The leather is top quality with a beautiful, premium finish, and the sole is super soft and comfortable at a reasonable price. The shop owner was very genuine, friendly, and took great care to explain the details of the footwear to ensure I was satisfied. Highly recommend this shop👍🏻",
    rating: 5,
  },
];

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucket = 'yy-images',
  folder = 'uploads',
  label = 'Image',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max file size is 5 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block font-semibold text-[11px] text-neutral-700">{label}</label>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors flex items-center justify-center overflow-hidden
          ${value ? 'border-gold/40 bg-gold/5' : 'border-neutral-300 hover:border-gold/50 bg-neutral-50 hover:bg-gold/5'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        style={{ minHeight: value ? 100 : 72 }}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-28 object-cover rounded-md" />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold uppercase rounded z-10 pointer-events-none">
              {value.includes('supabase.co') ? 'Direct' : 'URL'}
            </div>
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-md z-20">
              <span className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Change Image
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-4 px-3 text-center">
            {uploading
              ? <Loader2 className="w-6 h-6 text-gold animate-spin" />
              : <ImageIcon className="w-6 h-6 text-neutral-400" />
            }
            <span className="text-[10px] text-neutral-500">
              {uploading ? 'Uploading…' : 'Click or drag image here'}
            </span>
            <span className="text-[9px] text-neutral-400">JPG, PNG, WEBP · max 5 MB</span>
          </div>
        )}
        {uploading && value && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
          </div>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL…"
        className="w-full p-1.5 border rounded text-[10px] bg-white focus:outline-none focus:border-gold/50 text-neutral-600"
      />
      {error && <p className="text-[10px] text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" />{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = '';
      }} />
    </div>
  );
};

async function dbGet<T>(key: string): Promise<T[]> {
  const { data, error } = await supabase
    .from('yy_store_sync')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return [];
  return (data.value as T[]) ?? [];
}

async function dbSet<T>(key: string, value: T[]): Promise<void> {
  console.warn("dbSet is deprecated. Using adminFetch to sync via server.");
}

export const AdminPanel: React.FC = () => {
  const {
    user,
    bypassAdminLogin,
    updateContentBlock,
    contentBlocks,
    setContentBlocks,
    refreshAllData,
    refreshOrdersOnly,
    sitewideDiscount: globalSitewideDiscount,
    setSitewideDiscount: setGlobalSitewideDiscount,
    setSelectedProductDetail,
    addProduct,
    updateProduct,
    updateOrderStatus,
    // Use already-fetched data from context instead of re-fetching from Supabase
    products: contextProducts,
    orders: contextOrders,
    offers: contextOffers,
    heroSlides: contextHeroSlides,
    customCategories: contextCustomCategories,
    isMaintenanceMode: globalIsMaintenanceMode,
    maintenanceTitle: globalMaintenanceTitle,
    maintenanceMessage: globalMaintenanceMessage,
    navigateTo
  } = useApp();

  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [loginFeedback, setLoginFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'new-orders' | 'reviews' | 'promos' | 'supabase' | 'settings'>('dashboard');
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M'>('1M');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Prevent re-fetching from Supabase - use context data directly
  const dataFromContext = useMemo(() => ({
    products: contextProducts || [],
    orders: contextOrders || [],
    offers: contextOffers || [],
    heroSlides: contextHeroSlides || [],
    customCategories: contextCustomCategories || [],
  }), [contextProducts, contextOrders, contextOffers, contextHeroSlides, contextCustomCategories]);

  const [currentAdminPass, setCurrentAdminPass] = useState(localStorage.getItem('yy_admin_pass') || '');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [passChangeFeedback, setPassChangeFeedback] = useState('');

  const [sitewideDiscount, setSitewideDiscount] = useState(() => {
    return Number(localStorage.getItem('yy_sitewide_discount') || '0');
  });
  const [tempSitewideDiscount, setTempSitewideDiscount] = useState(sitewideDiscount);
  const [festivalName, setFestivalName] = useState(() => {
    return localStorage.getItem('yy_festival_name') || '';
  });
  const [festivalCombineWithOffers, setFestivalCombineWithOffers] = useState(() => {
    return localStorage.getItem('yy_festival_combine') !== 'false';
  });
  const [isFestivalActive, setIsFestivalActive] = useState(() => {
    return localStorage.getItem('yy_festival_active') !== 'false';
  });
  const [festivalFeedback, setFestivalFeedback] = useState('');

  // Maintenance Settings local states
  const [isMaintMode, setIsMaintMode] = useState(false);
  const [maintTitleInput, setMaintTitleInput] = useState("We'll Be Back Soon");
  const [maintMsgInput, setMaintMsgInput] = useState("We're currently updating our store. Please check back soon.");
  const [maintFeedback, setMaintFeedback] = useState('');

  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [testOrderCreating, setTestOrderCreating] = useState(false);
  const [testOrderType, setTestOrderType] = useState<'normal' | 'birthday' | 'buyback' | 'student'>('normal');
  const [lastTestOrderId, setLastTestOrderId] = useState<string | null>(null);

  // Use context data (already fetched once) instead of making 7+ duplicate Supabase queries
  const hasInitializedRef = useRef(false);
  const loadAll = useCallback(async () => {
    setLoadingData(true);
    
    const DEFAULT_CATEGORIES = [
      "FORMAL - DERBY", "PENNY LOAFERS", "DRIVING LOAFERS", "CHELSEA BOOT",
      "TRAVEL BOOTS", "SUEDE LOAFER", "SANDALS", "MULES", "SNEAKERS",
      "PREMIUM CHELSEA", "WALLET", "BELT"
    ];

    // Use context data directly - ZERO additional Supabase queries
    // Context already fetched all data once in AppContext.fetchPublicData()
    const { products, orders, offers, heroSlides, customCategories } = dataFromContext;
    
    setProducts(products);
    setOrders(orders);
    setOffers(offers);
    setHeroSlides(heroSlides);
    setCustomCategories(customCategories.length > 0 ? customCategories : DEFAULT_CATEGORIES);
    setLoadingData(false);

    // Load discount from content blocks (already in context)
    const cbDiscount = contentBlocks.find(cb => cb.key === 'sitewide_discount');
    if (cbDiscount) {
      try {
        const val = Number(JSON.parse(cbDiscount.value));
        setSitewideDiscount(val);
        setTempSitewideDiscount(val);
        localStorage.setItem('yy_sitewide_discount', String(val));
      } catch {}
    }
  }, [contentBlocks]);

  // Run on mount AND when admin user logs in
  useEffect(() => {
    if (!user) {
      hasInitializedRef.current = false;
      return;
    }
    if (isAdminEmail(user.email)) {
      // Admin is logged in - load data
      loadAll();
    }
  }, [user?.email]); // Only re-run when user email changes

  // Auto-refresh new orders every 30 seconds when on the 'new' tab
  useEffect(() => {
    if (!user || !isAdminEmail(user.email)) return;
    if (activeTab !== 'new') return;
    const interval = setInterval(() => {
      refreshOrdersOnly(true); // bypass cache to pick up fresh orders only
    }, 30000);
    return () => clearInterval(interval);
  }, [user, activeTab, refreshOrdersOnly]);

  // Keep local admin panel state in sync with context updates (orders/offers/products)
  useEffect(() => {
    // Only update when admin is signed in
    if (!user || !isAdminEmail(user.email)) return;
    setProducts(contextProducts || []);
    setOrders(contextOrders || []);
    setOffers(contextOffers || []);
    setHeroSlides(contextHeroSlides || []);
    setCustomCategories(contextCustomCategories || []);
    setLoadingData(false);
  }, [contextProducts, contextOrders, contextOffers, contextHeroSlides, contextCustomCategories, user]);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean; latency_ms?: number; error?: string;
    row_counts?: Record<string, number>;
  } | null>(null);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);

  // Helper to make authenticated admin API calls
  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const adminEmail = user?.email || '';
    const adminPassword = currentAdminPass || localStorage.getItem('yy_admin_pass') || '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail,
      'x-admin-password': adminPassword,
      ...(options.headers as Record<string, string> || {}),
    };

    // Append to query string to bypass Netlify header stripping
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}admin_email=${encodeURIComponent(adminEmail)}&admin_password=${encodeURIComponent(adminPassword)}`;
    
    return fetch(finalUrl, { ...options, headers });
  }, [user, currentAdminPass]);

  const syncToServer = async (key: string, value: any[]) => {
    try {
      await adminFetch(`/api/admin/store-sync/${key}`, {
        method: 'POST',
        body: JSON.stringify({ value })
      });
    } catch (e) {
      console.error(`Failed to sync ${key} to server:`, e);
    }
  };

  const fetchSupabaseStatus = async () => {
    setIsSupabaseLoading(true);
    try {
      const t0 = Date.now();
      // KEY OPTIMIZATION: Only fetch keys + updated_at - NOT the full value data
      const { data, error } = await supabase.from('yy_store_sync').select('key, updated_at').limit(50);
      const latency = Date.now() - t0;
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.key] = 1;
      });
      setSupabaseStatus({ connected: true, latency_ms: latency, row_counts: counts });
    } catch (e: any) {
      setSupabaseStatus({ connected: false, error: e.message });
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'supabase') fetchSupabaseStatus();
  }, [activeTab]);

  const allCategories = Array.from(new Set([...customCategories]));

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const canvas = document.getElementById('rc') as HTMLCanvasElement;
    if (!canvas) return;
    const chartCanvas = canvas as any;
    if (chartCanvas.chartInstance) chartCanvas.chartInstance.destroy();

    const now = new Date();
    const sortedOrders = [...orders]
      .filter(o => o.status === 'Delivered')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let labels: string[] = [];
    let revenueData: number[] = [];

    if (chartTimeframe === '1D') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(d.getHours() + ':00');
        const hourStart = new Date(d.setMinutes(0, 0, 0)).getTime();
        const hourEnd = hourStart + 60 * 60 * 1000;
        const matchingOrders = sortedOrders.filter(o => {
          const t = new Date(o.created_at).getTime();
          return t >= hourStart && t < hourEnd;
        });
        revenueData.push(matchingOrders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + o.total, 0));
      }
    } else if (chartTimeframe === '1W') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const matchingOrders = sortedOrders.filter(o => {
          const t = new Date(o.created_at).getTime();
          return t >= dayStart && t < dayEnd;
        });
        revenueData.push(matchingOrders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + o.total, 0));
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(i % 5 === 0 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
        const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const matchingOrders = sortedOrders.filter(o => {
          const t = new Date(o.created_at).getTime();
          return t >= dayStart && t < dayEnd;
        });
        revenueData.push(matchingOrders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + o.total, 0));
      }
    }

    const maxRev = Math.max(...revenueData, 1000);
    const isDark = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme:dark)').matches;
    const gridC = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tickC = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    const ctx = canvas.getContext('2d');
    let gradient: any = 'rgba(74, 222, 128, 0.2)';
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
      gradient.addColorStop(1, 'rgba(74, 222, 128, 0.0)');
    }

    const formatCurrencyCompact = (val: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(val);
    };

    chartCanvas.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Net Revenue',
            data: revenueData,
            borderColor: '#22c55e',
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#22c55e',
            fill: true,
            tension: 0,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: false, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            titleColor: isDark ? '#fff' : '#000',
            bodyColor: isDark ? '#d1d5db' : '#374151',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickC, font: { size: 10 }, maxRotation: 0 }, border: { display: false } },
          y: { position: 'right', suggestedMax: maxRev * 1.2, grid: { color: gridC }, ticks: { color: tickC, font: { size: 10 }, callback: (v: any) => formatCurrencyCompact(v) }, border: { display: false } },
        }
      }
    });
  }, [activeTab, chartTimeframe, orders]);

  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled'>('All');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState(15000);
  const [pMRP, setPMRP] = useState<number | undefined>(undefined);
  const [pWeight, setPWeight] = useState(1);
  const [pSizePrices, setPSizePrices] = useState<Record<string, number>>({});
  const [pSizeMRPs, setPSizeMRPs] = useState<Record<string, number>>({});
  const [pSizeWeights, setPSizeWeights] = useState<Record<string, number>>({});
  const [pSizeQuantities, setPSizeQuantities] = useState<Record<string, number>>({});
  const [pCat, setPCat] = useState('FORMAL - DERBY');
  const [pImgs, setPImgs] = useState<string[]>([]);
  const [pNew, setPNew] = useState(false);
  const [pBest, setPBest] = useState(false);
  const [pPub, setPPub] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  const [oTitle, setOTitle] = useState('');
  const [oDesc, setODesc] = useState('');
  const [oDisc, setODisc] = useState(15);
  const [oImg, setOImg] = useState('');
  const [oUntil, setOUntil] = useState('');

  const [hsCategory, setHsCategory] = useState('FORMAL - DERBY');
  const [hsImg, setHsImg] = useState('');
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const [dragOverSlideId, setDragOverSlideId] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'product' | 'offer' | 'order' | null>(null);

  const cbAbout = contentBlocks.find(cb => cb.key === 'about');
  const aboutData = cbAbout ? JSON.parse(cbAbout.value) : { title: '', tagline: '', mission: '', paragraphs: ['', ''] };
  const [blockTitle, setBlockTitle] = useState(aboutData.title);
  const [blockTagline, setBlockTagline] = useState(aboutData.tagline);
  const [blockMission, setBlockMission] = useState(aboutData.mission);

  const cbTopSlider = contentBlocks.find(cb => cb.key === 'top_slider');
  const topSliderMessagesData: string[] = cbTopSlider ? JSON.parse(cbTopSlider.value) : [];
  const [newTopSliderMsg, setNewTopSliderMsg] = useState('');
  const [topSliderMessages, setTopSliderMessages] = useState<string[]>(topSliderMessagesData);
  const [reviewEntries, setReviewEntries] = useState(defaultReviews);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewQuote, setNewReviewQuote] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  useEffect(() => {
    const cb = contentBlocks.find(c => c.key === 'top_slider');
    if (cb) setTopSliderMessages(JSON.parse(cb.value));

    const reviewCb = contentBlocks.find(c => c.key === 'site_reviews');
    if (reviewCb) {
      try {
        const parsed = JSON.parse(reviewCb.value);
        setReviewEntries(Array.isArray(parsed) && parsed.length ? parsed : defaultReviews);
      } catch {
        setReviewEntries(defaultReviews);
      }
    } else {
      setReviewEntries(defaultReviews);
    }

    const cbDiscount = contentBlocks.find(cb => cb.key === 'sitewide_discount');
    if (cbDiscount) {
      try {
        const val = Number(JSON.parse(cbDiscount.value));
        setSitewideDiscount(val);
        setTempSitewideDiscount(val);
        localStorage.setItem('yy_sitewide_discount', String(val));
      } catch {}
    }

    const cbActive = contentBlocks.find(cb => cb.key === 'festival_active');
    if (cbActive) {
      try {
        const val = JSON.parse(cbActive.value) === true;
        setIsFestivalActive(val);
        localStorage.setItem('yy_festival_active', String(val));
      } catch {}
    }

    const cbCombine = contentBlocks.find(cb => cb.key === 'festival_combine_with_offers');
    if (cbCombine) {
      try {
        const val = JSON.parse(cbCombine.value) === true;
        setFestivalCombineWithOffers(val);
        localStorage.setItem('yy_festival_combine', String(val));
      } catch {}
    }

    const cbName = contentBlocks.find(cb => cb.key === 'festival_name');
    if (cbName) {
      try {
        const val = JSON.parse(cbName.value);
        setFestivalName(val);
        localStorage.setItem('yy_festival_name', val);
      } catch {}
    }

    const cbMaintMode = contentBlocks.find(cb => cb.key === 'maintenance_mode');
    if (cbMaintMode) {
      try {
        const val = JSON.parse(cbMaintMode.value) === true;
        setIsMaintMode(val);
      } catch {}
    }

    const cbMaintTitle = contentBlocks.find(cb => cb.key === 'maintenance_title');
    if (cbMaintTitle) {
      try {
        const val = JSON.parse(cbMaintTitle.value);
        setMaintTitleInput(val);
      } catch {}
    }

    const cbMaintMsg = contentBlocks.find(cb => cb.key === 'maintenance_message');
    if (cbMaintMsg) {
      try {
        const val = JSON.parse(cbMaintMsg.value);
        setMaintMsgInput(val);
      } catch {}
    }
  }, [contentBlocks]);

  const handleAddTopSliderMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopSliderMsg.trim()) return;
    const updated = [...topSliderMessages, newTopSliderMsg.trim()];
    setTopSliderMessages(updated);
    setNewTopSliderMsg('');
    await updateContentBlock('top_slider', updated);
  };

  const handleDeleteTopSliderMsg = async (idx: number) => {
    const updated = topSliderMessages.filter((_, i) => i !== idx);
    setTopSliderMessages(updated);
    await updateContentBlock('top_slider', updated);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewQuote.trim()) return;
    const updated = [
      ...reviewEntries,
      { name: newReviewName.trim(), quote: newReviewQuote.trim(), rating: Number(newReviewRating) || 5 },
    ];
    setReviewEntries(updated);
    setNewReviewName('');
    setNewReviewQuote('');
    setNewReviewRating(5);
    await updateContentBlock('site_reviews', updated);
  };

  const handleDeleteReview = async (idx: number) => {
    const updated = reviewEntries.filter((_, i) => i !== idx);
    setReviewEntries(updated);
    await updateContentBlock('site_reviews', updated);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeFeedback('');
    if (newAdminPass.length < 6) {
      setPassChangeFeedback('Password must be at least 6 characters');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setPassChangeFeedback('Passwords do not match');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('yy_admin_pass', newAdminPass);
    setCurrentAdminPass(newAdminPass);
    setNewAdminPass('');
    setConfirmAdminPass('');
    
    // ALSO save to database so server can authenticate
    try {
      const currentBlocks = [...contentBlocks];
      const existingIdx = currentBlocks.findIndex(cb => cb.key === 'admin_password');
      const newBlock = { id: 'cb-admin_password', key: 'admin_password', value: newAdminPass };
      
      if (existingIdx !== -1) {
        currentBlocks[existingIdx] = newBlock;
      } else {
        currentBlocks.push(newBlock);
      }

      // Save via server backend instead of direct Supabase (Security Fix)
      try {
        await adminFetch('/api/admin/store-sync/content_blocks', {
          method: 'POST',
          body: JSON.stringify({ value: currentBlocks })
        });
        
        // Update local state
        setContentBlocks(currentBlocks);
        
        // Invalidate server-side password cache so it picks up the new password
        try {
          const adminPass = newAdminPass;
          const adminEmail = user?.email || '';
          await fetch('/api/admin/invalidate-password-cache', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-email': adminEmail,
              'x-admin-password': adminPass,
            },
          });
        } catch (cacheError) {
          console.warn('Failed to invalidate server cache:', cacheError);
        }
        
        setPassChangeFeedback('✅ Admin password changed successfully!');
      } catch (error) {
        console.error('Failed to save password to database:', error);
        setPassChangeFeedback('⚠️ Password saved locally but failed to sync to database');
      }
    } catch (err) {
      console.error('Error saving password:', err);
      setPassChangeFeedback('⚠️ Password saved locally but failed to sync to database');
    }
    
    setTimeout(() => setPassChangeFeedback(''), 3000);
  };

  const handleSaveSitewideDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.min(100, Math.max(0, Number(tempSitewideDiscount) || 0));
    setSitewideDiscount(val);
    setTempSitewideDiscount(val);
    localStorage.setItem('yy_sitewide_discount', String(val));
    localStorage.setItem('yy_festival_name', festivalName);
    localStorage.setItem('yy_festival_combine', String(festivalCombineWithOffers));
    localStorage.setItem('yy_festival_active', String(isFestivalActive));

    const currentBlocks = [...contentBlocks];
    const updates = [
      { key: 'sitewide_discount', value: JSON.stringify(val) },
      { key: 'festival_name', value: JSON.stringify(festivalName) },
      { key: 'festival_combine_with_offers', value: JSON.stringify(festivalCombineWithOffers) },
      { key: 'festival_active', value: JSON.stringify(isFestivalActive) },
    ];

    for (const { key, value } of updates) {
      const existingIdx = currentBlocks.findIndex(cb => cb.key === key);
      if (existingIdx !== -1) {
        currentBlocks[existingIdx] = { id: `cb-${key}`, key, value };
      } else {
        currentBlocks.push({ id: `cb-${key}`, key, value });
      }
    }

    // Set local context contentBlocks state immediately
    setContentBlocks(currentBlocks);

    try {
      // Sync locally to server's db.json
      await adminFetch('/api/admin/store-sync/content_blocks', {
        method: 'POST',
        body: JSON.stringify({ value: currentBlocks })
      });
      setFestivalFeedback('✅ Festival settings updated and synced successfully!');
    } catch (e) {
      console.warn('Failed to save content_blocks to local server API', e);
      setFestivalFeedback('⚠️ Settings saved locally but cloud sync failed.');
    }

    setGlobalSitewideDiscount(val);
    setTimeout(() => setFestivalFeedback(''), 3000);
  };

  const toggleFestivalActive = async () => {
    const newState = !isFestivalActive;
    setIsFestivalActive(newState);
    localStorage.setItem('yy_festival_active', String(newState));
    await updateContentBlock('festival_active', newState);
    // Don't call refreshAllData - contentBlocks already updated in context via updateContentBlock
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Toggle check warning confirm
    const isActivating = isMaintMode;
    const confirmMessage = isActivating
      ? "Are you sure you want to put the website into maintenance mode? Normal customers will temporarily see the maintenance page."
      : "Are you sure you want to take the website out of maintenance mode? Normal customers will be able to browse and shop again.";
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setMaintFeedback("Saving settings...");

    const currentBlocks = [...contentBlocks];
    const updates = [
      { key: 'maintenance_mode', value: JSON.stringify(isMaintMode) },
      { key: 'maintenance_title', value: JSON.stringify(maintTitleInput) },
      { key: 'maintenance_message', value: JSON.stringify(maintMsgInput) },
    ];

    for (const { key, value } of updates) {
      const existingIdx = currentBlocks.findIndex(cb => cb.key === key);
      if (existingIdx !== -1) {
        currentBlocks[existingIdx] = { id: `cb-${key}`, key, value };
      } else {
        currentBlocks.push({ id: `cb-${key}`, key, value });
      }
    }

    // Set local context contentBlocks state immediately
    setContentBlocks(currentBlocks);

    try {
      // Sync locally to server's db.json
      await adminFetch('/api/admin/store-sync/content_blocks', {
        method: 'POST',
        body: JSON.stringify({ value: currentBlocks })
      });
      setMaintFeedback(isMaintMode 
        ? "🔴 Website is currently under maintenance. Customers cannot access the storefront." 
        : "🟢 Website is online! Customers can access the storefront."
      );
    } catch (localErr) {
      console.warn('Failed to sync content_blocks to local server API:', localErr);
      setMaintFeedback("⚠️ Settings saved locally but cloud sync failed.");
    }

    setTimeout(() => setMaintFeedback(''), 4000);
  };

  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredEmail) {
      setLoginFeedback("Please enter your admin email.");
      return;
    }
    if (!enteredPassword) {
      setLoginFeedback("Please enter your admin password.");
      return;
    }
    setLoginLoading(true);
    setLoginFeedback('Verifying credentials...');
    const ok = await bypassAdminLogin(enteredEmail, enteredPassword);
    setLoginLoading(false);
    if (!ok) setLoginFeedback("❌ Invalid password. Please check and try again.");
    else setLoginFeedback('');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-900 pt-36 pb-24 px-4 flex items-center justify-center font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-gold max-w-md w-full p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-leather/10 border border-gold/40 rounded-full flex items-center justify-center text-leather font-bold text-xl mx-auto mb-3 font-serif">YY</div>
            <h3 className="font-serif text-2xl font-bold tracking-wide text-leather-dark">Atelier Administration</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-1">Secure Admin Access</p>
          </div>
          <form onSubmit={handleAdminBypass} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 block">Admin Email</label>
              <input 
                type="email" 
                value={enteredEmail}
                onChange={(e) => {
                  setEnteredEmail(e.target.value);
                  setLoginFeedback('');
                }}
                placeholder="Enter your admin email..."
                required
                className="w-full text-xs p-3 border border-neutral-300 rounded bg-white focus:outline-none focus:border-gold text-neutral-800" 
              />
              <p className="text-[9px] text-neutral-400 mt-1">Authorized: dhwaragandhwaragan9@gmail.com, Yomeyom786@gmail.com, stanislauscbe@gmail.com</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 block">Secure Password</label>
              <input 
                type="password" 
                required 
                value={enteredPassword} 
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter admin password..."
                minLength={6}
                className="w-full text-xs p-3 border border-neutral-250 rounded focus:outline-none focus:border-gold font-sans" 
              />
              {loginFeedback && <p className={`text-[11px] mt-1 ${loginLoading ? 'text-amber-500' : 'text-red-500'}`}>{loginFeedback}</p>}
            </div>
            <button type="submit" disabled={loginLoading} className="w-full bg-leather hover:bg-gold text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 rounded transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loginLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</> : 'Authenticate'}
            </button>
          </form>
          <div className="p-3.5 bg-neutral-50 rounded border text-[10px] text-neutral-500 leading-relaxed">
            <span className="font-bold text-neutral-700 uppercase tracking-wide block mb-1">Security Notice:</span>
            <span>This panel is restricted to authorized administrators only.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      // Optimize images before saving to database
      const optimizedImages = pImgs.length > 0 
        ? pImgs.map(img => optimizeImage(img, 800)) 
        : ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop'];
      
      const payload: Product = {
        id: editingProductId || `prod-${Date.now()}`,
        name: pName,
        description: pDesc,
        price: Number(pPrice),
        mrp: pMRP,
        weight_kg: Number(pWeight) > 0 ? Number(pWeight) : 1,
        sizePrices: Object.keys(pSizePrices).length ? pSizePrices : undefined,
        sizeMRPs: Object.keys(pSizeMRPs).length ? pSizeMRPs : undefined,
        sizeWeights: Object.keys(pSizeWeights).length ? pSizeWeights : undefined,
        sizeQuantities: Object.keys(pSizeQuantities).length ? pSizeQuantities : undefined,
        category: pCat,
        images: optimizedImages,
        is_new_arrival: pNew,
        is_best_seller: pBest,
        is_published: pPub,
        created_at: editingProductId ? products.find(p => p.id === editingProductId)?.created_at || new Date().toISOString() : new Date().toISOString(),
      };
      
      // Use the context's addProduct/updateProduct functions which call the API
      let success = false;
      if (editingProductId) {
        success = await updateProduct(editingProductId, payload);
      } else {
        success = await addProduct(payload);
      }
      
      if (success) {
        setShowProductModal(false);
        setEditingProductId(null);
        setPName(''); setPDesc(''); setPImgs([]);
        setPMRP(undefined); setPWeight(1); setPSizePrices({}); setPSizeMRPs({}); setPSizeWeights({}); setPSizeQuantities({});
        setPNew(false); setPBest(false); setPPub(true);
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id); setPName(p.name); setPDesc(p.description);
    setPPrice(p.price); setPCat(p.category); setPImgs(p.images || []);
    setPMRP((p as any).mrp);
    setPWeight(p.weight_kg ?? 1);
    setPSizePrices((p as any).sizePrices || {});
    setPSizeMRPs((p as any).sizeMRPs || {});
    setPSizeWeights((p as any).sizeWeights || {});
    setPSizeQuantities((p as any).sizeQuantities || {});
    setPNew(p.is_new_arrival); setPBest(p.is_best_seller); setPPub(p.is_published);
    setShowProductModal(true);
  };

  const handleTriggerAddProduct = () => {
    setEditingProductId(null); setPName(''); setPDesc(''); setPPrice(15000);
    setPCat('FORMAL - DERBY'); setPImgs([]); setPNew(false); setPBest(false); setPPub(true);
    setPMRP(undefined); setPWeight(1); setPSizePrices({}); setPSizeMRPs({}); setPSizeWeights({}); setPSizeQuantities({});
    setShowProductModal(true);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName && newCatName.trim() !== '') {
      const upperCat = newCatName.trim().toUpperCase();
      if (!allCategories.includes(upperCat)) {
        const updated = [...customCategories, upperCat];
        await syncToServer('custom_categories', updated);
        setCustomCategories(updated);
        await refreshAllData();
      }
    }
    setNewCatName('');
  };

  const handleDeleteCategory = async (cat: string) => {
    const updated = customCategories.filter(c => c !== cat);
    await syncToServer('custom_categories', updated);
    setCustomCategories(updated);
    await refreshAllData();
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    if (deleteConfirmType === 'product') {
      const updated = products.filter(p => p.id !== deleteConfirmId);
      await syncToServer('products', updated);
      await refreshAllData(true);
      setProducts(updated);
    } else if (deleteConfirmType === 'offer') {
      const updated = offers.filter(o => o.id !== deleteConfirmId);
      await syncToServer('offers', updated);
      await refreshAllData(true);
      setOffers(updated);
    } else if (deleteConfirmType === 'order') {
      try {
        await adminFetch(`/api/orders/${deleteConfirmId}`, {
          method: 'DELETE'
        });
        // Force refresh all context data so the order list updates on screen immediately
        await refreshAllData(true);
      } catch (e) {
        console.warn('Failed to delete order from local API', e);
      }
    }
    setDeleteConfirmId(null); setDeleteConfirmType(null);
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    // Call AppContext updateOrderStatus to ensure context and db are fully synchronized instantly
    await updateOrderStatus(id, status);
  };

  const handleUpdateOrderBuyback = async (id: string, status: 'Confirmed' | 'Rejected') => {
    let rejectComment = '';
    if (status === 'Rejected') {
      const comment = prompt('Enter rejection reason for the customer:');
      if (comment === null) return;
      rejectComment = comment || 'No specific reason provided';
    }

    const updated = orders.map(o => {
      if (o.id === id && o.buyback_requested && o.buyback_details) {
        let newTotal = o.total;
        if (status === 'Confirmed') {
          if (o.buyback_details.status === 'Rejected') {
            newTotal = Math.round(o.total / 0.9);
          }
        } else if (status === 'Rejected') {
          if (o.buyback_details.status === 'Pending' || o.buyback_details.status === 'Confirmed') {
            newTotal = Math.round(o.total * 0.9);
          }
        }
        return {
          ...o,
          total: newTotal,
          buyback_details: {
            ...o.buyback_details,
            status,
            rejection_comment: status === 'Rejected' ? rejectComment : undefined
          }
        };
      }
      return o;
    });

    const targetOrder = updated.find(o => o.id === id);
    if (targetOrder) {
      // Direct PUT request to update order properties (buyback status, new total) on the backend
      try {
        await adminFetch(`/api/orders/${id}`, {
          method: 'PUT',
          body: JSON.stringify(targetOrder),
        });
      } catch (e) {
        console.warn('Failed to save buyback update to local API', e);
      }
      // Force refreshing context data so all screens pick up new buyback properties
      await refreshAllData(true);
    }
  };

  const handleRejectOrderWithComment = (ord: Order) => {
    setRejectModalOrder(ord);
    setRejectReason('');
  };

  const handleSubmitRejection = async () => {
    if (!rejectModalOrder) return;
    const reason = rejectReason.trim() || 'No specific reason provided';
    
    // Call PUT endpoint with cancelled status & rejection comment
    try {
      await adminFetch(`/api/orders/${rejectModalOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Cancelled', rejection_comment: reason }),
      });
    } catch (e) {
      console.warn('Failed to save rejection to local API', e);
    }
    
    setRejectModalOrder(null);
    setRejectReason('');
    await refreshAllData(true);
  };

  // ── TEST ORDER CREATOR ──
  const handleCreateTestOrder = async () => {
    setTestOrderCreating(true);
    setLastTestOrderId(null);
    try {
      // Pick a real product from inventory if available, else use a placeholder
      const sampleProduct = products.length > 0 ? products[Math.floor(Math.random() * products.length)] : null;
      const fakeNames = ['Arjun Kumar', 'Priya Sharma', 'Ravi Chandran', 'Deepa Nair', 'Vikram Bose'];
      const fakeEmails = ['test1@example.com', 'demo@yyleathers.com', 'customer@test.in'];
      const fakeAddresses = [
        'No 12, Anna Nagar, Chennai - 600040',
        'Flat 3B, T Nagar, Chennai - 600017',
        'No 45, Velachery Main Road, Chennai - 600042',
        'No 8, Adyar, Chennai - 600020',
      ];
      const productItem = sampleProduct ? {
        product: sampleProduct,
        quantity: 1,
        selectedSize: sampleProduct.sizes?.[0] || '42',
      } : {
        product: {
          id: 'test-prod-001',
          name: 'Classic Derby (Test)',
          price: 1799,
          images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
          category: 'FORMAL - DERBY',
          sizes: ['40', '41', '42', '43'],
          stock: 10,
          description: 'Test product',
          is_featured: false,
          created_at: new Date().toISOString(),
        },
        quantity: 1,
        selectedSize: '42',
      };
      const productPrice = productItem.product.price || 1799;
      const deliveryCharge = 160;
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const email = fakeEmails[Math.floor(Math.random() * fakeEmails.length)];
      const address = fakeAddresses[Math.floor(Math.random() * fakeAddresses.length)];

      let total = productPrice + deliveryCharge;
      let birthdayDetails = undefined;
      let buybackDetails = undefined;
      let studentDetails = undefined;

      if (testOrderType === 'birthday') {
        total = Math.max(0, total - 250); // birthday ₹250 off
        birthdayDetails = { gov_id_number: 'TEST1234', dob: '1998-08-12', gov_id_photo_url: '', status: 'Pending' };
      } else if (testOrderType === 'buyback') {
        total = Math.round(total * 0.9); // 10% buyback discount
        buybackDetails = { shoe_details: 'Old Brown Derby (Test)', bill_no: 'YY-TEST-001', bought_date: '2023-01-15', photo_url: '', status: 'Pending' };
      } else if (testOrderType === 'student') {
        total = Math.round(total * 0.95); // 5% student discount
        studentDetails = { college_name: 'Test College', id_photo_url: '', status: 'Pending' };
      }

      const payload = {
        user_id: `test-user-${Date.now()}`,
        customer_name: `[TEST] ${name}`,
        customer_email: email,
        phone: '+91 98765 43210',
        address,
        items: [productItem],
        total,
        delivery_region: 'TN',
        delivery_charge: deliveryCharge,
        estimated_weight_kg: 1,
        razorpay_order_id: `test_order_${Date.now()}`,
        razorpay_payment_id: `test_pay_${Date.now()}`,
        birthday_benefit_requested: testOrderType === 'birthday',
        birthday_benefit_details: birthdayDetails,
        buyback_requested: testOrderType === 'buyback',
        buyback_details: buybackDetails,
        student_discount_requested: testOrderType === 'student',
        student_discount_details: studentDetails,
        applied_offer: 'none',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.order?.id) {
        setLastTestOrderId(data.order.id);
        await refreshAllData(true);
      } else {
        alert('Failed to create test order: ' + (data.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error creating test order: ' + e.message);
    } finally {
      setTestOrderCreating(false);
    }
  };

  const handleAddPromoOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      title: oTitle,
      description: oDesc,
      discount_percent: oDisc,
      banner_url: oImg || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop',
      valid_until: oUntil || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      is_active: true,
    };
    const updated = [...offers, newOffer];
    await syncToServer('offers', updated);
    await refreshAllData(true);
    setOffers(updated);
    setOTitle(''); setODesc(''); setOImg(''); setOUntil('');
  };

  const handleAddHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsImg) return;
    const newSlide = {
      id: `hs-${Date.now()}`,
      category: hsCategory,
      image_url: hsImg,
    };
    const updated = [...(heroSlides || []), newSlide];
    await syncToServer('hero_slides', updated);
    await refreshAllData(true);
    setHeroSlides(updated);
    setHsImg('');
  };

  const handleDeleteHeroSlide = async (id: string) => {
    const updated = heroSlides.filter(s => s.id !== id);
    await syncToServer('hero_slides', updated);
    await refreshAllData(true);
    setHeroSlides(updated);
  };

  const handleDragStart = (id: string) => {
    setDraggedSlideId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSlideId !== id) {
      setDragOverSlideId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlideId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedSlideId || draggedSlideId === targetId) {
      setDraggedSlideId(null);
      setDragOverSlideId(null);
      return;
    }

    const slides = [...heroSlides];
    const draggedIndex = slides.findIndex(s => s.id === draggedSlideId);
    const targetIndex = slides.findIndex(s => s.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = slides.splice(draggedIndex, 1);
      slides.splice(targetIndex, 0, removed);

      // Save to Supabase
      await syncToServer('hero_slides', slides);
      await refreshAllData(true);
      
      // Update local state immediately
      setHeroSlides(slides);
    }

    setDraggedSlideId(null);
    setDragOverSlideId(null);
  };

  const handleDragEnd = () => {
    setDraggedSlideId(null);
    setDragOverSlideId(null);
  };

  const handleUpdateStaticContent = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateContentBlock('about', { title: blockTitle, tagline: blockTagline, mission: blockMission, paragraphs: aboutData.paragraphs || ['', ''] });
  };

  const calculatedRevenue = orders.filter(o => o.status === 'Delivered').reduce((a, o) => a + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Ordered').length;
  const processingOrdersCount = orders.filter(o => o.status === 'Confirmed' || o.status === 'Dispatched').length;
  const filteredOrders = orders.filter(o => orderFilter === 'All' ? true : o.status === orderFilter);

  // Get admin first name for greeting
  const adminFirstName = (user as any)?.name?.split(' ')[0] || 'Admin';

  return (
    <>
      <style>{`
        :root {
          --color-background-primary: #f9fafb;
          --color-background-secondary: #ffffff;
          --color-background-tertiary: #f3f4f6;
          --color-border-tertiary: #e5e7eb;
          --color-border-secondary: #d1d5db;
          --color-text-primary: #171717;
          --color-text-secondary: #404040;
          --color-text-tertiary: #737373;
          --border-radius-md: 8px;
          --border-radius-lg: 12px;
          --navbar-height: 80px;
        }

        /* ── LAYOUT ── */
        .adm {
          display: flex;
          min-height: calc(100dvh - var(--navbar-height));
          background: var(--color-background-primary);
          font-family: var(--font-sans);
          position: relative;
          padding-top: var(--navbar-height);
        }

        /* ── SIDEBAR ── */
        .sb {
          width: 210px;
          flex-shrink: 0;
          background: var(--color-background-secondary);
          border-right: 0.5px solid var(--color-border-tertiary);
          display: flex;
          flex-direction: column;
          padding: 16px 10px;
          position: sticky;
          top: var(--navbar-height);
          height: calc(100dvh - var(--navbar-height));
          overflow-y: auto;
          transition: width 0.3s ease, padding 0.3s ease;
        }
        .sb.collapsed { width: 60px; padding: 16px 5px; }
        .sb-logo { padding: 4px 10px 18px; }
        .sb-brand { font-size: 12px; font-weight: 500; color: #b8902a; letter-spacing: 0.12em; text-transform: uppercase; }
        .sb-sub { font-size: 10px; color: var(--color-text-tertiary); margin-top: 2px; letter-spacing: 0.06em; }

        .collapse-btn {
          position: absolute; top: 10px; right: -12px;
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--color-background-secondary);
          border: 0.5px solid var(--color-border-tertiary);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          z-index: 10; transition: all 0.2s;
        }
        .collapse-btn:hover { background: var(--color-background-tertiary); }
        .collapse-btn svg { width: 14px; height: 14px; color: var(--color-text-tertiary); transition: transform 0.3s; }
        .sb.collapsed .collapse-btn svg { transform: rotate(180deg); }

        .sb-sec { font-size: 9px; color: var(--color-text-tertiary); letter-spacing: 0.12em; text-transform: uppercase; padding: 14px 10px 5px; }
        .sb.collapsed .sb-sec { padding: 14px 5px 5px; font-size: 8px; text-align: center; }

        .nav { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: var(--border-radius-md); cursor: pointer; font-size: 12px; color: var(--color-text-secondary); transition: background 0.12s; white-space: nowrap; }
        .sb.collapsed .nav { padding: 8px 5px; justify-content: center; font-size: 10px; }
        .nav:hover { background: var(--color-background-tertiary); }
        .nav.on { background: rgba(184,144,42,0.12); color: #b8902a; }

        .nbadge { margin-left: auto; font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 20px; background: rgba(184,144,42,0.15); color: #b8902a; }
        .nbadge.r { background: rgba(220,70,70,0.12); color: #b83a3a; }
        .nbadge.g { background: rgba(45,143,90,0.12); color: #2d8f5a; }
        .sb.collapsed .nbadge { display: none; }

        /* ── MOBILE NAV ── */
        .mob-nav {
          display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: #fff; border-top: 1px solid var(--color-border-tertiary);
          padding: 6px 4px env(safe-area-inset-bottom);
          overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .mob-nav::-webkit-scrollbar { display: none; }
        .mob-nav-inner { display: flex; gap: 2px; min-width: max-content; padding: 0 4px; }
        .mob-tab {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 6px 10px; border-radius: 10px; cursor: pointer; min-width: 60px;
          font-size: 9px; color: var(--color-text-tertiary); font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase; transition: all 0.15s;
          white-space: nowrap; position: relative;
        }
        .mob-tab.on { background: rgba(184,144,42,0.1); color: #b8902a; }
        .mob-tab-badge {
          position: absolute; top: 4px; right: 8px; min-width: 14px; height: 14px;
          background: #b83a3a; color: #fff; border-radius: 999px; font-size: 8px;
          font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 3px;
        }

        /* ── MAIN AREA ── */
        .main { flex: 1; display: flex; flex-direction: column; overflow: auto; min-width: 0; }

        /* ── WELCOME TOPBAR ── */
        .welcome-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; background: var(--color-background-secondary);
          border-bottom: 0.5px solid var(--color-border-tertiary);
          gap: 8px; flex-wrap: wrap; flex-shrink: 0;
        }
        .welcome-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); font-family: var(--font-serif, serif); }
        .welcome-sub { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
        .wb-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
        .wb-btn {
          background: var(--color-background-secondary); border: 0.5px solid var(--color-border-secondary);
          border-radius: var(--border-radius-md); padding: 6px 12px; font-size: 11px;
          color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center;
          gap: 5px; transition: 0.12s; white-space: nowrap;
        }
        .wb-btn:hover { background: var(--color-background-tertiary); }
        .wb-btn.gold { background: rgba(184,144,42,0.1); border-color: rgba(184,144,42,0.35); color: #b8902a; }
        .wb-btn.gold:hover { background: rgba(184,144,42,0.18); }
        .av { width: 28px; height: 28px; border-radius: 50%; background: rgba(184,144,42,0.15); border: 1.5px solid rgba(184,144,42,0.35); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: #b8902a; flex-shrink: 0; }

        /* ── CONTENT ── */
        .content { flex: 1; overflow-y: auto; padding: 14px 16px 100px; display: flex; flex-direction: column; gap: 12px; }

        /* ── STAT CARDS ── */
        .stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .sc { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 14px; position: relative; overflow: hidden; }
        .sc-top { height: 2px; position: absolute; top: 0; left: 0; right: 0; }
        .sc-lbl { font-size: 9px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 7px; }
        .sc-val { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
        .sc-val span { font-size: 10px; color: var(--color-text-tertiary); }
        .sc-chg { display: flex; align-items: center; gap: 3px; margin-top: 5px; font-size: 10px; }
        .sc-chg.up { color: #2d8f5a; } .sc-chg.warn { color: #b8902a; } .sc-chg.dn { color: #b83a3a; }
        .sc-ico { position: absolute; right: 10px; top: 10px; opacity: 0.08; color: var(--color-text-primary); }

        /* ── PANELS ── */
        .mid { display: grid; grid-template-columns: 1fr 300px; gap: 12px; }
        .panel { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); overflow: hidden; }
        .ph { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .ph-title { font-size: 12px; font-weight: 500; color: var(--color-text-primary); }
        .ph-act { font-size: 10px; color: #b8902a; cursor: pointer; display: flex; align-items: center; gap: 3px; }

        .pills { display: flex; gap: 3px; flex-wrap: wrap; }
        .pill { font-size: 10px; padding: 3px 8px; border-radius: 20px; cursor: pointer; border: 0.5px solid transparent; color: var(--color-text-tertiary); }
        .pill.on { background: rgba(184,144,42,0.12); border-color: rgba(184,144,42,0.3); color: #b8902a; }

        .or { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 11px; }
        .or:last-child { border: none; }
        .o-id { font-weight: 500; color: var(--color-text-primary); min-width: 64px; }
        .o-cust { color: var(--color-text-tertiary); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .o-amt { font-weight: 500; color: var(--color-text-primary); min-width: 60px; text-align: right; }

        .badge { font-size: 9px; padding: 2px 6px; border-radius: 20px; font-weight: 500; min-width: 56px; text-align: center; flex-shrink: 0; }
        .b-pend { background: rgba(184,144,42,0.12); color: #b8902a; }
        .b-conf { background: rgba(56,130,210,0.12); color: #2b6cb0; }
        .b-disp { background: rgba(130,80,200,0.12); color: #7c3aed; }
        .b-delv { background: rgba(45,143,90,0.12); color: #2d8f5a; }

        .pr { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: var(--border-radius-md); background: var(--color-background-tertiary); margin: 4px 10px; }
        .p-img { width: 34px; height: 38px; border-radius: 6px; background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .p-img img { width: 100%; height: 100%; object-fit: cover; }
        .p-info { flex: 1; min-width: 0; }
        .p-name { font-size: 11px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-cat { font-size: 9px; color: var(--color-text-tertiary); margin-top: 1px; }
        .p-price { font-size: 11px; font-weight: 500; color: #b8902a; }
        .p-tag { font-size: 8px; padding: 2px 5px; border-radius: 4px; margin-top: 3px; display: inline-block; }
        .t-new { background: rgba(56,130,210,0.12); color: #2b6cb0; }
        .t-best { background: rgba(184,144,42,0.12); color: #b8902a; }

        .bot { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .chart-wrap { padding: 12px 16px 14px; }

        .bb-row { display: flex; align-items: center; gap: 9px; padding: 9px 14px; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .bb-row:last-child { border: none; }
        .sy-row { display: flex; align-items: center; gap: 9px; padding: 9px 14px; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 11px; }
        .sy-row:last-child { border: none; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-border-tertiary); flex-shrink: 0; }
        .dot.on { background: #2d8f5a; }
        .sy-nm { color: var(--color-text-secondary); flex: 1; }
        .sy-ct { color: var(--color-text-tertiary); font-weight: 500; }

        .adm-scroll::-webkit-scrollbar { width: 4px; }
        .adm-scroll::-webkit-scrollbar-track { background: transparent; }
        .adm-scroll::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 10px; }

        /* ── MOBILE ── */
        @media (max-width: 767px) {
          :root { --navbar-height: 64px; }
          .adm { flex-direction: column; padding-top: var(--navbar-height); }
          .sb { display: none; }
          .mob-nav { display: flex; z-index: 80; }
          .main { flex: 1; overflow: visible; }
          .welcome-bar { padding: 10px 14px; }
          .welcome-sub { display: none; }
          .wb-btn:not(.gold) { display: none; }
          .content { padding: 12px 12px 110px; gap: 10px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .sc-val { font-size: 16px; }
          .sc-lbl { font-size: 8px; }
          .mid { grid-template-columns: 1fr; }
          .bot { grid-template-columns: 1fr; }
          .or { padding: 8px 12px; gap: 6px; }
          .o-cust { display: none; }
          .chart-wrap { padding: 10px 12px 12px; }
        }
      `}</style>

      <div className="min-h-screen bg-neutral-900 pt-0 pb-0 font-sans select-none">
        <div className="adm w-full max-w-[1280px] mx-auto">

          {/* ── SIDEBAR ── */}
          <div className={`sb ${isPanelCollapsed ? 'collapsed' : ''}`}>
            <button className="collapse-btn" onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="sb-logo">
              <div className="sb-brand">YY</div>
              <div className="sb-sub">Atelier HQ</div>
            </div>
            <div className="sb-sec">Main</div>
            {[
              { key: 'dashboard', icon: <Settings className="w-[15px] h-[15px]" />, label: 'Dashboard' },
              { key: 'products',  icon: <ListCollapse className="w-[15px] h-[15px]" />, label: 'Inventory', badge: products.length },
              { key: 'orders',    icon: <DollarSign className="w-[15px] h-[15px]" />, label: 'Orders', badge: orders.length },
            ].map(({ key, icon, label, badge }) => (
              <div key={key} className={`nav ${activeTab === key ? 'on' : ''}`} onClick={() => setActiveTab(key as any)}>
                <div className="w-[15px] flex justify-center">{icon}</div> {label}
                {badge !== undefined && <span className="nbadge">{badge}</span>}
              </div>
            ))}
            <div className="sb-sec">Custom</div>
            <div className={`nav ${activeTab === 'new-orders' ? 'on' : ''}`} onClick={() => setActiveTab('new-orders')}>
              <div className="w-[15px] flex justify-center"><PenTool className="w-[15px] h-[15px]" /></div> New orders
              {pendingOrdersCount > 0 && <span className="nbadge">{pendingOrdersCount}</span>}
            </div>
            <div className={`nav ${activeTab === 'reviews' ? 'on' : ''}`} onClick={() => setActiveTab('reviews')}>
              <div className="w-[15px] flex justify-center"><Star className="w-[15px] h-[15px]" /></div> Reviews
            </div>
            <div className="sb-sec">Marketing</div>
            <div className={`nav ${activeTab === 'promos' ? 'on' : ''}`} onClick={() => setActiveTab('promos')}>
              <div className="w-[15px] flex justify-center"><Sparkles className="w-[15px] h-[15px]" /></div> Offers & banners
            </div>
            <div className="sb-sec">Admin</div>
            <div className={`nav ${activeTab === 'settings' ? 'on' : ''}`} onClick={() => setActiveTab('settings')}>
              <div className="w-[15px] flex justify-center"><Lock className="w-[15px] h-[15px]" /></div> Settings
            </div>
            <div className="sb-sec" style={{ marginTop: 'auto' }}>Infra</div>
            <div className={`nav ${activeTab === 'supabase' ? 'on' : ''}`} onClick={() => setActiveTab('supabase')}>
              <div className="w-[15px] flex justify-center"><Database className="w-[15px] h-[15px]" /></div> Supabase sync
              {supabaseStatus?.connected
                ? <span className="nbadge g">Live</span>
                : <span className="nbadge r">Off</span>}
            </div>
          </div>

          {/* ── MOBILE NAV ── */}
          <nav className="mob-nav">
            <div className="mob-nav-inner">
              {([
                { key: 'dashboard',   icon: <Settings className="w-4 h-4" />,     label: 'Home' },
                { key: 'products',    icon: <ListCollapse className="w-4 h-4" />,  label: 'Catalog' },
                { key: 'new-orders',  icon: <PenTool className="w-4 h-4" />,       label: 'New', badge: pendingOrdersCount },
                { key: 'reviews',     icon: <Star className="w-4 h-4" />,          label: 'Reviews' },
                { key: 'orders',      icon: <DollarSign className="w-4 h-4" />,    label: 'Orders' },
                { key: 'promos',      icon: <Sparkles className="w-4 h-4" />,      label: 'Promos' },
                { key: 'settings',    icon: <Lock className="w-4 h-4" />,          label: 'Settings' },
                { key: 'supabase',    icon: <Database className="w-4 h-4" />,      label: 'Sync' },
              ] as { key: string; icon: React.ReactNode; label: string; badge?: number }[]).map(({ key, icon, label, badge }) => (
                <div key={key} className={`mob-tab ${activeTab === key ? 'on' : ''}`} onClick={() => setActiveTab(key as any)}>
                  {icon}
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && <span className="mob-tab-badge">{badge}</span>}
                </div>
              ))}
            </div>
          </nav>

          {/* ── MAIN ── */}
          <div className="main">

            {/* ── WELCOME HEADER ── */}
            <div className="welcome-bar">
              <div>
                <div className="welcome-title">Welcome, back {adminFirstName} 👍</div>
                <div className="welcome-sub">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Chennai Atelier
                </div>
              </div>
              <div className="wb-right">
                <button className="wb-btn" onClick={() => navigateTo('home')}>
                  🛍️ Live Shop
                </button>
                <button className="wb-btn" onClick={async () => { 
                  setLoadingData(true); 
                  // Pull latest orders from Supabase (syncs live orders to localhost)
                  try { await adminFetch('/api/orders/sync-from-supabase'); } catch {}
                  refreshAllData(true).finally(() => setLoadingData(false)); 
                }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button className="wb-btn gold" onClick={handleTriggerAddProduct}>
                  <Plus className="w-3.5 h-3.5" /> Add product
                </button>
                <div className="av">{adminFirstName.charAt(0).toUpperCase()}</div>
              </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="content adm-scroll">

              {loadingData && (
                <div className="flex items-center justify-center py-16 text-xs text-neutral-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" /> Loading live data from Supabase…
                </div>
              )}

              {!loadingData && activeTab === 'dashboard' && (
                <>
                  <div className="stat-grid">
                    <div className="sc">
                      <div className="sc-top" style={{ background: '#2d8f5a' }}></div>
                      <DollarSign className="sc-ico w-[18px] h-[18px]" />
                      <div className="sc-lbl">Net Revenue</div>
                      <div className="sc-val" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>₹{calculatedRevenue.toLocaleString('en-IN')}</div>
                      <div className="sc-chg up"><Check className="w-2.5 h-2.5" /> Confirmed</div>
                    </div>
                    <div className="sc">
                      <div className="sc-top" style={{ background: '#378add' }}></div>
                      <Settings className="sc-ico w-[18px] h-[18px]" />
                      <div className="sc-lbl">Processing</div>
                      <div className="sc-val">{processingOrdersCount} <span>orders</span></div>
                      {processingOrdersCount > 0 ? <div className="sc-chg warn"><Sparkles className="w-2.5 h-2.5" /> Dispatch due</div> : <div className="sc-chg" style={{ color: '#737373' }}>All clear</div>}
                    </div>
                    <div className="sc">
                      <div className="sc-top" style={{ background: '#b8902a' }}></div>
                      <PenTool className="sc-ico w-[18px] h-[18px]" />
                      <div className="sc-lbl">New Orders</div>
                      <div className="sc-val">{pendingOrdersCount} <span>pending</span></div>
                      {pendingOrdersCount > 0 ? <div className="sc-chg warn"><Check className="w-2.5 h-2.5" /> Review needed</div> : <div className="sc-chg" style={{ color: '#737373' }}>Clean slate</div>}
                    </div>
                  </div>

                  <div className="mid">
                    <div className="panel flex flex-col min-h-[290px]">
                      <div className="ph">
                        <div className="ph-title">Recent orders</div>
                        <div className="pills">
                          {(['All', 'Pending', 'Dispatched', 'Cancelled'] as const).map(f => (
                            <div key={f} className={`pill ${orderFilter === f ? 'on' : ''}`} onClick={() => setOrderFilter(f)}>{f}</div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto adm-scroll">
                        {filteredOrders.slice(0, 10).map((o, idx) => (
                          <div key={idx} className="or" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div className="o-id">#ORD-{(o.id || '').substring(0, 4).toUpperCase()}</div>
                              <span className={`badge ${o.status === 'Pending' ? 'b-pend' : o.status === 'Confirmed' ? 'b-conf' : o.status === 'Dispatched' ? 'b-disp' : o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'b-delv'}`}>{o.status}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                              <div><strong>Name:</strong> {o.customer_name}</div>
                              <div><strong>Email:</strong> {o.customer_email}</div>
                              <div><strong>Phone:</strong> {o.phone || 'N/A'}</div>
                              <div><strong>Address:</strong> {o.address}</div>
                              <div><strong>Region:</strong> {o.delivery_region} | <strong>Delivery:</strong> ₹{o.delivery_charge}</div>
                              {o.items.length > 0 && (
                                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--color-border-tertiary)' }}>
                                  <strong style={{ color: 'var(--color-text-primary)' }}>Items:</strong>
                                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {o.items.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setSelectedProductDetail(item.product)}>
                                        <img src={item.product.images[0] || undefined} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', border: '0.5px solid var(--color-border-tertiary)' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        <span style={{ flex: 1 }}>{item.quantity}x {item.product.name} {item.selectedSize ? `(Size: ${item.selectedSize})` : ''}</span>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '9px' }}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div className="o-amt">₹{(o.total || 0).toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                        {filteredOrders.length === 0 && <div className="p-8 text-center text-xs text-neutral-400">No orders match filter.</div>}
                      </div>
                    </div>
                    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="ph">
                        <div className="ph-title">Top catalog items</div>
                        <div className="ph-act" onClick={handleTriggerAddProduct}><Plus className="w-3 h-3" /> Add</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', flex: 1, overflowY: 'auto' }} className="adm-scroll">
                        {products.slice(0, 4).map((p, idx) => (
                          <div className="pr" key={idx}>
                            <div className="p-img"><img src={p.images[0] || undefined} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} /></div>
                            <div className="p-info">
                              <div className="p-name">{p.name}</div>
                              <div className="p-cat">{p.category}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {(p as any).mrp && (p as any).mrp > p.price ? (
                                <div className="text-sm">
                                  <span className="text-[12px] text-neutral-400 line-through mr-2">₹{(p as any).mrp.toLocaleString('en-IN')}</span>
                                  <div className="p-price">₹{p.price.toLocaleString('en-IN')}</div>
                                </div>
                              ) : (
                                <div className="p-price">₹{p.price.toLocaleString('en-IN')}</div>
                              )}
                              {p.is_best_seller && <div className="p-tag t-best">Best seller</div>}
                              {p.is_new_arrival && !p.is_best_seller && <div className="p-tag t-new">New arrival</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bot">
                    <div className="panel flex flex-col pt-0">
                      <div className="ph border-b pb-3 pt-4 mb-2 flex items-center justify-between">
                        <div>
                          <div className="ph-title text-sm tracking-wide">Revenue & Orders Analytics</div>
                          <span className="text-[10px] text-neutral-400 capitalize">Trends over time</span>
                        </div>
                        <div className="flex bg-neutral-100 rounded p-0.5">
                          {['1D', '1W', '1M'].map(tf => (
                            <button
                              key={tf}
                              onClick={() => setChartTimeframe(tf as any)}
                              className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${chartTimeframe === tf ? 'bg-white shadow text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="chart-wrap flex-1 min-h-[180px] w-full">
                        <canvas id="rc" style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="panel">
                        <div className="ph">
                          <div className="ph-title">Supabase cloud sync</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#2d8f5a' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d8f5a', display: 'inline-block' }}></span>Live
                          </div>
                        </div>
                        <div className="sy-row"><div className="dot on"></div><div className="sy-nm">Products catalog</div><div className="sy-ct">{products.length} rows</div></div>
                        <div className="sy-row" style={{ border: 'none' }}><div className="dot on"></div><div className="sy-nm">Client invoices</div><div className="sy-ct">{orders.length} rows</div></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!loadingData && activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-neutral-800">Footwear Catalog List</h3>
                      <p className="text-xs text-neutral-400">Configure catalog items, prices in INR, categories, and visibility.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowCatModal(true)} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-sans text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded transition-all flex items-center gap-1.5 cursor-pointer shadow">
                        <Plus className="w-4 h-4" /> Manage Categories
                      </button>
                      <button onClick={handleTriggerAddProduct} className="bg-gold hover:bg-gold-dark text-white font-sans text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded transition-all flex items-center gap-1.5 cursor-pointer shadow">
                        <Plus className="w-4 h-4" /> Add Premium Pair
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <div key={p.id} className="flex gap-4 p-4 border rounded-xl bg-white hover:border-gold/45 transition-colors">
                        <img src={p.images[0] || undefined} alt="" className="w-16 h-20 object-cover rounded bg-neutral-50 border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">{p.category}</span>
                          <h4 className="font-serif text-sm font-bold text-neutral-800 truncate mt-1">{p.name}</h4>
                          <p className="text-xs font-bold text-leather mt-1">
                            {(p as any).mrp && (p as any).mrp > p.price ? (
                              <><span className="text-[12px] text-neutral-400 line-through mr-2">₹{(p as any).mrp.toLocaleString('en-IN')}</span>₹{p.price.toLocaleString('en-IN')}</>
                            ) : (
                              <>₹{p.price.toLocaleString('en-IN')}</>
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-1">Weight: {Number(p.weight_kg ?? 1).toFixed(1)} kg</p>
                          <div className="flex gap-1.5 mt-2">
                            {p.is_new_arrival && <span className="text-[8px] bg-neutral-100 text-neutral-600 px-1 py-0.5 rounded">NEW ARRIVAL</span>}
                            {p.is_best_seller && <span className="text-[8px] bg-leather text-gold-light px-1 py-0.5 rounded font-bold">BEST SELLER</span>}
                            {!p.is_published && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">DRAFT</span>}
                          </div>
                        </div>
                        <div className="flex flex-col justify-between items-end">
                          <button onClick={() => handleOpenEditProduct(p)} className="bg-neutral-50 hover:bg-neutral-100 border p-1.5 rounded cursor-pointer transition-colors">
                            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                          <button onClick={() => { setDeleteConfirmId(p.id); setDeleteConfirmType('product'); }} className="bg-red-50 hover:bg-red-100 border border-red-200 p-1.5 rounded cursor-pointer transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && <p className="text-xs text-neutral-400 text-center py-12 col-span-2">No products yet. Add your first pair!</p>}
                  </div>
                </div>
              )}

              {!loadingData && activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-neutral-800">Order Dispatch Center</h3>
                      <p className="text-xs text-neutral-400">Validate payments and step up delivery sequences.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Filter className="w-4 h-4 text-neutral-400" />
                      <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value as any)} className="border p-1.5 rounded bg-white text-neutral-700 focus:outline-none">
                        {['All', 'Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-12">No orders in this filter.</p>
                    ) : filteredOrders.map((ord) => (
                      <div key={ord.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-neutral-50 px-4 py-3 border-b flex justify-between items-center text-xs">
                          <div><span className="font-bold text-neutral-700">Order: {ord.id}</span><span className="mx-2 text-neutral-300">|</span><span className="text-neutral-500">{new Date(ord.created_at).toLocaleDateString()}</span></div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${ord.status === 'Pending' ? 'bg-amber-100 text-amber-700' : ord.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' : ord.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : ord.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{ord.status}</span>
                        </div>
                        <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                          <div className="space-y-1 text-xs">
                            <p><strong>Customer:</strong> {ord.customer_name} ({ord.customer_email})</p>
                            <p><strong>Phone:</strong> {ord.phone || 'N/A'}</p>
                            <p><strong>Address:</strong> {ord.address}</p>
                            <p><strong>Total:</strong> ₹{ord.total.toLocaleString('en-IN')}</p>
                            {ord.items.length > 0 && (
                              <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs">
                                <p className="font-bold text-neutral-700 mb-2 text-[10px] uppercase tracking-wider">Order Items</p>
                                {ord.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                    <img src={item.product.images[0] || undefined} alt="" className="w-8 h-8 rounded object-cover border border-neutral-200 flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-medium text-neutral-800 truncate">{item.product.name}</p>
                                      <p className="text-[9px] text-neutral-500">Qty: {item.quantity} {item.selectedSize ? `| Size: ${item.selectedSize}` : ''}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-700">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {ord.status === 'Cancelled' && (ord as any).rejection_comment && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                                <p className="font-bold text-red-700 uppercase tracking-wider text-[10px] flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Rejection Reason</p>
                                <p className="text-red-600 mt-1">{(ord as any).rejection_comment}</p>
                              </div>
                            )}

                            {ord.buyback_requested && ord.buyback_details && (
                              <div className="mt-3 p-3 bg-gold/5 border border-gold/20 rounded text-xs space-y-2">
                                <p className="font-bold text-gold-dark uppercase tracking-wider text-[10px]">♻️ BUY BACK OFFER REQUEST</p>
                                {ord.buyback_details.photo_url ? (
                                  <img src={ord.buyback_details.photo_url} alt="Buyback photo" className="mt-1 h-32 w-full object-cover rounded border border-amber-200" onError={(e) => (e.currentTarget.style.display='none')} />
                                ) : (
                                  <p className="text-neutral-400 text-[10px]">No photo uploaded</p>
                                )}
                              </div>
                            )}

                            {ord.birthday_benefit_requested && ord.birthday_benefit_details && (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-2">
                                <p className="font-bold text-amber-700 uppercase tracking-wider text-[10px]">🎂 BIRTHDAY BENEFIT REQUEST</p>
                                {ord.birthday_benefit_details.gov_id_photo_url ? (
                                  <img
                                    src={ord.birthday_benefit_details.gov_id_photo_url}
                                    alt="Birthday ID proof"
                                    className="mt-1 h-32 w-full object-cover rounded border border-amber-200"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; }}
                                  />
                                ) : null}
                                <p className="text-neutral-400 text-[10px]" style={{display: ord.birthday_benefit_details.gov_id_photo_url ? 'none' : 'block'}}>
                                  No photo uploaded
                                </p>
                              </div>
                            )}

                            {(ord as any).student_discount_requested && (ord as any).student_discount_details && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                                <p className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">🎓 STUDENT DISCOUNT REQUEST</p>
                                {(ord as any).student_discount_details.id_photo_url ? (
                                  <img
                                    src={(ord as any).student_discount_details.id_photo_url}
                                    alt="Student ID proof"
                                    className="mt-1 h-32 w-full object-cover rounded border border-blue-200"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; }}
                                  />
                                ) : null}
                                <p className="text-neutral-400 text-[10px]" style={{display: (ord as any).student_discount_details.id_photo_url ? 'none' : 'block'}}>
                                  No photo uploaded
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(['Pending', 'Confirmed', 'Dispatched', 'Delivered'] as const).map((step) => (
                              <button key={step} onClick={() => handleUpdateOrderStatus(ord.id, step)} className={`px-2 py-1.5 border text-[10px] uppercase font-bold rounded cursor-pointer transition-all ${ord.status === step ? 'bg-leather text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>{step}</button>
                            ))}
                            <button onClick={() => handleRejectOrderWithComment(ord)} className="px-2 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-[10px] uppercase font-bold rounded cursor-pointer transition-all">Cancel with Reason</button>
                            <button onClick={() => { setDeleteConfirmId(ord.id); setDeleteConfirmType('order'); }} className="px-2 py-1.5 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] uppercase font-bold rounded cursor-pointer transition-all flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                            {ord.phone && (
                              <a
                                href={`https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`*YY Leathers - Order Invoice*\nOrder ID: ${ord.id}\nStatus: ${ord.status}\nCustomer: ${ord.customer_name}\nTotal: ₹${ord.total}\n\nArtisan invoice details have been updated.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1.5 border border-green-400 bg-green-50 text-green-700 hover:bg-green-100 text-[10px] uppercase font-bold rounded cursor-pointer transition-all flex items-center gap-1.5"
                                title="Send WhatsApp invoice/update to customer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => {
                                const win = window.open("", "_blank");
                                if (win) {
                                  win.document.write(generateInvoiceHTML(ord));
                                  win.document.close();
                                }
                              }}
                              className="px-2 py-1.5 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] uppercase font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                              title="Preview and Print Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" /> Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingData && activeTab === 'new-orders' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-neutral-800">New Order Requests</h3>
                      <p className="text-xs text-neutral-400">Review incoming pending orders. Accept or decline them to move them to the Orders page.</p>
                    </div>
                    {/* ── TEST ORDER CREATOR ── */}
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                      <span className="font-bold text-amber-700 shrink-0">🧪 Test:</span>
                      <select
                        value={testOrderType}
                        onChange={e => setTestOrderType(e.target.value as any)}
                        className="border border-amber-300 rounded px-2 py-1 text-xs bg-white text-neutral-700 cursor-pointer"
                      >
                        <option value="normal">Normal Order</option>
                        <option value="birthday">🎂 Birthday Discount</option>
                        <option value="buyback">♻️ Buyback Request</option>
                        <option value="student">🎓 Student Discount</option>
                      </select>
                      <button
                        onClick={handleCreateTestOrder}
                        disabled={testOrderCreating}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-3 py-1 rounded cursor-pointer transition-colors whitespace-nowrap"
                      >
                        {testOrderCreating ? '⏳ Creating...' : '+ Create Test Order'}
                      </button>
                      {lastTestOrderId && (
                        <span className="text-green-600 font-semibold">✅ {lastTestOrderId}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'Ordered').length === 0 ? <p className="text-xs text-neutral-400 text-center py-12">No new orders right now.</p> : orders.filter(o => o.status === 'Ordered').map((ord) => (
                      <div key={ord.id} className="p-5 border rounded-xl space-y-4 bg-white shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-leather-dark">ID: {ord.id}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-700">{ord.status}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="mb-1"><strong>Customer:</strong> {ord.customer_name}</p>
                            <p className="mb-1"><strong>Email:</strong> {ord.customer_email}</p>
                            <p className="mb-1"><strong>Address:</strong> {ord.address}</p>
                            <p className="mb-1"><strong>Date:</strong> {new Date(ord.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="mb-1"><strong>Total:</strong> ₹{ord.total.toLocaleString('en-IN')}</p>
                            <div className="mt-2 text-neutral-500">
                              {ord.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-1 cursor-pointer hover:text-gold transition-colors" onClick={() => setSelectedProductDetail(item.product)}>
                                  <img src={item.product.images[0] || undefined} alt="" className="w-6 h-6 rounded object-cover border border-neutral-200 flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.quantity}x {item.product.name} {item.selectedSize ? `(Size: ${item.selectedSize})` : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {ord.buyback_requested && ord.buyback_details && (
                          <div className="mt-2 p-3 bg-gold/5 border border-gold/20 rounded text-xs space-y-2">
                            <p className="font-bold text-gold-dark uppercase tracking-wider text-[10px]">♻️ BUY BACK OFFER REQUEST</p>
                            {ord.buyback_details.photo_url ? (
                              <img src={ord.buyback_details.photo_url} alt="Buyback photo" className="mt-1 h-32 w-full object-cover rounded border border-amber-200" onError={(e) => (e.currentTarget.style.display='none')} />
                            ) : (
                              <p className="text-neutral-400 text-[10px]">No photo uploaded</p>
                            )}
                          </div>
                        )}

                        {ord.birthday_benefit_requested && ord.birthday_benefit_details && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-2">
                            <p className="font-bold text-amber-700 uppercase tracking-wider text-[10px]">🎂 BIRTHDAY BENEFIT REQUEST</p>
                            {ord.birthday_benefit_details.gov_id_photo_url ? (
                              <img
                                src={ord.birthday_benefit_details.gov_id_photo_url}
                                alt="Birthday ID proof"
                                className="mt-1 h-32 w-full object-cover rounded border border-amber-200"
                                onError={(e) => (e.currentTarget.style.display='none')}
                              />
                            ) : (
                              <p className="text-neutral-400 text-[10px]">No photo uploaded</p>
                            )}
                          </div>
                        )}

                        {(ord as any).student_discount_requested && (ord as any).student_discount_details && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                            <p className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">🎓 STUDENT DISCOUNT REQUEST</p>
                            {(ord as any).student_discount_details.id_photo_url ? (
                              <img
                                src={(ord as any).student_discount_details.id_photo_url}
                                alt="Student ID proof"
                                className="mt-1 h-32 w-full object-cover rounded border border-blue-200"
                                onError={(e) => (e.currentTarget.style.display='none')}
                              />
                            ) : (
                              <p className="text-neutral-400 text-[10px]">No photo uploaded</p>
                            )}
                          </div>
                        )}

                        <div className="bg-neutral-50 p-4 rounded-lg flex flex-col md:flex-row gap-3 items-end text-xs mt-3">
                          <div className="flex gap-2 ml-auto w-full md:w-auto mt-2 md:mt-0">
                            <button onClick={() => handleUpdateOrderStatus(ord.id, 'Pending')} className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded text-[10px] uppercase cursor-pointer flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Accept Order</button>
                            <button onClick={() => handleRejectOrderWithComment(ord)} className="flex-1 md:flex-none justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded text-[10px] uppercase cursor-pointer flex items-center gap-2"><X className="w-3.5 h-3.5" /> Reject with Reason</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingData && activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b">
                    <h3 className="font-serif text-xl font-bold text-neutral-800">Store Reviews</h3>
                    <p className="text-xs text-neutral-400">Manage the customer testimonials shown in the storefront experience.</p>
                  </div>
                  <form onSubmit={handleAddReview} className="bg-neutral-50 p-5 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Reviewer Name</label>
                        <input type="text" required value={newReviewName} onChange={(e) => setNewReviewName(e.target.value)} placeholder="e.g. Aravindhan" className="w-full p-2 border rounded bg-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Rating</label>
                        <select value={newReviewRating} onChange={(e) => setNewReviewRating(Number(e.target.value))} className="w-full p-2 border rounded bg-white focus:outline-none text-neutral-800">
                          {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} Star{v > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Review</label>
                        <textarea required value={newReviewQuote} onChange={(e) => setNewReviewQuote(e.target.value)} placeholder="Paste the review text here..." className="w-full p-2 border rounded bg-white h-28 focus:outline-none" />
                      </div>
                      <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest py-2.5 rounded shadow cursor-pointer text-[10px]">
                        Add Review
                      </button>
                    </div>
                  </form>
                  <div className="space-y-3">
                    {reviewEntries.map((review, idx) => (
                      <div key={`${review.name}-${idx}`} className="bg-white border rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-neutral-800">{review.name}</div>
                            <div className="flex items-center gap-1 mt-1 text-gold">
                              {Array.from({ length: Number(review.rating || 5) }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleDeleteReview(idx)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">"{review.quote}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingData && activeTab === 'promos' && (
                <div className="space-y-10">

                  <div className="space-y-6 pt-2">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <Percent className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Festival / Sitewide Offer</h3>
                        <p className="text-xs text-neutral-400">Set a global discount percentage that applies to all purchases from the store.</p>
                      </div>
                    </div>
                    <form onSubmit={handleSaveSitewideDiscount} className="bg-neutral-50 p-5 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3">
                        {festivalFeedback && (
                          <div className={`p-3 rounded-lg text-center font-bold text-[10px] uppercase tracking-wider ${festivalFeedback.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            {festivalFeedback}
                          </div>
                        )}
                        <div>
                          <label className="block font-semibold mb-1 text-neutral-700">Festival Name</label>
                          <input type="text" value={festivalName} onChange={(e) => setFestivalName(e.target.value)} placeholder="e.g., Bakrid, New Year" className="w-full p-2 border rounded bg-white focus:outline-none focus:border-gold" />
                          <p className="text-[10px] text-neutral-400 mt-1">Enter the festival or campaign name</p>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-neutral-700">Discount Percentage (%)</label>
                          <div className="flex items-center gap-3">
                            <input type="range" min="0" max="50" value={tempSitewideDiscount} onChange={(e) => setTempSitewideDiscount(Number(e.target.value))} className="flex-1 accent-gold" />
                            <span className="font-bold text-lg text-gold min-w-[40px] text-right">{tempSitewideDiscount}%</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            {tempSitewideDiscount > 0 ? `🎉 All online purchases will get ${tempSitewideDiscount}% OFF automatically!` : 'No sitewide discount active'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-neutral-200">
                          <label className="block font-semibold mb-2 text-neutral-700">Combine with Other Offers?</label>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-neutral-600">Allow festival offer with buyback, student & birthday benefits?</span>
                            <div className="flex bg-neutral-100 rounded p-1">
                              <button type="button" onClick={() => setFestivalCombineWithOffers(true)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${festivalCombineWithOffers === true ? 'bg-green-600 text-white' : 'text-neutral-500 hover:text-neutral-800'}`}>YES</button>
                              <button type="button" onClick={() => setFestivalCombineWithOffers(false)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${festivalCombineWithOffers === false ? 'bg-red-500 text-white' : 'text-neutral-500 hover:text-neutral-800'}`}>NO</button>
                            </div>
                          </div>
                          <p className="text-[9px] text-neutral-500 mt-2">
                            {festivalCombineWithOffers ? '✅ Festival offer will stack with buyback, student, and birthday benefits.' : '⚠️ Only festival offer will apply. Other benefits (buyback, student, birthday) will be disabled.'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-neutral-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block font-semibold text-neutral-700">Festival Offer Status</label>
                              <p className="text-[10px] text-neutral-500 mt-1">Turn the festival offer ON or OFF</p>
                            </div>
                            <button type="button" onClick={toggleFestivalActive} className={`px-4 py-2 text-[10px] font-bold rounded transition-all cursor-pointer ${isFestivalActive ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-neutral-300 text-neutral-600 hover:bg-neutral-400'}`}>
                              {isFestivalActive ? '✅ ACTIVE' : '⏸️ INACTIVE'}
                            </button>
                          </div>
                          <p className="text-[9px] text-neutral-500 mt-2">
                            {isFestivalActive ? `🎉 Festival offer is LIVE - ${tempSitewideDiscount}% OFF is active` : '⚠️ Festival offer is OFF - No discount will be applied'}
                          </p>
                        </div>
                        <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest py-2.5 rounded shadow cursor-pointer text-[10px]">
                          Save Festival Settings
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-6">
                    <div className="pb-4 border-b">
                      <h3 className="font-serif text-xl font-bold text-neutral-800">Marketing Offers & Hero Banners</h3>
                      <p className="text-xs text-neutral-400">Broadcast seasonal campaigns across the shop portal.</p>
                    </div>
                    <form onSubmit={handleAddPromoOffer} className="bg-neutral-50 p-5 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-1 text-neutral-700">Promo Title</label>
                          <input type="text" required value={oTitle} onChange={(e) => setOTitle(e.target.value)} placeholder="e.g., Chennai Solstice Premium Line" className="w-full p-2 border rounded bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-neutral-700">Description</label>
                          <textarea value={oDesc} onChange={(e) => setODesc(e.target.value)} placeholder="Extra 15% on Goodyear Welted builds." className="w-full p-2 border rounded bg-white h-16 focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold mb-1 text-neutral-700">Discount %</label>
                            <input type="number" value={oDisc} onChange={(e) => setODisc(Number(e.target.value))} className="w-full p-2 border rounded bg-white focus:outline-none" />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-neutral-700">Expiry</label>
                            <input type="date" value={oUntil} onChange={(e) => setOUntil(e.target.value)} className="w-full p-2 border rounded bg-white focus:outline-none" />
                          </div>
                        </div>
                        <ImageUploader value={oImg} onChange={setOImg} folder="banners" label="Banner Image" />
                        <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest py-2.5 rounded shadow cursor-pointer text-[10px]">
                          Deploy Active Promo Banner
                        </button>
                      </div>
                    </form>
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400">Live Campaign Items</h4>
                      {offers.length === 0 ? <p className="text-xs text-neutral-400 italic text-center py-6">No marketing assets deployed.</p> : offers.map((off) => (
                        <div key={off.id} className="flex gap-4 p-4 border rounded-xl bg-white items-center">
                          <img src={off.banner_url || undefined} alt="" className="w-20 h-12 object-cover rounded bg-neutral-100 border flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          <div className="flex-1 min-w-0 text-xs">
                            <h5 className="font-bold text-neutral-800 truncate">{off.title} <span className="text-gold">(-{off.discount_percent}%)</span></h5>
                            <p className="text-neutral-400 truncate text-[11px] mt-0.5">{off.description}</p>
                            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid until: {off.valid_until}</p>
                          </div>
                          <button onClick={() => { setDeleteConfirmId(off.id); setDeleteConfirmType('offer'); }} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Top Slider Configuration</h3>
                        <p className="text-xs text-neutral-400">Add scrolling announcement messages to the top banner.</p>
                      </div>
                    </div>
                    <form onSubmit={handleAddTopSliderMsg} className="bg-neutral-50 p-5 rounded-xl border flex gap-4 text-xs items-end">
                      <div className="flex-1">
                        <label className="block font-semibold mb-1 text-neutral-700">New Announcement Text</label>
                        <input type="text" value={newTopSliderMsg} onChange={(e) => setNewTopSliderMsg(e.target.value)} placeholder="e.g. GET EXTRA 10% OFF ON PREPAID ORDERS" className="w-full p-2.5 border rounded bg-white focus:outline-none focus:border-leather" />
                      </div>
                      <button type="submit" disabled={!newTopSliderMsg.trim()} className={`font-bold uppercase tracking-widest px-6 py-2.5 rounded shadow cursor-pointer text-[10px] ${newTopSliderMsg.trim() ? 'bg-gold hover:bg-gold-dark text-white' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
                        Add Message
                      </button>
                    </form>
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400">Active Messages</h4>
                      {!topSliderMessages || topSliderMessages.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic text-center py-6">No messages configured.</p>
                      ) : (
                        topSliderMessages.map((msg, idx) => (
                          <div key={idx} className="flex gap-4 p-4 border rounded-xl bg-white items-center justify-between">
                            <p className="text-xs font-semibold text-neutral-800 font-sans tracking-widest">{msg}</p>
                            <button type="button" onClick={() => handleDeleteTopSliderMsg(idx)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Hero Slider Configuration</h3>
                        <p className="text-xs text-neutral-400">Add dynamic carousel slides linking directly to product categories.</p>
                      </div>
                    </div>
                    <form onSubmit={handleAddHeroSlide} className="bg-neutral-50 p-5 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-1 text-neutral-700">Target Category</label>
                          <select value={hsCategory} onChange={(e) => setHsCategory(e.target.value)} className="w-full p-2 border rounded bg-white focus:outline-none text-neutral-800">
                            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <ImageUploader value={hsImg} onChange={setHsImg} folder="hero" label="Slide Image" />
                        <button type="submit" disabled={!hsImg} className={`w-full font-bold uppercase tracking-widest py-2.5 rounded shadow cursor-pointer text-[10px] ${hsImg ? 'bg-gold hover:bg-gold-dark text-white' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
                          {hsImg ? 'Add Slide' : 'Upload Image First'}
                        </button>
                      </div>
                    </form>
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400">Published Slides (Drag to reorder)</h4>
                      {!heroSlides || heroSlides.length === 0 ? <p className="text-xs text-neutral-400 italic text-center py-6">No slides configured.</p> : heroSlides.map((slide, index) => (
                        <div
                          key={slide.id}
                          draggable
                          onDragStart={() => handleDragStart(slide.id)}
                          onDragOver={(e) => handleDragOver(e, slide.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, slide.id)}
                          onDragEnd={handleDragEnd}
                          className={`flex gap-4 p-4 border rounded-xl bg-white items-center cursor-move transition-all ${draggedSlideId === slide.id ? 'opacity-50 border-gold' : dragOverSlideId === slide.id ? 'border-gold bg-gold/5' : 'border-neutral-200 hover:border-gold/50'}`}
                        >
                          <div className="flex-shrink-0 text-neutral-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <img src={slide.image_url} alt="" className="w-24 h-16 object-cover rounded bg-neutral-100 border flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-xs">
                            <h5 className="font-bold text-neutral-800">Category: <span className="text-gold">{slide.category}</span></h5>
                            <p className="text-neutral-400 text-[10px] truncate max-w-[200px] mt-1">{slide.id}</p>
                            <p className="text-[9px] text-neutral-400 mt-0.5">Position: {index + 1}</p>
                          </div>
                          <button type="button" onClick={() => handleDeleteHeroSlide(slide.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Brand Legacy Static CMS</h3>
                        <p className="text-xs text-neutral-400">Edit company stories, mission headers, and storytelling parameters.</p>
                      </div>
                    </div>
                    <form onSubmit={handleUpdateStaticContent} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">About Section Title</label>
                        <input type="text" value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)} className="w-full p-2.5 border rounded bg-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Tagline</label>
                        <input type="text" value={blockTagline} onChange={(e) => setBlockTagline(e.target.value)} className="w-full p-2.5 border rounded bg-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Mission Statement</label>
                        <textarea value={blockMission} onChange={(e) => setBlockMission(e.target.value)} className="w-full p-2.5 border rounded bg-white h-24 focus:outline-none" />
                      </div>
                      <button type="submit" className="bg-leather text-white font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded shadow hover:bg-gold transition-colors cursor-pointer">
                        Commit Changes
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {!loadingData && activeTab === 'settings' && (
                <div className="space-y-10">
                  <div className="space-y-6">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <Lock className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Admin Security Settings</h3>
                        <p className="text-xs text-neutral-400">Change the admin panel password for accessing the atelier headquarters.</p>
                      </div>
                    </div>
                    <form onSubmit={handleChangePassword} className="bg-neutral-50 p-5 rounded-xl border space-y-4 text-xs max-w-md">
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Current Password</label>
                        <input type="text" disabled value={currentAdminPass} className="w-full p-2.5 border rounded bg-neutral-100 text-neutral-500 cursor-not-allowed" />
                        <p className="text-[9px] text-neutral-400 mt-1">This is the current active password</p>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">New Password</label>
                        <input type="text" required value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} placeholder="Enter new password (min 6 chars)" className="w-full p-2.5 border rounded bg-white focus:outline-none focus:border-gold" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Confirm New Password</label>
                        <input type="text" required value={confirmAdminPass} onChange={(e) => setConfirmAdminPass(e.target.value)} placeholder="Re-enter new password" className="w-full p-2.5 border rounded bg-white focus:outline-none focus:border-gold" />
                      </div>
                      {passChangeFeedback && (
                        <div className={`p-3 rounded text-xs font-bold ${passChangeFeedback.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {passChangeFeedback}
                        </div>
                      )}
                      <button type="submit" className="w-full bg-leather hover:bg-gold text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Change Admin Password
                      </button>
                    </form>
                  </div>
                  <div className="space-y-6 pt-8 border-t">
                    <div className="pb-4 border-b flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-gold flex-shrink-0" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-neutral-800">Maintenance Mode Settings</h3>
                        <p className="text-xs text-neutral-400">Put the website under maintenance mode to block customer checkout during inventory updates.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl border bg-white flex items-center justify-between text-xs max-w-md">
                      <div>
                        <p className="font-bold text-neutral-700">Maintenance Mode Status</p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {isMaintMode ? "🔴 Website is currently under maintenance. Customers cannot access." : "🟢 Website is online! Customers can access."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMaintMode(!isMaintMode)}
                        className={`px-4 py-2 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          isMaintMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isMaintMode ? "🔴 ON" : "🟢 OFF"}
                      </button>
                    </div>

                    <form onSubmit={handleSaveMaintenance} className="bg-neutral-50 p-5 rounded-xl border space-y-4 text-xs max-w-md">
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Maintenance Title</label>
                        <input
                          type="text"
                          required
                          value={maintTitleInput}
                          onChange={(e) => setMaintTitleInput(e.target.value)}
                          placeholder="We'll Be Back Soon"
                          className="w-full p-2.5 border rounded bg-white focus:outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-neutral-700">Maintenance Message</label>
                        <textarea
                          required
                          value={maintMsgInput}
                          onChange={(e) => setMaintMsgInput(e.target.value)}
                          placeholder="We're currently updating our store. Please check back shortly."
                          rows={3}
                          className="w-full p-2.5 border rounded bg-white focus:outline-none focus:border-gold resize-none"
                        />
                      </div>

                      {maintFeedback && (
                        <div className={`p-3 rounded text-[10px] font-bold uppercase tracking-wide text-center border ${
                          maintFeedback.startsWith('🟢') || maintFeedback.includes('online')
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : maintFeedback.startsWith('🔴') || maintFeedback.includes('maintenance')
                            ? 'bg-red-50 text-red-750 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {maintFeedback}
                        </div>
                      )}

                      <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Commit Maintenance State
                      </button>
                    </form>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-800 space-y-2">
                    <h4 className="font-bold text-amber-900 uppercase tracking-wider">Password Notes</h4>
                    <p>• The admin password change is stored in your browser's localStorage. For permanent changes, update the VITE_ADMIN_PASSWORD in your .env file.</p>
                    <p>• You can also configure this password via the environment variable <code className="bg-amber-100 px-1 rounded">VITE_ADMIN_PASSWORD</code> in your deployment settings.</p>
                  </div>
                </div>
              )}

              {activeTab === 'supabase' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b">
                    <h3 className="font-serif text-xl font-bold text-neutral-800">Supabase Cloud Sync Terminal</h3>
                    <p className="text-xs text-neutral-400">Live connection status and row counts per entity.</p>
                  </div>
                  {isSupabaseLoading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-xs text-neutral-400">
                      <Loader2 className="w-5 h-5 animate-spin text-gold" /> Pinging Supabase…
                    </div>
                  ) : (
                    <div className="space-y-6 text-xs">
                      <div className="p-5 border rounded-xl bg-neutral-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2"><strong>Connection:</strong>
                            {supabaseStatus?.connected
                              ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED</span>
                              : <span className="text-red-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> OFFLINE</span>}
                          </p>
                          {supabaseStatus?.latency_ms !== undefined && <p><strong>Latency:</strong> {supabaseStatus.latency_ms} ms</p>}
                        </div>
                        <div className="space-y-2">
                          <p className="truncate"><strong>Host:</strong> <span className="text-neutral-500">{SUPA_URL || '(not set)'}</span></p>
                          {supabaseStatus?.error && <p className="text-red-500 p-2 bg-red-50 border rounded">{supabaseStatus.error}</p>}
                        </div>
                      </div>
                      {supabaseStatus?.row_counts && (
                        <div className="panel">
                          <div className="ph"><div className="ph-title">Row counts per entity</div></div>
                          {Object.entries(supabaseStatus.row_counts).map(([key, count]) => (
                            <div key={key} className="sy-row">
                              <div className="dot on"></div>
                              <div className="sy-nm capitalize">{key.replace(/_/g, ' ')}</div>
                              <div className="sy-ct">{count} rows</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <button onClick={fetchSupabaseStatus} className="bg-neutral-200 text-neutral-700 font-bold text-[10px] tracking-widest uppercase py-3 px-5 rounded hover:bg-neutral-300 cursor-pointer flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" /> Refresh Diagnostics
                        </button>
                        <button onClick={() => { setLoadingData(true); refreshAllData().finally(() => setLoadingData(false)); }} className="bg-leather text-white font-bold text-[10px] tracking-widest uppercase py-3 px-5 rounded hover:bg-gold cursor-pointer flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" /> Reload All Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── REJECT MODAL ── */}
      <AnimatePresence>
        {rejectModalOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md border p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-800">Reject Order</h3>
                  <p className="text-xs text-neutral-500">Order ID: {rejectModalOrder.id}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-xs text-neutral-700">Reason for Rejection</label>
                <textarea required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why you are rejecting this order. This will be visible to the customer." rows={4} className="w-full p-3 border rounded-xl text-xs bg-neutral-50 focus:outline-none focus:border-red-400 resize-none" />
                <p className="text-[10px] text-neutral-400">This reason will be shown to the customer in their order details.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => { setRejectModalOrder(null); setRejectReason(''); }} className="p-3 border rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmitRejection} className="p-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                  <X className="w-3.5 h-3.5" /> Reject Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CATEGORY MODAL ── */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md border p-6 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b mb-4 flex-shrink-0">
                <h3 className="font-serif text-lg font-bold text-neutral-800">Manage Categories</h3>
                <button onClick={() => setShowCatModal(false)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                <p className="text-xs text-neutral-500 font-bold mb-2 uppercase tracking-tight">Categories</p>
                {customCategories.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No categories available.</p>
                ) : (
                  customCategories.map(cat => (
                    <div key={cat} className="flex justify-between items-center p-3 border rounded bg-neutral-50">
                      <span className="text-sm font-semibold">{cat}</span>
                      <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddCategorySubmit} className="space-y-4 pt-4 border-t flex-shrink-0">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 text-xs">Add New Category</label>
                  <input type="text" required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g., MOJARI" className="w-full p-3 border rounded bg-neutral-50 focus:outline-none focus:border-gold text-sm" />
                </div>
                <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded shadow transition-all cursor-pointer">
                  Add Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT MODAL ── */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center pb-4 border-b mb-4">
                <h3 className="font-serif text-lg font-bold text-neutral-800">
                  {editingProductId ? 'Edit Footwear Pair' : 'Add New Footwear Pair'}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Product Name</label>
                    <input type="text" required value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g., Chennai Legacy Oxfords" className="w-full p-2 border rounded bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Category</label>
                    <select value={pCat} onChange={(e) => setPCat(e.target.value)} className="w-full p-2 border rounded bg-white focus:outline-none text-neutral-800">
                      {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Price (INR)</label>
                    <input type="number" required value={pPrice} onChange={(e) => setPPrice(Number(e.target.value))} className="w-full p-2 border rounded bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">MRP (INR)</label>
                    <input type="number" value={pMRP ?? ''} onChange={(e) => setPMRP(e.target.value ? Number(e.target.value) : undefined)} placeholder="Optional MRP" className="w-full p-2 border rounded bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Weight (kg)</label>
                    <input type="number" min="0.1" step="0.1" value={pWeight} onChange={(e) => setPWeight(Number(e.target.value) || 1)} className="w-full p-2 border rounded bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Sizes, price, MRP, weight & stock</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['5','6','7','8','9','10','11','12'].map(sz => {
                        const selected = Object.prototype.hasOwnProperty.call(pSizePrices, sz) || Object.prototype.hasOwnProperty.call(pSizeMRPs, sz) || Object.prototype.hasOwnProperty.call(pSizeWeights, sz);
                        return (
                          <div key={sz} className="flex flex-col rounded-lg border border-neutral-200 p-2 space-y-2">
                            <button type="button" onClick={() => {
                              const hasSelection = Object.prototype.hasOwnProperty.call(pSizePrices, sz) || Object.prototype.hasOwnProperty.call(pSizeMRPs, sz) || Object.prototype.hasOwnProperty.call(pSizeWeights, sz);
                              if (hasSelection) {
                                setPSizePrices(prev => { const copy = { ...prev }; delete copy[sz]; return copy; });
                                setPSizeMRPs(prev => { const copy = { ...prev }; delete copy[sz]; return copy; });
                                setPSizeWeights(prev => { const copy = { ...prev }; delete copy[sz]; return copy; });
                                setPSizeQuantities(prev => { const copy = { ...prev }; delete copy[sz]; return copy; });
                              } else {
                                setPSizePrices(prev => ({ ...prev, [sz]: Number(pPrice) || 0 }));
                                setPSizeMRPs(prev => ({ ...prev, [sz]: Number(pMRP ?? pPrice) || 0 }));
                                setPSizeWeights(prev => ({ ...prev, [sz]: Number(pWeight) || 1 }));
                                setPSizeQuantities(prev => ({ ...prev, [sz]: 10 }));
                              }
                            }} className={`py-2 text-xs font-semibold rounded border font-sans cursor-pointer transition-all ${selected ? 'bg-leather text-white border-leather' : 'bg-white text-neutral-700 border-neutral-200 hover:border-gold'}`}>
                              {sz}
                            </button>
                            {selected && (
                              <div className="space-y-1.5">
                                <input type="number" value={pSizePrices[sz] ?? ''} onChange={(e) => setPSizePrices(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))} placeholder="Price" className="w-full p-1 text-xs border rounded" />
                                <input type="number" value={pSizeMRPs[sz] ?? ''} onChange={(e) => setPSizeMRPs(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))} placeholder="MRP" className="w-full p-1 text-xs border rounded" />
                                <input type="number" min="0.1" step="0.1" value={pSizeWeights[sz] ?? ''} onChange={(e) => setPSizeWeights(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))} placeholder="Weight (kg)" className="w-full p-1 text-xs border rounded" />
                                <input type="number" min="0" value={pSizeQuantities[sz] ?? ''} onChange={(e) => setPSizeQuantities(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))} placeholder="Stock Qty" className="w-full p-1 text-xs border rounded border-amber-300 bg-amber-50/30" title="Admin only: Stock quantity for this size" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2">Toggle a size to configure. Stock quantity is admin-only and hidden from customers. When stock reaches 0, the size will be automatically disabled in the store.</p>
                  </div>
                  <MultiImageUploader value={pImgs} onChange={setPImgs} folder="products" label="Product Images" />
                </div>
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-700">Description</label>
                    <textarea required value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Describe full-grain qualities, tannery origin, finish…" className="w-full p-2 border rounded bg-white h-28 focus:outline-none" />
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border space-y-2">
                    {[
                      { checked: pNew,  setter: setPNew,  label: 'Tag as New Arrival' },
                      { checked: pBest, setter: setPBest, label: 'Tag as Best Seller' },
                      { checked: pPub,  setter: setPPub,  label: 'Publish to online catalog' },
                    ].map(({ checked, setter, label }) => (
                      <label key={label} className="flex items-center gap-2 font-medium text-neutral-700 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} className="rounded accent-gold scale-110" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <button type="submit" disabled={savingProduct} className="w-full bg-gold hover:bg-gold-dark text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
                    {savingProduct ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : (editingProductId ? 'Save Changes' : 'Add to Catalog')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center text-xs">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-600"><ShieldAlert className="w-6 h-6" /></div>
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-neutral-800">Destructive Removal</h4>
                <p className="text-neutral-400">Permanently erase this item? This cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }} className="p-2 border rounded bg-neutral-50 hover:bg-neutral-100 font-bold uppercase tracking-wider text-[9px] text-neutral-600 cursor-pointer">Abort</button>
                <button onClick={handleConfirmDelete} className="p-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[9px] rounded cursor-pointer">Confirm Purge</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};