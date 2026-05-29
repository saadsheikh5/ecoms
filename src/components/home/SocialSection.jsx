import React from 'react';

export default function SocialSection() {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-10 bg-[#D5E8D4]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
              Live Social Media
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 leading-tight">
              Stay Connected With JTS Beauty World
            </h2>

            <p className="mt-6 text-gray-600 leading-relaxed text-lg">
              Follow our latest wig drops, styling videos, transformations and
              customer reviews across all social media platforms.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="https://www.instagram.com/jtsbeautyworld?utm_source=qr&igsh=MXgxOHV0cWZvdHE2Zg=="
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#d9006c] text-white px-6 py-4 uppercase tracking-[0.2em] text-sm hover:bg-[#ec4899] transition-all duration-300"
              >
                Instagram
              </a>

              <a
                href="https://www.tiktok.com/@jtsbeauty?_r=1&_t=ZP-96CYRj8ubNP"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#d9006c] text-[#d9006c] px-6 py-4 uppercase tracking-[0.2em] text-sm hover:bg-[#d9006c] hover:text-white transition-all duration-300"
              >
                TikTok
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 w-full">
            <img
              src="images/burmese-curl-2.PNG"
              alt="Social"
              className="h-48 sm:h-72 w-full object-cover"
            />
            <img
              src="images/water-wave-2.PNG"
              alt="Social"
              className="h-48 sm:h-72 w-full object-cover"
            />
            <img
              src="images/body-wave-1.PNG"
              alt="Social"
              className="h-48 sm:h-72 w-full object-cover"
            />
            <img
              src="images/burmese-curl-3.PNG"
              alt="Social"
              className="h-48 sm:h-72 w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

