# 📊 Excel Sheet - Column Guide for New Features

## Updated Column Structure

Your Excel sheet should now have these columns (in any order):

### Required Columns (Existing)
```
product_id          - Unique product code (e.g., TOY001)
sub_product_id      - Variant code (e.g., TOY001-S-PINK)
product_name        - Product name (e.g., Fluffy Teddy Bear)
image_link          - Main product image URL (kept for compatibility)
size                - Product size (Small, Medium, Large, XL)
fabric_type         - Material (Plush Cotton, Velvet, etc.)
category_type       - Category (Teddy Bears, Animals, Birds, etc.)
price               - Product price in rupees
color               - Color of product
increment_by        - Minimum order quantity
```

### NEW Columns (Add These!)
```
image_front         - Product front view photo URL
image_top           - Product top/aerial view photo URL
image_side          - Product side view photo URL
image_projection    - Product 360° rotation or bottom view photo URL
youtube_video       - YouTube embed URL for product video
```

---

## 📋 Example Excel Data

### Before (Old Format)
```
product_id | product_name    | image_link | size    | color | price | fabric_type | category_type
TOY001     | Teddy Bear      | https://...|Small    | Pink  | 599   | Plush      | Teddy Bears
```

### After (New Format - Full Recommended)
```
product_id | product_name    | image_link | image_front | image_top | image_side | image_projection | youtube_video | size  | color | price | fabric_type | category_type
TOY001     | Teddy Bear      | https://...|https://...  |https://...|https://...|https://...       |https://www.youtube.com/embed/ABC123|Small| Pink |  599  | Plush      | Teddy Bears
```

---

## 🖼️ Image URL Tips

### Where to Get Image URLs

1. **Local Server**
   ```
   https://yourserver.com/images/teddy-front.jpg
   https://yourserver.com/images/teddy-top.jpg
   ```

2. **Cloud Storage (Recommended)**
   - Google Drive (public share link)
   - Dropbox (public folder)
   - Amazon S3
   - Cloudinary
   - ImgBB
   - Imgur

3. **Stock Photos**
   - Unsplash
   - Pexels
   - Pixabay
   - Shutterstock

### Best Practices for Image URLs
- Use HTTPS (secure) URLs only
- Ensure images are at least 400x400px
- Use consistent image dimensions
- Keep images under 2MB for fast loading
- Test URLs in browser before adding to Excel

---

## 📹 YouTube Video Setup

### How to Get YouTube Embed URL

**Step 1**: Find video on YouTube  
Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

**Step 2**: Convert to embed format  
Replace `watch?v=` with `embed/`  
Result: `https://www.youtube.com/embed/dQw4w9WgXcQ`

**Step 3**: Add to Excel in `youtube_video` column

### YouTube Embed URL Format
```
https://www.youtube.com/embed/VIDEO_ID

Examples:
https://www.youtube.com/embed/dQw4w9WgXcQ
https://www.youtube.com/embed/9bZkp7q19f0
https://www.youtube.com/embed/jNQXAC9IVRw
```

### Creating Product Videos
Best practices for product videos:
- 30 seconds to 2 minutes optimal
- Show product from multiple angles
- Include size comparison (with hand or common object)
- Highlight key features
- Add text overlays with specs
- Use good lighting and clear audio

---

## 🔄 Migration Steps

### Option 1: Simple (Reuse Main Image)
If you only have one image per product, reuse it:

```
image_front = image_link
image_top = image_link  
image_side = image_link
image_projection = image_link
youtube_video = "" (leave empty if no video)
```

### Option 2: Complete (Best)
1. Take/source 4 different product angle photos
2. Upload to cloud storage
3. Get shareable URLs for each
4. Add URLs to Excel columns
5. Record product demo video
6. Upload to YouTube (as Unlisted if wanted)
7. Get embed URL
8. Add to `youtube_video` column

### Option 3: Gradual
Start with main image reused, gradually add:
1. First week: Add top-view images
2. Second week: Add side-view images  
3. Third week: Add 360° projections
4. Fourth week: Record and add videos

---

## 🐧 Using the excel-to-json Tool

### Steps to Update products.json

