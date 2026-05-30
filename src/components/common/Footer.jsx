import React from 'react';
import { Clock, ExternalLink, Facebook, Instagram, Mail, MessageCircle, Music2, Phone } from 'lucide-react';

export default function Footer({ setActivePage, setSelectedProductType, setSelectedCategory }) {
  const bonnetsDisplayLabel = 'Bonnets And Fashion/Lace Bands';

  const handleCategoryClick = (category) => {
    setSelectedProductType?.(category);
    if (category === 'Wigs') {
      setSelectedCategory?.('All Wigs');
    }
    setActivePage?.('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryLinks = [
    { label: 'Wigs', value: 'Wigs' },
    { label: 'Products', value: 'All Products' },
    { label: bonnetsDisplayLabel, value: 'Bonnets' },
    { label: 'Hair Care', value: 'Hair Products' },
  ];

  const socialLinks = [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/jtsbeautyworld?utm_source=qr&igsh=MXgxOHV0cWZvdHE2Zg==',
      icon: Instagram,
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/share/177aaiVESS/',
      icon: Facebook,
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@jtsbeauty?_r=1&_t=ZP-96CYRj8ubNP',
      icon: Music2,
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/15612553698',
      icon: MessageCircle,
    },
  ];

  return (
    <footer
      id="contact"
      className="bg-[#d9006c] text-white px-5 sm:px-6 lg:px-10 py-12 sm:py-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
        <div className="lg:flex-1">
          <h3 className="text-2xl sm:text-3xl font-light uppercase tracking-wide leading-tight">
            JTS BEAUTY WORLD
          </h3>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/90 leading-7 sm:leading-relaxed max-w-md">
            Premium luxury wigs and beauty products crafted for confidence,
            elegance and beauty.
          </p>
        </div>

        <div className="flex flex-3 flex-row gap-4 sm:gap-8 lg:gap-10 lg:flex-[3]">
          <div className="min-w-0 flex-1">
            <h4 className="uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[11px] sm:text-sm text-[#d4c2aa] mb-4 sm:mb-5 font-bold">
              Categories
            </h4>

            <ul className="space-y-3.5 text-xs sm:text-base text-white">
              {categoryLinks.map((category) => (
                <li key={category.value}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category.value)}
                    className="hover:text-[#d4c2aa] transition-colors"
                  >
                    {category.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[11px] sm:text-sm text-[#d4c2aa] mb-4 sm:mb-5 font-bold">
              Contact
            </h4>

            <ul className="space-y-3.5 text-xs sm:text-base text-white break-words">
              <li className="flex items-start gap-2 sm:gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-[#d4c2aa]" />
                <a href="tel:5612553698" className="min-w-0 hover:text-[#d4c2aa] transition-colors">
                  561-255-3698
                </a>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-[#d4c2aa]" />
                <a href="mailto:jtsbeautyworldboutiquellc@gmail.com" className="min-w-0 break-all sm:break-words hover:text-[#d4c2aa] transition-colors">
                  jtsbeautyworldboutiquellc@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-[#d4c2aa]" />
                <span>Available 24/7 Online</span>
              </li>
            </ul>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[11px] sm:text-sm text-[#d4c2aa] mb-4 sm:mb-5 font-bold">
              Social Media
            </h4>

            <div className="flex flex-col gap-3.5 text-xs sm:text-base text-white">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 hover:text-[#d4c2aa] transition-colors"
                >
                  <Icon size={16} className="shrink-0 text-[#d4c2aa]" />
                  <span>{label}</span>
                  <ExternalLink size={12} className="shrink-0 opacity-70" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 mt-10 sm:mt-14 pt-5 sm:pt-6 text-center text-xs sm:text-sm text-white/80 leading-6">
        © 2026 JTS BEAUTY WORLD - Luxury Wig Boutique.
      </div>
    </footer>
  );
}


