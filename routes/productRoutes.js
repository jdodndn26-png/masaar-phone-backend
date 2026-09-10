const express = require("express");
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, verifyCart } = require("../controllers/productController");

router.route("/").get(getProducts).post(createProduct);
router.post("/verify-cart", verifyCart);
router.route("/:id").get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
