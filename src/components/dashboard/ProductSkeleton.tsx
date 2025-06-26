// src/components/dashboard/ProductSkeleton.tsx
import React from 'react';

interface ProductSkeletonProps {
  count: number;
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count }) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4 py-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-grow">
            <div className="w-32 h-4 bg-gray-300 rounded"></div>
            <div className="w-24 h-4 bg-gray-300 rounded mt-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
