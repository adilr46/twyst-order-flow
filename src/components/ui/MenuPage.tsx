"use client";

import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import MenuCard from './MenuCard';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  isVegetarian?: boolean;
  isNew?: boolean;
  image: string;
  category: string;
}

interface MenuPageProps {
  venueName: string;
  location: string;
  categories: string[];
  activeCategory: string;
  items: MenuItem[];
  onCategoryChange: (category: string) => void;
  onAddItem: (item: MenuItem) => void;
  onSearch: (query: string) => void;
  onFilters: () => void;
}

export default function MenuPage({
  venueName,
  location,
  categories,
  activeCategory,
  items,
  onCategoryChange,
  onAddItem,
  onSearch,
  onFilters
}: MenuPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e3a8a] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{venueName}</h1>
                <p className="text-sm text-gray-600">{location}</p>
              </div>
            </div>
            <button className="w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 flex flex-col justify-center gap-1">
                <div className="w-full h-0.5 bg-[#1e3a8a]"></div>
                <div className="w-full h-0.5 bg-[#1e3a8a]"></div>
                <div className="w-full h-0.5 bg-[#1e3a8a]"></div>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Category Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => onCategoryChange(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === category
                    ? 'bg-[#1e3a8a] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </motion.button>
            ))}
            <motion.button
              onClick={onFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Category Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'cursive' }}>
            {activeCategory}
          </h2>
          {activeCategory === 'Desserts' && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200 via-red-200 to-pink-200 rounded-lg opacity-50"></div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-teal-500 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Menu Items Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MenuCard
                {...item}
                onAdd={onAddItem}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
