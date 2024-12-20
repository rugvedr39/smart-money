const Product = require('../models/product');
const Admin = require('../models/adminModel');


// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        const adminSettings = await Admin.findOne();

        // Add deliveryCharges and gst to each product
        const updatedProducts = products.map(product => ({
            ...product.toObject(), // Convert Mongoose document to plain object
            deliveryCharges: adminSettings.deliveryCharges,
            gst: adminSettings.gst
        }));

        console.log(updatedProducts);

        res.status(200).json(updatedProducts);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get a single product by id
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};