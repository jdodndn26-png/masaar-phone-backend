const mongoose = require("mongoose");

const SECTION_TYPES = [
  "design", "colors", "camera", "zoom", "low_light", "front_camera",
  "video", "performance", "cooling", "battery", "software", "ai",
  "safety", "accessories", "comparison", "custom",
];

const mediaSub = new mongoose.Schema({
  type:    { type: String, enum: ["image", "video", "poster"], default: "image" },
  url:     { type: String, required: true },
  urlMobile:  String,
  poster:     String,
  alt:        String,
  title:      String,
  sortOrder:  { type: Number, default: 0 },
}, { _id: true });

const sectionSub = new mongoose.Schema({
  type:        { type: String, required: true, enum: [...SECTION_TYPES, "custom"] },
  title:       String,
  subtitle:    String,
  description: String,
  content:     { type: mongoose.Schema.Types.Mixed, default: {} },
  media:       [mediaSub],
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brief: { type: String },
    originalPrice: { type: Number, required: true },
    salePrice: { type: Number },
    description: { type: String },
    image: { type: String },
    images: [{ type: String }],
    variants: [
      {
        color: String,
        colorCode: String,
        defaultStorage: String,
        images: [String],
        storageOptions: [
          {
            storage: String,
            ram: String,
            gpu: String,
            chip: String,
            size: String,
            originalPrice: Number,
            salePrice: Number,
          },
        ],
      },
    ],
    color: { type: String },
    storage: { type: String },
    network: { type: String },
    screenSize: { type: String },
    specs: {
      screen: String,
      processor: String,
      ram: String,
      storage: String,
      rearCamera: String,
      frontCamera: String,
      battery: String,
      batteryLife: String,
      charging: String,
      os: String,
      extras: String,
    },
    // specGroups: structured specs for Comparison (alongside legacy specs)
    specGroups: [
      {
        group: { type: String, required: true },
        items: [{ key: String, value: String }],
      },
    ],
    // Dynamic page sections
    sections: [sectionSub],
    freeDelivery: { type: Boolean, default: true },
    deliveryTime: { type: String, default: "24 ساعة" },
    warrantyYears: { type: Number, default: 2 },
    installment: {
      available: { type: Boolean, default: false },
      downPayment: Number,
      note: String,
      months: Number,
      conditions: [String],
      policy: String,
    },
    taxIncluded: { type: Boolean, default: true },
    category: { type: String, index: true },
    subCategory: { type: String, index: true },
    brand: { type: String, index: true },
    inStock: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ brand: 1, inStock: 1 });

productSchema.virtual("discountPercent").get(function () {
  if (this.salePrice != null && this.salePrice !== this.originalPrice) {
    return Math.round(((this.originalPrice - this.salePrice) / this.originalPrice) * 100);
  }
  return 0;
});

productSchema.virtual("price").get(function () {
  return this.salePrice || this.originalPrice;
});

// Indexes for common query patterns
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ category: 1, brand: 1 });

module.exports = mongoose.model("Product", productSchema);
