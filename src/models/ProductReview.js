const mongoose = require("mongoose");

const ProductReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    ratingProduct: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    ratingSeller: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
    }
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("ProductReview", ProductReviewSchema);
