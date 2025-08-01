// middleware/uploadProductImage.js
const multer = require('multer');
const path = require('path');
const { CustomError } = require('../utils/helpers'); // Sesuaikan path jika CustomError ada di tempat lain
const fs = require('fs'); // Import fs

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/product_images/';
        // Pastikan direktori ada, buat jika belum
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Buat nama file unik: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filter file berdasarkan tipe (hanya gambar)
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new CustomError('Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.', 400), false);
    }
};

const uploadProductImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // Batasi ukuran file hingga 2MB
    }
}).single('image'); // 'image' adalah nama field di form (input type="file" name="image")

module.exports = uploadProductImage;