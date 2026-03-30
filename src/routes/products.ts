import { Router, Request, Response } from "express";
import { query, getClient } from "../db/connection.js";
import { authenticate, authorize } from "../middleware/auth.js";
import type { Product, ProductFeature, ProductSpecification } from "../types/index.js";

export const productRoutes = Router();

productRoutes.get("/", async (req: Request, res: Response) => {
  const { brand, category_id, is_featured, is_new, search } = req.query;

  let sql = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];
  let paramIndex = 1;

  if (brand) {
    sql += ` AND brand = $${paramIndex++}`;
    params.push(brand);
  }
  if (category_id) {
    sql += ` AND category_id = $${paramIndex++}`;
    params.push(category_id);
  }
  if (is_featured === "true") {
    sql += " AND is_featured = TRUE";
  }
  if (is_new === "true") {
    sql += " AND is_new = TRUE";
  }
  if (search) {
    sql += ` AND (name ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex + 1} OR brand ILIKE $${paramIndex + 2})`;
    const term = `%${search}%`;
    params.push(term, term, term);
    paramIndex += 3;
  }

  sql += " ORDER BY created_at DESC";

  const products = await query<Product[]>(sql, params);
  const productIds = products.map((p) => p.id);

  if (productIds.length > 0) {
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(",");
    const features = await query<ProductFeature[]>(
      `SELECT * FROM product_features WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
      productIds
    );
    const specs = await query<ProductSpecification[]>(
      `SELECT * FROM product_specifications WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
      productIds
    );

    for (const product of products) {
      product.features = features.filter((f) => f.product_id === product.id);
      product.specifications = specs.filter((s) => s.product_id === product.id);
    }
  }

  res.json({ products });
});

productRoutes.get("/:id", async (req: Request, res: Response) => {
  const products = await query<Product[]>("SELECT * FROM products WHERE id = $1", [req.params.id]);
  const product = products[0];

  if (!product) {
    res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" });
    return;
  }

  product.features = await query<ProductFeature[]>(
    "SELECT * FROM product_features WHERE product_id = $1 ORDER BY sort_order",
    [product.id]
  );
  product.specifications = await query<ProductSpecification[]>(
    "SELECT * FROM product_specifications WHERE product_id = $1 ORDER BY sort_order",
    [product.id]
  );

  res.json({ product });
});

productRoutes.post("/", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const { brand, category_id, name, name_en, description, description_en, image, brochure, is_featured, is_new, has_warranty, features, specifications } = req.body;

  if (!name || !name_en) {
    res.status(400).json({ error: "Бүтээгдэхүүний нэр (MN, EN) заавал шаардлагатай" });
    return;
  }

  const warrantyFlag = has_warranty === undefined ? true : Boolean(has_warranty);

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO products (brand, category_id, name, name_en, description, description_en, image, brochure, is_featured, is_new, has_warranty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [brand || "", category_id || "", name, name_en, description || "", description_en || "", image || "", brochure || "", is_featured || false, is_new || false, warrantyFlag]
    );

    const productId = result.rows[0].id;

    if (features?.length) {
      for (let i = 0; i < features.length; i++) {
        const f = features[i];
        await client.query(
          "INSERT INTO product_features (product_id, feature, feature_en, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, f.feature || "", f.feature_en || "", i]
        );
      }
    }

    if (specifications?.length) {
      for (let i = 0; i < specifications.length; i++) {
        const s = specifications[i];
        await client.query(
          "INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, s.spec_key || "", s.spec_value || "", i]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ id: productId, message: "Бүтээгдэхүүн амжилттай үүсгэлээ" });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

productRoutes.put("/:id", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const { brand, category_id, name, name_en, description, description_en, image, brochure, is_featured, is_new, has_warranty, features, specifications } = req.body;
  const productId = Number(req.params.id);

  const existing = await query<Product[]>("SELECT id FROM products WHERE id = $1", [productId]);
  if (!existing[0]) {
    res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" });
    return;
  }

  const warrantyFlag = has_warranty === undefined ? true : Boolean(has_warranty);

  const client = await getClient();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE products SET brand = $1, category_id = $2, name = $3, name_en = $4, description = $5, description_en = $6,
       image = $7, brochure = $8, is_featured = $9, is_new = $10, has_warranty = $11 WHERE id = $12`,
      [brand || "", category_id || "", name, name_en, description || "", description_en || "", image || "", brochure || "", is_featured || false, is_new || false, warrantyFlag, productId]
    );

    await client.query("DELETE FROM product_features WHERE product_id = $1", [productId]);
    if (features?.length) {
      for (let i = 0; i < features.length; i++) {
        const f = features[i];
        await client.query(
          "INSERT INTO product_features (product_id, feature, feature_en, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, f.feature || "", f.feature_en || "", i]
        );
      }
    }

    await client.query("DELETE FROM product_specifications WHERE product_id = $1", [productId]);
    if (specifications?.length) {
      for (let i = 0; i < specifications.length; i++) {
        const s = specifications[i];
        await client.query(
          "INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, s.spec_key || "", s.spec_value || "", i]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Бүтээгдэхүүн амжилттай шинэчлэгдлээ" });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

productRoutes.delete("/:id", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const existing = await query<Product[]>("SELECT id FROM products WHERE id = $1", [req.params.id]);
  if (!existing[0]) {
    res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" });
    return;
  }

  await query("DELETE FROM products WHERE id = $1", [req.params.id]);
  res.json({ message: "Бүтээгдэхүүн устгагдлаа" });
});
