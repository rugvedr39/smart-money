const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Create
router.post('/', productController.createProduct);

// Read (Get All)
router.get('/', productController.getAllProducts);

// Read (Get Single)
router.get('/:id', productController.getProduct);

// Update
router.put('/:id', productController.updateProduct);

// Delete
router.delete('/:id', productController.deleteProduct);

module.exports = router;