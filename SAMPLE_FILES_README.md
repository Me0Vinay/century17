# 📦 Sample Files for Century17Toys

This directory contains sample files to help you get started with your e-commerce website.

## 📄 Files Included

### 1. [sample-catalog.csv](file:///Users/vinay/Downloads/17%20Century%20Soft%20toys/sample-catalog.csv)
**Purpose:** Template Excel/CSV file with 50 sample toy products

**Contents:**
- 50 product entries (34 unique products with variants)
- Multiple sizes, colors, and fabric types
- 9 different categories
- Price range: ₹349 - ₹2,499

**Categories Included:**
- Teddy Bears
- Animals
- Fantasy
- Birds
- Wild Animals
- Bunnies
- Dinosaurs
- Insects
- Sea Animals

**How to Use:**
1. Open in Excel/Google Sheets
2. Replace with your real products
3. Keep the same column headers
4. Save as CSV
5. Convert using `excel-to-json.html`

**Column Format:**
```
product_id,sub_product_id,product_name,image_link,size,fabric_type,category_type,price,color
```

---

### 2. [GOOGLE_SHEETS_SETUP.md](file:///Users/vinay/Downloads/17%20Century%20Soft%20toys/GOOGLE_SHEETS_SETUP.md)
**Purpose:** Complete guide for setting up Google Sheets order tracking

**Contains:**
- Step-by-step Google Form creation
- Google Sheets linking instructions
- How to find entry IDs
- Sample order data
- Advanced formulas for auto-calculations
- Conditional formatting tips

**Quick Start:**
1. Follow the guide to create your Google Form
2. Link it to a Google Sheet
3. Extract the entry IDs from form HTML
4. Update `config.js` with your IDs
5. Enable Google Sheets integration

---

## 🚀 Quick Testing

### Test with Sample Data

The website is already loaded with 50 sample products! You can:

1. **Browse Products:**
   - Open `index.html` in your browser
   - Scroll through 34 unique toy products
   - See different sizes, colors, and variants

2. **Test Filters:**
   - Try category filter (e.g., "Animals" shows 7 products)
   - Test price ranges
   - Use search bar

3. **Test Shopping Cart:**
   - Add multiple products
   - Change quantities
   - Remove items
   - View total price

4. **Test Checkout:**
   - Click "Proceed to Checkout"
   - Fill in sample details
   - Submit order (will log to console when Google Sheets is disabled)

---

## 📊 Sample Product Statistics

**Total Products:** 50 entries  
**Unique Products:** 34  
**Product Variants:** 16 products have multiple sizes/colors  
**Categories:** 9  
**Price Range:** ₹349 - ₹2,499  

**Sample Products:**
- Fluffy Teddy Bear (3 variants - Small/Medium/Large)
- Giant Bunny Rabbit (3 variants - Pink/White/Gray)
- Dragon Plushie (2 variants - Purple/Red)
- Big Bear Hug (2 variants - Large/XL)

---

## 🔄 Replace with Your Products

### Option 1: Edit CSV Directly

1. Open `sample-catalog.csv`
2. Replace rows with your products
3. Keep same column headers
4. Save file

### Option 2: Create New Excel

1. Create new Excel file
2. Add headers (exact names):
   ```
   product_id | sub_product_id | product_name | image_link | size | fabric_type | category_type | price | color
   ```
3. Add your products
4. Export as CSV

### Convert to JSON

1. Open `excel-to-json.html` in browser
2. Drag & drop your CSV file
3. Click "Download products.json"
4. Replace old `products.json`
5. Refresh website!

---

## 🖼️ Image URLs

The sample catalog uses Unsplash images. For your real products:

**Recommended Image Hosts:**
- [Imgur](https://imgur.com) - Free, no account needed
- [ImgBB](https://imgbb.com) - Free, simple upload
- [Cloudinary](https://cloudinary.com) - Free tier available

**Image Requirements:**
- Format: JPG or PNG
- Recommended size: 500x500px to 800x800px
- Must be direct image URL (ends in .jpg or .png)

---

## 📞 Need Help?

- Check [README.md](file:///Users/vinay/Downloads/17%20Century%20Soft%20toys/README.md) for full documentation
- Review [GOOGLE_SHEETS_SETUP.md](file:///Users/vinay/Downloads/17%20Century%20Soft%20toys/GOOGLE_SHEETS_SETUP.md) for order tracking
- Test locally before deploying to GitHub Pages

---

**Your website is ready to go! Just replace the sample data with your real products and deploy! 🎉**
