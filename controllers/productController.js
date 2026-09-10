const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

async function revalidateProducts() {
  try {
    const url = `${process.env.FRONTEND_URL}/api/revalidate?secret=${process.env.REVALIDATE_SECRET}&tag=products`;
    await fetch(url, { method: "POST" });
  } catch { /* non-blocking */ }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: "غير مصرح" });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "غير مصرح" });
  }
}

function normalizeArabic(str) {
  return str
    .replace(/[أإآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

const ALLOWED_FIELDS = [
  "name", "brief", "category", "subCategory", "brand", "color", "storage",
  "network", "screenSize", "description", "deliveryTime",
  "originalPrice", "salePrice", "warrantyYears",
  "freeDelivery", "taxIncluded", "inStock",
  "installment", "specs", "specGroups", "sections", "colors", "variants", "image", "images",
];

function pickAllowed(body) {
  return ALLOWED_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
}

// Fields needed for homepage/listing — excludes heavy fields (description, sections, specGroups, specs)
// Note: discountPercent and price are virtuals, they are included automatically via toJSON
const LIST_PROJECTION = "name brief category subCategory brand color storage originalPrice salePrice warrantyYears freeDelivery taxIncluded inStock installment variants image images";

exports.getProducts = async (req, res) => {
  try {
    const { q, brand } = req.query;
    const query = {};
    if (brand) query.brand = { $regex: new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
    if (!q) return res.json(await Product.find(query, LIST_PROJECTION).lean());

    const normalized = normalizeArabic(String(q).slice(0, 100));
    const products = await Product.find(query, LIST_PROJECTION).limit(200).lean();
    const filtered = products.filter((p) =>
      normalizeArabic(p.name).includes(normalized)
    );
    res.json(filtered);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

// POST /api/products/verify-cart
// يجيب فقط المنتجات المطلوبة بـ IDs محددة، ويرجع fields خفيفة فقط
exports.verifyCart = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20) {
      return res.status(400).json({ error: "ids غير صحيحة" });
    }
    const products = await Product.find(
      { _id: { $in: ids } },
      "name originalPrice salePrice inStock"
    ).lean();
    res.json(products);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
};

exports.createProduct = [requireAdmin, async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const product = await Product.create(data);
    revalidateProducts();
    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}];

exports.updateProduct = [requireAdmin, async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    revalidateProducts();
    res.json(product);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}];

exports.deleteProduct = [requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    revalidateProducts();
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}];
