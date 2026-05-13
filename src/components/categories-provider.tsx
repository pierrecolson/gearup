"use client";

import { createContext, useContext } from "react";
import { findCategory, type CategoryDef } from "@/lib/categories";

const CategoriesContext = createContext<CategoryDef[]>([]);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: CategoryDef[];
  children: React.ReactNode;
}) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoryDef[] {
  return useContext(CategoriesContext);
}

export function useCategoryDef(id: string): CategoryDef {
  return findCategory(id, useContext(CategoriesContext));
}
