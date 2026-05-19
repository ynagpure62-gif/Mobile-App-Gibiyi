import { Router, type IRouter } from "express";
// Import the Router from Express to create a group of web routes
import healthRouter from "./health";
// Import the health check route to see if the server is alive
import productsRouter from "./products";
// Import the routes for managing and showing products
import categoriesRouter from "./categories";
// Import the routes for product categories (like Logo, Icon, etc.)
import ordersRouter from "./orders";
// Import the routes for handling user orders
import wishlistRouter from "./wishlist";
// Import the routes for the user's saved items (wishlist)
import customLogoRouter from "./custom-logo";
// Import the routes for ordering custom-made logos
import emailCheckoutRouter from "./email-checkout";
// Import the routes for the simple email-based checkout process
import adminRouter from "./admin";
// Import the routes for the admin dashboard functions

const router: IRouter = Router();
// Create a new main router instance

router.use(healthRouter);
// Connect the health check route (usually at the root)
router.use("/products", productsRouter);
// Connect all product-related routes under the /products link
router.use("/categories", categoriesRouter);
// Connect all category-related routes under the /categories link
router.use("/orders", ordersRouter);
// Connect all order-related routes under the /orders link
router.use("/wishlist", wishlistRouter);
// Connect all wishlist-related routes under the /wishlist link
router.use("/custom-logo", customLogoRouter);
// Connect all custom logo routes under the /custom-logo link
router.use("/email-checkout", emailCheckoutRouter);
// Connect all email checkout routes under the /email-checkout link
router.use("/admin", adminRouter);
// Connect all admin-related routes under the /admin link

export default router;
// Export the main router so it can be used in the app.ts file

