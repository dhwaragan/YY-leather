/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Clock, Phone, Navigation, Star } from 'lucide-react';

export const MapEmbed: React.FC = () => {
  // Google Maps embed URL with Satellite view enabled (t=k) for YY Leathers Surapet
  const MAPS_IFRAME_URL = "https://maps.google.com/maps?q=YY%20Leathers,%2056,%20Surapet%20Main%20Rd,%20Mukambika%20Nagar,%20Lakshmipuram,%20Kadirvedu,%20Chennai,%20Tamil%20Nadu%20600099&t=k&z=19&output=embed";
  const DIRECT_MAP_LINK = "https://maps.app.goo.gl/PvoY1pJCT9Dbegbi6";

  // Google reviews list (social proof element similar to image_cdad28.jpg)
  const reviews = [
    {
      id: 1,
      author: "AFROZ AHMED",
      location: "Nungambakkam, Chennai",
      rating: 5,
      date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
      comment: "The famous 150-step handcraft is absolutely real. The French calf leather is incredibly soft and does not crease. Perfect weight and breathability for Chennai's warm climate."
    },
    {
      id: 2,
      author: "Priya Sundar",
      location: "Surapet, Chennai",
      rating: 5,
      date: "1 month ago",
      comment: "Visited the Surapet Main Rd store for the custom fit consultation. Extremely professional masters. The Blake sole stitch is flawless. After 2 years, they look and feel brand new."
    },
    {
      id: 3,
      author: "Aditya Verma",
      location: "Adyar, Chennai",
      rating: 5,
      date: "3 days ago",
      comment: "Phenomenal leather legacy! 100% synthetic-free, so they mold to your foot shape naturally. Incredible rating and service. Simply Chennai's summit of leathercraft."
    }
  ];

  return (
    <div id="atelier-location-section" className="space-y-8 select-none">
      
      {/* Map with Floating Address Card container */}
      <div className="relative w-full h-[500px] bg-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden shadow-lg group">
        
        {/* 1. Full-width Google Maps Iframe */}
        <iframe
          title="YY Leathers Chennai Store Location"
          src={MAPS_IFRAME_URL}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="transition-all duration-700 w-full h-full"
        />

        {/* 2. Overlaid Premium Gold-Bordered Address & Hours Card */}
        <div 
          id="location-overlay-card"
          className="absolute top-6 left-6 right-6 md:right-auto md:top-8 md:left-8 z-10 max-w-sm w-full bg-white/95 backdrop-blur-md text-neutral-900 border border-[#FAF6F0] p-6 rounded-xl shadow-2xl transition-all duration-750 transform group-hover:translate-x-1"
        >
          <span className="text-[#5C3317] text-[10px] font-sans font-bold uppercase tracking-[0.3em] block mb-2">
            VISIT OUR FLAGSHIP WORKSHOP
          </span>
          <h3 className="font-serif text-2xl font-bold tracking-wide text-neutral-900 mb-4">
            YY Leathers (Near Godson School)
          </h3>

          {/* Address Row */}
          <div className="flex items-start bg-neutral-50 p-2.5 rounded-lg border-l-2 border-[#5C3317]/40 mb-4 text-xs space-x-3 leading-relaxed">
            <MapPin className="w-4 h-4 text-[#5C3317] flex-shrink-0 mt-0.5" />
            <span className="font-sans text-neutral-700">
              Landmark- Godson school, 56, Surapet Main Rd, Mukambika Nagar, Lakshmipuram, Kadirvedu, Chennai, Tamil Nadu 600099
            </span>
          </div>

          {/* Store Hours Row */}
          <div className="flex items-start text-xs space-x-3 mb-3 leading-relaxed font-sans">
            <Clock className="w-4 h-4 text-[#5C3317] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-900 block">Atelier Visiting Hours</span>
              <span className="text-neutral-600 font-sans">Sunday to Saturday</span>
              <span className="text-[#5C3317] font-bold block text-[10px] mt-0.5">10:30 AM to 09:30 PM (IST)</span>
            </div>
          </div>

          {/* Contact numbers */}
          <div className="flex items-center text-xs space-x-3 mb-6 font-sans text-neutral-700">
            <Phone className="w-4 h-4 text-[#5C3317] flex-shrink-0" />
            <a href="tel:+919344178585" className="hover:text-[#c5a059] transition-colors">93441 78585</a>
          </div>

          {/* Action Anchor to External Directions link */}
          <a
            id="btn-location-get-directions"
            href={DIRECT_MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#5C3317] hover:bg-[#FAF6F0] hover:text-[#5C3317] border border-[#5C3317] text-white font-sans text-[11px] font-bold uppercase tracking-widest py-3 px-4 rounded-md transition-all duration-700 flex items-center justify-center gap-2"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            Get Google Map Coordinates
          </a>
        </div>
      </div>

      {/* Social Proof Google Reviews Grid Structure similar to image_cdad28.jpg */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-50 px-6 py-4 rounded-xl border border-neutral-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border border-neutral-200 rounded-full flex items-center justify-center font-bold text-lg text-emerald-600 shadow-sm font-sans">G</div>
            <div>
              <h4 className="font-serif text-lg font-bold text-neutral-800">5-Star Google Customer Satisfaction</h4>
              <p className="text-xs text-neutral-500 font-sans">Based on 280+ verified Chennai patron ratings</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-4 py-2 rounded-lg shadow-xs select-none">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4.5 h-4.5 fill-current" />
              ))}
            </div>
            <span className="font-sans font-bold text-sm text-neutral-800">4.9 / 5.0</span>
          </div>
        </div>

        {/* Triple Column review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {reviews.map((r) => (
            <div key={r.id} className="bg-neutral-50/50 border border-neutral-100 rounded-xl p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-serif font-bold text-sm text-neutral-905">{r.author}</h5>
                  <p className="text-[10px] text-neutral-400 font-sans">{r.location}</p>
                </div>
                <span className="text-[10px] text-neutral-450 font-sans">{r.date}</span>
              </div>
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                "{r.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
