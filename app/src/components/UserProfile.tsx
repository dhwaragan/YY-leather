import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Heart, 
  PercentCircle, 
  HelpCircle, 
  Settings, 
  LogOut, 
  Edit3, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  Compass,
  PenTool,
  RefreshCw,
  X,
  User,
  Clock,
  MessageSquare
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, orders, updateUserProfile, logout, navigateTo, refreshOrdersOnly } = useApp();
  
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'All orders' | 'Active' | 'Cancelled'>('All orders');
  
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders' || !orders || orders.length === 0) {
      refreshOrdersOnly?.(true);
    }
  }, [activeTab, refreshOrdersOnly]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    await updateUserProfile({
      name: profileName,
      phone: profilePhone,
      address: profileAddress
    });
    setIsUpdatingProfile(false);
    setActiveTab(null);
  };

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', desc: 'View past & current orders', icon: Package },
    { id: 'support', label: 'Support / Help', desc: 'FAQs, Contact Us, Chat Support', icon: HelpCircle },
    { id: 'logout', label: 'Logout', desc: 'Sign out securely', icon: LogOut, onClick: handleLogout },
  ];

  return (
    <motion.div
      key="user-profile"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pt-24 pb-28 px-4 sm:px-6 lg:px-8 font-sans max-w-2xl mx-auto min-h-screen no-scrollbar relative"
    >
      {/* Header section matching screenshot */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigateTo('home')} className="p-2 bg-white shadow-sm rounded-full border border-neutral-100 hover:bg-neutral-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-neutral-700" />
        </button>
        <h1 className="font-semibold text-lg text-neutral-800">Profile</h1>
        <button className="p-2 bg-white shadow-sm rounded-full border border-neutral-100 hover:bg-neutral-50 transition-colors relative">
          <Bell className="w-5 h-5 text-neutral-700" />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* User Card */}
      <div className="bg-white border text-center md:text-left border-neutral-100 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4 relative isolate">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover shadow-sm bg-neutral-100 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
             <User className="w-8 h-8 text-neutral-400" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-bold text-lg text-neutral-800">{user?.name}</h2>
          <p className="text-sm tracking-wide text-neutral-400 mt-0.5">Welcome to YY Leathers</p>
        </div>
        <button onClick={() => setActiveTab('edit-profile')} className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-2 text-[#8B5A2B] hover:bg-gold/10 rounded-full transition-colors flex-shrink-0">
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* Group 1 */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-2 shadow-sm mb-6 flex flex-col">
        {tabs.slice(0, 2).map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => tab.onClick ? tab.onClick() : setActiveTab(tab.id === activeTab ? null : tab.id)} className={`flex items-center gap-4 p-3 hover:bg-neutral-50 transition-colors rounded-xl text-left w-full ${idx !== 1 ? 'border-b border-neutral-50' : ''}`}>
               <div className="w-10 h-10 rounded-full bg-neutral-50/50 flex items-center justify-center border border-neutral-100">
                  <Icon className="w-5 h-5 text-neutral-700" />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-semibold text-sm text-neutral-800 tracking-wide">{tab.label}</h3>
                 <p className="text-[11px] text-neutral-400 truncate mt-0.5">{tab.desc}</p>
               </div>
               <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Group 2 */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-2 shadow-sm mb-6 flex flex-col">
        {tabs.slice(2).map((tab, idx) => {
          const Icon = tab.icon;
          return (
             <button key={tab.id} onClick={() => tab.onClick ? tab.onClick() : setActiveTab(tab.id === activeTab ? null : tab.id)} className={`flex items-center gap-4 p-3 hover:bg-neutral-50 transition-colors rounded-xl text-left w-full ${idx !== 2 ? 'border-b border-neutral-50' : ''}`}>
               <div className="w-10 h-10 rounded-full bg-neutral-50/50 flex items-center justify-center border border-neutral-100">
                  <Icon className="w-5 h-5 text-neutral-700" />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-semibold text-sm text-neutral-800 tracking-wide">{tab.label}</h3>
                 <p className="text-[11px] text-neutral-400 truncate mt-0.5">{tab.desc}</p>
               </div>
               <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Modal for viewing tabs content */}
      <AnimatePresence>
        {activeTab && (
          <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-neutral-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-5 bg-white border-b sticky top-0 z-10 shrink-0">
                <h3 className="font-bold text-lg text-neutral-850">
                  {activeTab === 'edit-profile' ? 'Edit Profile' : tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <button onClick={() => setActiveTab(null)} className="p-1.5 hover:bg-neutral-100 rounded-full cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto w-full no-scrollbar flex-1 bg-white">
                
                {activeTab === 'edit-profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1 text-sm">
                      <label className="font-semibold text-neutral-600">Full Name</label>
                      <input
                        type="text" required value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#8B5A2B] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-sm">
                      <label className="font-semibold text-neutral-600">Mobile Number</label>
                      <input
                        type="tel" value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#8B5A2B] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-sm">
                      <label className="font-semibold text-neutral-600">Default Delivery Address</label>
                      <textarea
                        rows={3} value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full p-3 border border-neutral-200 rounded-xl focus:border-[#8B5A2B] outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit" disabled={isUpdatingProfile}
                      className="w-full bg-[#8B5A2B] hover:bg-[#734a23] text-white font-medium py-3.5 rounded-xl transition-colors cursor-pointer shadow-md mt-4"
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Save Details'}
                    </button>
                  </form>
                )}

                {activeTab === 'orders' && (
                   <div className="space-y-4">
                     {/* Filter Chips inside a pill container */}
                     <div className="flex bg-neutral-100 p-1 rounded-full mb-4 shadow-inner overflow-x-auto no-scrollbar">
                        {['All orders', 'Active', 'Cancelled'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setOrderFilter(f as any)}
                            className={`flex-1 min-w-[90px] text-[11px] md:text-xs font-bold py-2 px-3 rounded-full whitespace-nowrap transition-all cursor-pointer ${orderFilter === f ? 'bg-leather text-white shadow' : 'text-neutral-400 hover:text-neutral-600'}`}
                          >
                            {f}
                          </button>
                        ))}
                     </div>

                      {(() => {
                        const userOrders = orders.filter(o => 
                          (user?.id && o.user_id === user.id) ||
                          (user?.email && o.customer_email && o.customer_email.toLowerCase() === user.email.toLowerCase())
                        );
                        let filteredOrders = userOrders;
                        if (orderFilter === 'Active') {
                          filteredOrders = userOrders.filter(o => {
                            const s = (o.status || '').toLowerCase();
                            return ['ordered', 'pending', 'confirmed', 'dispatched'].includes(s);
                          });
                        } else if (orderFilter === 'Cancelled') {
                          filteredOrders = userOrders.filter(o => (o.status || '').toLowerCase() === 'cancelled');
                        }

                        if (filteredOrders.length === 0) {
                          return (
                            <p className="bg-neutral-50 border border-neutral-100 p-6 rounded-3xl text-xs text-neutral-450 text-center font-bold">No {orderFilter.toLowerCase()} found.</p>
                          );
                        }

                        return filteredOrders.map((ord) => (
                          <div key={ord.id} className="bg-white border border-neutral-100 rounded-[24px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-sm p-4 font-sans flex flex-col gap-4 relative overflow-hidden">
                            {/* Items details */}
                            <div className="flex gap-4">
                                <div className="w-[72px] h-[72px] rounded-2xl bg-neutral-50 flex-shrink-0 overflow-hidden relative shadow-sm">
                                  {(() => {
                                    const firstItem = ord.items?.[0]?.product;
                                    const imgSrc = firstItem?.images?.[0] || '';
                                    return imgSrc ? (
                                      <img src={imgSrc} alt="product" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-neutral-800 text-sm truncate">{ord.items[0]?.product.name || 'Custom Order'}</h4>
                                    <span className="text-neutral-500 font-medium text-[11px] shrink-0">#{ord.id.substring(0, 6)}</span>
                                  </div>
                                                          <div className="text-neutral-500 text-[11px] font-medium flex items-center gap-1.5 mt-1">
                                    <span>Rs. {ord.total.toLocaleString('en-IN')}</span>
                                    <span className="text-neutral-300">|</span>
                                    <span>{ord.items.length} {ord.items.length === 1 ? 'Item' : 'Items'}</span>
                                  </div>
                                  {ord.phone && (
                                    <div className="text-neutral-500 text-[10px] font-medium flex items-center gap-1 mt-1">
                                      <span>📞 {ord.phone}</span>
                                    </div>
                                  )}
                                </div>
                            </div>
                            
                            {/* Status row bg */}
                            <div className="flex justify-between items-center text-xs p-3 bg-neutral-50/80 rounded-2xl">
                                <div className="flex flex-col">
                                  <span className="text-neutral-400 text-[9px] uppercase tracking-wide font-medium mb-1">Estimated Arrival</span>
                                  <span className="font-bold text-neutral-800 text-xs">{ord.status === 'Cancelled' ? '-' : (ord.status === 'Delivered' ? 'Delivered' : '3-5 Days')}</span>
                                </div>
                                 <div className="flex flex-col text-right">
                                   <span className="text-neutral-400 text-[9px] uppercase tracking-wide font-medium mb-1">Status</span>
                                   <span className={`font-bold text-xs ${ord.status === 'Cancelled' ? 'text-red-600' : ord.status === 'Ordered' ? 'text-indigo-500' : ord.status === 'Pending' ? 'text-amber-500' : ord.status === 'Confirmed' ? 'text-blue-600' : ord.status === 'Dispatched' ? 'text-purple-600' : 'text-green-600'}`}>
                                     {ord.status === 'Ordered' ? 'Ordered' : ord.status === 'Pending' ? 'Pending' : ord.status === 'Confirmed' ? 'Processing' : ord.status === 'Dispatched' ? 'Shipped' : ord.status}
                                   </span>
                                 </div>
                            </div>

                            {/* Show rejection reason if order was cancelled */}
                            {ord.status === 'Cancelled' && (ord as any).rejection_comment && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="font-bold text-red-700 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
                                  <MessageSquare className="w-3 h-3" /> Cancellation Reason
                                </p>
                                <p className="text-red-600 text-xs leading-relaxed">{(ord as any).rejection_comment}</p>
                              </div>
                            )}

                            {/* Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                              <a
                                href={`https://wa.me/919344178585?text=${encodeURIComponent(`*YY Leathers - Order Inquiry*\n\nOrder ID: ${ord.id}\nStatus: ${ord.status}\nCustomer: ${ord.customer_name}\nTotal: ₹${ord.total}\n\nI have a question about my order.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-3.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </a>
                              <button 
                                onClick={() => {
                                  const win = window.open("", "_blank");
                                  if (win) {
                                    win.document.write(generateInvoiceHTML(ord));
                                    win.document.close();
                                  }
                                }} 
                                className="py-3.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 font-bold text-xs cursor-pointer hover:bg-neutral-100 transition-colors shadow-sm"
                              >
                                Invoice
                              </button>
                              <button className="py-3.5 rounded-full bg-leather hover:bg-gold text-white font-bold text-xs cursor-pointer transition-colors shadow-md">
                                Track Order
                              </button>
                            </div>
                          </div>
                        ));
                      })()}
                   </div>
                )}

                {activeTab === 'support' && (
                  <div className="flex flex-col items-center justify-center py-8 text-center font-sans space-y-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                       <MessageSquare className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-lg">YY Leathers Customer Support</h4>
                    <p className="text-xs text-neutral-500 max-w-sm">Have queries regarding size fits, dispatch delays, or refunds? Connect directly with our artisan workshop helpdesk on WhatsApp.</p>
                    <a 
                      href="https://wa.me/919344178585?text=Hello%20YY%20Leathers%2C%20I%20need%20help%20with%20my%20order." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" /> Message Workshop (+91 93441 78585)
                    </a>
                  </div>
                )}

                {['payment', 'wishlist', 'coupons'].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100 mb-4">
                       <Clock className="w-8 h-8 text-neutral-300" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-lg mb-1">Coming Soon</h4>
                    <p className="text-xs text-neutral-500 max-w-xs">{tabs.find(t=>t.id===activeTab)?.label} functionality will be available in the next app update.</p>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
