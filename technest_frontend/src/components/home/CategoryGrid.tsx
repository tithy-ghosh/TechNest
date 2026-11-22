"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { ArrowRight, LayoutGrid } from "lucide-react";
import CategorySmartPhone from '../../../public/Category-Phone.png'
import CategoryLaptop from '../../../public/Category-Laptop.png'
import CategoryTablet from '../../../public/Category-Tablet.png'
import CategoryHeadphone from '../../../public/Category-Headphone.png'
import CategorySmartwatch from '../../../public/Category-Smartwatch.png'
import CategoryAccessories from '../../../public/Category-Accessories.png'
import CategorySpeaker from '../../../public/Category-Speakers.png'
import CategoryGaming from '../../../public/Category-Gaming.png'

type Category = {
  name: string;
  slug: string;
  image: StaticImageData;
  color: string;
};

const categories: Category[] = [
  {
    name: "Smartphones",
    slug: "Smartphones",
    image: CategorySmartPhone,
    color: "#6f9400",
  },
  {
    name: "Laptops",
    slug: "Laptops",
    image: CategoryLaptop,
    color: "#6f9400",
  },
  {
    name: "Headphones",
    slug: "Headphones",
    image: CategoryHeadphone,
    color: "#6f9400",
  },
  {
    name: "Smartwatches",
    slug: "Wearables",
    image: CategorySmartwatch,
    color: "#6f9400",
  },
  {
    name: "Speakers",
    slug: "Speakers",
    image: CategorySpeaker,
    color: "#6f9400",
  },
  {
    name: "Accessories",
    slug: "Accessories",
    image: CategoryAccessories,
    color: "#6f9400",
  },
  {
    name: "Gaming",
    slug: "Gaming",
    image: CategoryGaming,
    color: "#6f9400",
  },
  {
    name: "Tablets",
    slug: "Tablets",
    image: CategoryTablet,
    color: "#6f9400",
  },
];

export default function CategoryGrid() {
  return (
    <section
      id="categories"
      className="relative overflow-hidden"
      style={{ background: "#f8f9f5" }}
    >
      {/* Decorative top-right green arc */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-[500px] h-[500px] opacity-[0.07]">
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="250" cy="250" r="200" stroke="#6f9400" strokeWidth="1" />
          <circle
            cx="250"
            cy="250"
            r="160"
            stroke="#6f9400"
            strokeWidth="0.5"
          />
          <circle
            cx="250"
            cy="250"
            r="120"
            stroke="#6f9400"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14">
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8f0dc] mb-5"
            >
              <LayoutGrid size={16} className="text-[#5a7a2a]" />
              <span className="text-[13px] font-semibold text-[#3d5a1e] tracking-wide">
                Shop by Category
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold tracking-tight text-[#15181d] leading-tight"
            >
              Shop by <span className="text-[#6f9400]">Category</span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-[14px] sm:text-[15px] text-[#7a7d70] mt-3 max-w-md"
            >
              Find the right tech for every part of your life.
            </motion.p>
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d9d7c8] bg-white text-[14px] font-semibold text-[#15181d] hover:bg-[#f4f2e9] transition-colors duration-200"
            >
              View All
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group"
            >
              <Link href={`/products?category=${cat.slug}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative bg-white rounded-2xl border border-[#e8e8e0] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                >
                  {/* Image Area */}
                  <div className="relative h-[200px] sm:h-[220px] flex items-center justify-center px-6 pt-6 overflow-hidden">
                    {/* Green blob background */}
                    <div
                      className="absolute w-[180px] h-[140px] rounded-[50%] opacity-[0.12] transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: `radial-gradient(ellipse, ${cat.color}, transparent 70%)`,
                        transform: "rotate(-15deg)",
                      }}
                    />
                    <div
                      className="absolute w-[160px] h-[120px] rounded-[50%] opacity-[0.08]"
                      style={{
                        background: `radial-gradient(ellipse, ${cat.color}, transparent 70%)`,
                        transform: "rotate(10deg) translateX(20px)",
                      }}
                    />

                    {/* Product Image */}
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={220}
                      height={180}
                      className="relative z-10 object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-sm"
                      priority={i < 4}
                    />
                  </div>

                  {/* Bottom Bar */}
                  <div className="flex items-center justify-between px-5 pb-5 pt-2">
                    <h3 className="text-[15px] font-bold text-[#15181d]">
                      {cat.name}
                    </h3>
                    <div className="w-8 h-8 rounded-full border border-[#e0e0d8] flex items-center justify-center transition-all duration-300 group-hover:bg-[#15181d] group-hover:border-[#15181d] group-hover:text-white">
                      <ArrowRight
                        size={14}
                        className="text-[#7a7d70] transition-colors duration-300 group-hover:text-white"
                      />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
