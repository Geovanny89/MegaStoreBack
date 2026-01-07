const mongoose = require("mongoose");

const storeBannerSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true }
    },

    title: {
      type: String,
      trim: true,
      maxlength: 80
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200
    },

    linkType: {
      type: String,
      enum: ["product", "category", "external", "none"],
      default: "none"
    },

    linkValue: {
      type: String,
      default: null
    },

    startDate: {
      type: Date,
      default: null
    },

    endDate: {
      type: Date,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

storeBannerSchema.index({ seller: 1, isActive: 1 });

module.exports = mongoose.model("StoreBanner", storeBannerSchema);
