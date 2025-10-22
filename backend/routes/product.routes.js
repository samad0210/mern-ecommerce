import express from "express";
import { getallProducts, getFeaturedProducts, createProducts , deleteProduct, getRecommendedProducts, getCategoryProducts, toggleFeaturedProduct} from "../controllers/product.controller.js";
import { AdminRoute, protectedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/",protectedRoute,AdminRoute,getallProducts);
router.get("/featured",getFeaturedProducts);
router.get("/category/:category",getCategoryProducts);
router.get("/recomendations",getRecommendedProducts);
router.post("/",protectedRoute,AdminRoute,createProducts);
router.patch("/:id",protectedRoute,AdminRoute,toggleFeaturedProduct);
router.delete("/:id",protectedRoute,AdminRoute,deleteProduct);

export default router;
