const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        index: true 
    },
    userId: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 2000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);