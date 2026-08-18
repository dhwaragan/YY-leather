/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Phone, MapPin, Mail, Instagram, Facebook, ArrowUp, Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="app-footer" className="relative bg-neutral-950 text-neutral-100 overflow-hidden border-t border-neutral-800">
      
      {/* Subtle Leather Texture Aesthetic Background */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#8B5A2B 1px, transparent 1px), radial-gradient(#8B5A2B 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px'
      }} />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Presentation */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-widest text-[#8B5A2B] text-white">
              YY <span className="text-[#8B5A2B]">LEATHERS</span>
            </h3>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-sans font-medium">Chennai Atelier</p>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed max-w-sm">
              Crafted in the spirit of royal heritage. Synthesis of 150-step double-welt European cordwaining with Chennai's legendary leather durability. Where leather meets legacy.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-[#8B5A2B] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-[#8B5A2B] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Sagas Links Navigation */}
          <div>
            <h4 className="font-serif text-[11px] uppercase tracking-[0.25em] text-[#8B5A2B] font-bold mb-6">EXPLORE BRAND</h4>
            <ul className="space-y-3 font-sans text-xs text-neutral-400">
              <li>
                <button onClick={() => navigateTo('shop')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Bespoke Shop & Catalog
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Hand-crafted New Arrivals
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Chennai Best Sellers
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('buyback')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left text-[#8B5A2B] font-medium">
                  Circular Buy-Back Offering
                </button>
              </li>
            </ul>
          </div>

          {/* Legal and Policies Navigation links */}
          <div>
            <button 
              onClick={() => navigateTo('why-choose-us')}
              className="font-serif text-[11px] uppercase tracking-[0.25em] text-[#8B5A2B] font-bold mb-6 hover:underline cursor-pointer block text-left w-full"
            >
              WHY CHOOSE US ?
            </button>
            <ul className="space-y-3 font-sans text-xs text-neutral-400">
              <li>
                <button onClick={() => navigateTo('policies')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Return & Exchange Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('policies')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Shipping & Insured Transit
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('policies')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left">
                  Buy-Back Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('location')} className="hover:text-[#8B5A2B] hover:underline transition-colors cursor-pointer text-left font-serif italic text-[#8B5A2B]">
                  Visit Surapet Workshop
                </button>
              </li>
            </ul>
          </div>

          {/* Atelier Contact Details */}
          <div className="space-y-4 font-sans text-xs text-neutral-400">
            <h4 className="font-serif text-[11px] uppercase tracking-[0.25em] text-[#8B5A2B] font-bold mb-6">CHENNAI WORKSHOP</h4>
            
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-[#8B5A2B] flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Landmark- Godson school, 56, Surapet Main Rd, Mukambika Nagar, Lakshmipuram, Kadirvedu, Chennai, Tamil Nadu 600099
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-[#8B5A2B] flex-shrink-0" />
              <a href="tel:+919344178585" className="hover:text-[#c5a059] transition-colors">93441 78585</a>
            </div>

            <div className="flex items-start space-x-3 bg-neutral-900 border border-[#8B5A2B]/20 p-2.5 rounded">
              <Calendar className="w-4 h-4 text-[#8B5A2B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Sunday to Saturday</p>
                <p className="text-[10px] text-neutral-400">10:30 AM - 09:30 PM (IST)</p>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="my-12 border-t border-neutral-800" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-neutral-500 text-[11px] font-sans">
          <p>© {new Date().getFullYear()} YY Leathers Chennai Ltd. All measurements registered with premium Indian Royal legacy.</p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <button 
              onClick={handleScrollTop}
              className="group flex items-center gap-2 hover:text-[#8B5A2B] transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
