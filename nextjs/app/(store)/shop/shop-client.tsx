"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/types";
import { productsAPI } from "@/lib/api";
import { ProductCard } from "@/components/shop/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ShopClientProps {
  initialProducts: Product[];
}

type SortOption = "default" | "name_asc" | "name_desc" | "price_asc" | "price_desc";

export function ShopClient({ initialProducts }: ShopClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(!initialProducts.length);
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialProducts.length) return;
    setLoading(true);
    productsAPI.getAll().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, [initialProducts.length]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price_asc":
        result.sort((a, b) => a.price_small - b.price_small);
        break;
      case "price_desc":
        result.sort((a, b) => b.price_small - a.price_small);
        break;
    }

    return result;
  }, [products, search, sort]);

  const resetFilters = () => {
    setSearch("");
    setSizeFilter("all");
    setSort("default");
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:items-start">
      {/* Filters Sidebar */}
      <aside
        className={cn(
          "bg-white rounded-2xl p-6 lg:sticky lg:top-24 self-start border border-[#e1e5f5] shadow-[0_2px_16px_rgba(0,0,0,0.06)]",
          "fixed inset-0 z-50 overflow-y-auto",
          "lg:relative lg:inset-auto lg:z-auto lg:overflow-visible",
          !filtersOpen && "hidden lg:block"
        )}
      >
        {/* Mobile Close */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h3 className="font-bold text-[#1a1f3a]">Filters</h3>
          <button onClick={() => setFiltersOpen(false)} className="text-[#9fa8c7]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-[1rem] text-[#1a1f3a]">
            <i className="fas fa-filter mr-2 text-[#4A90E2]"></i>
            Filter & Sort
          </h3>
          <button
            onClick={resetFilters}
            className="text-[#4A90E2] text-[0.85rem] font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-[0.85rem] font-bold uppercase tracking-wider text-[#9fa8c7] mb-3">
            Search Design
          </label>
          <div className="search-input-wrap relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9fa8c7]"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code…"
              className="w-full pl-9 pr-4 py-3 border-2 border-[#e1e5f5] rounded-xl text-[0.875rem] transition-all focus:border-[#4A90E2] focus:ring-2 focus:ring-[rgba(74,144,226,0.15)] outline-none bg-white"
            />
          </div>
        </div>

        {/* Size Filter */}
        <div className="mb-6">
          <label className="block text-[0.85rem] font-bold uppercase tracking-wider text-[#9fa8c7] mb-3">
            Size
          </label>
          <div className="filter-options flex flex-col gap-2">
            {[
              { value: "all", label: "All Sizes" },
              { value: "small", label: 'Small (18"–20") — ৳990' },
              { value: "medium", label: 'Medium (20"–24") — ৳1,190' },
              { value: "large", label: 'Large (24"–28") — ৳1,490' },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-2 text-[0.9rem] cursor-pointer px-2 py-2 rounded-lg transition-all",
                  sizeFilter === option.value 
                    ? "bg-[#f0f4ff] font-medium" 
                    : "hover:bg-[#f8f9ff]"
                )}
              >
                <input
                  type="radio"
                  name="sizeFilter"
                  value={option.value}
                  checked={sizeFilter === option.value}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="accent-[#4A90E2]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="block text-[0.85rem] font-bold uppercase tracking-wider text-[#9fa8c7] mb-3">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="w-full px-4 py-3 border-2 border-[#e1e5f5] rounded-xl text-[0.875rem] transition-all focus:border-[#4A90E2] outline-none bg-white text-[#1a1f3a]"
          >
            <option value="default">Default</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Promo Box */}
        <div className="filter-promo-box bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] rounded-xl p-5 text-center border border-[rgba(74,144,226,0.2)]">
          <div className="promo-icon text-[2rem] mb-2">🎁</div>
          <strong className="block text-[0.9rem] text-[#4A90E2] mb-1.5 font-bold">Buy 4+ — Save 15%!</strong>
          <p className="text-[0.8rem] text-[#9fa8c7]">
            Add 4 or more items to your cart and the discount applies automatically.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div>
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[0.9rem] text-[#9fa8c7] font-medium">
            {loading
              ? "Loading…"
              : `${filtered.length} design${filtered.length !== 1 ? "s" : ""} found`}
          </span>
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white px-4 py-2.5 rounded-full text-[0.85rem] font-semibold shadow-[0_4px_20px_rgba(74,144,226,0.4)]"
          >
            <i className="fas fa-sliders-h"></i>
            Filters
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[#9fa8c7] mb-6">No designs found. Try a different search.</p>
            <button
              onClick={resetFilters}
              className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white px-6 py-3 rounded-full font-semibold text-[0.875rem] shadow-[0_4px_20px_rgba(74,144,226,0.4)] hover:shadow-[0_8px_28px_rgba(74,144,226,0.5)] transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
