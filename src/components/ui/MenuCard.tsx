"use client";

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface MenuCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  isVegetarian?: boolean;
  isNew?: boolean;
  image: string;
  onAdd: (item: any) => void;
}

export default function MenuCard({
  id,
  name,
  description,
  price,
  calories,
  isVegetarian,
  isNew,
  image,
  onAdd
}: MenuCardProps) {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-100">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        {isNew && (
          <div className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
            new
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">
            {name}
          </h3>
          {calories && (
            <p className="text-sm text-gray-600">
              {calories} kcal
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 whitespace-normal break-words">
          {description}
        </p>

        {/* Price and Dietary Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-100 text-gray-900 font-bold px-3 py-1 rounded-full text-sm">
              £{price.toFixed(2)}
            </span>
            {isVegetarian && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">V</span>
                </div>
                <span className="text-green-600 text-xs font-medium">Vegetarian</span>
              </div>
            )}
          </div>
        </div>

        {/* Add Button */}
        <motion.button
          onClick={() => onAdd({ id, name, price, description })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </motion.button>
      </div>
    </article>
  );
}