1. **Prepare Excel** with all columns (see format above)
2. **Export as CSV** from Excel
3. **Use excel-to-json.html tool**
   - Open: `excel-to-json.html` in browser
   - Upload CSV file
   - Download JSON
4. **Replace products.json** with new version
5. **Refresh website** - all products updated!

### CSV Format Checklist
- [ ] Headers in first row
- [ ] All columns present
- [ ] No special characters in URLs
- [ ] Prices are numbers (not currency format)
- [ ] Image URLs start with https://
- [ ] YouTube URLs in embed format (youtube.com/embed/)

---

## 📱 Mobile Photography Tips

If taking your own product photos:

### Front View
- Place product directly facing camera
- Use plain background (white sheet)
- Good natural or ring light lighting
- Centered composition

### Top View
- Bird's-eye view from directly above
- Show product footprint and shape
- Useful for showing size

### Side View
- Product from 90° angle
- Shows depth and profile
- Highlights unique features

### 360° Projection
- Rotate product on turntable
- Capture bottom or rotation view
- Or use 360° camera pan

**Tip**: Use same background and lighting for all 4 angles!

---

## ✅ Validation Checklist

Before exporting from Excel:

### Data Validation
- [ ] All product_ids are unique
- [ ] All sub_product_ids combine product_id + variant
- [ ] Prices are valid numbers > 0
- [ ] increment_by is number ≥ 1
- [ ] No empty required fields

### Image URLs
- [ ] All image_front URLs start with https://
- [ ] All image_top URLs start with https://
- [ ] All image_side URLs start with https://  
- [ ] All image_projection URLs start with https://
- [ ] Can copy each URL to browser and see image

### Video URLs
- [ ] youtube_video format: https://www.youtube.com/embed/VIDEOID
- [ ] Can embed URLs show video when tested
- [ ] (Optional: leave blank if no video)

### Text Fields
- [ ] product_name is descriptive (used in stores)
- [ ] category_type matches your categories
- [ ] color is spelled correctly
- [ ] fabric_type is realistic

---

## 🚀 Updating Sample Data

### Test Before Going Live

1. **Create test file**: Copy a few products
2. **Convert to JSON**: Use excel-to-json.html
3. **Test in browser**: Open index.html
4. **Check product details**: Click a product
5. **Verify images**: See all 4 angles load
6. **Test video**: Embedded video plays
7. **Check suggestions**: Related products show

### Once Tested:
1. Export ALL products from Excel
2. Convert to JSON
3. Backup old products.json
4. Replace with new products.json
5. Refresh website

---

## 🐛 Common Issues & Solutions

### Images Don't Load
**Problem**: Image URLs show broken placeholder  
**Solution**: 
- Verify URL works in browser
- Check for typos in string
- Ensure URLs are HTTPS not HTTP
- Try different image URL

### YouTube Video Not Playing
**Problem**: Video embed area is blank  
**Solution**:
- Check format is `youtube.com/embed/ID`
- Not `youtube.com/watch?v=ID`
- Test video is not private
- Clear browser cache

### JSON Upload Fails
**Problem**: excel-to-json tool shows error  
**Solution**:
- Check CSV format is correct
- No special characters in data
- All rows have same column count
- No empty cells in required columns

### Cart Not Working
**Problem**: Add to cart button not working  
**Solution**:
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh browser
- Check products.json loads correctly

---

## 📞 Quick Reference

**File Names:**
- Excel source: Any name you want
- CSV export: Must be valid CSV format
- JSON result: Replace `products.json`

**Total Columns Needed:** 15
- 10 existing (already have)
- 5 new (image_front, image_top, image_side, image_projection, youtube_video)

**Required New Fields:**
- image_front: Always required
- image_top: Always required
- image_side: Always required
- image_projection: Always required
- youtube_video: Optional (can be empty)

**URL Format:**
- Images: `https://example.com/image.jpg`
- Videos: `https://www.youtube.com/embed/VIDEO_ID`

---

**Template Ready!** Download the blank Excel template with all columns included.

Questions? Check [PRODUCT_DETAIL_SETUP.md](PRODUCT_DETAIL_SETUP.md) for complete documentation.
