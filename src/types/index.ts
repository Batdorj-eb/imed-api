export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  brand: string;
  category_id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  image: string;
  brochure: string;
  is_featured: boolean;
  is_new: boolean;
  has_warranty: boolean;
  created_at: Date;
  updated_at: Date;
  features?: ProductFeature[];
  specifications?: ProductSpecification[];
}

export interface ProductFeature {
  id: number;
  product_id: number;
  feature: string;
  feature_en: string;
  sort_order: number;
}

export interface ProductSpecification {
  id: number;
  product_id: number;
  spec_key: string;
  spec_value: string;
  sort_order: number;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
}
