# 🧸 Century17Toys E-commerce Website

A mobile-first e-commerce website for soft toys with Excel-based product management and Google Sheets order integration. Perfect for small businesses looking to sell online without complex backend systems.

## ✨ Features

- **Mobile-First Design** - Optimized for mobile users with responsive desktop support
- **No Login Required** - Simplified shopping experience
- **Excel-Based Catalog** - Update products monthly via Excel spreadsheet
- **Shopping Cart** - LocalStorage-based cart with variant support
- **Google Sheets Orders** - Orders automatically saved to Google Sheets
- **Product Variants** - Support for multiple sizes, colors, and fabrics
- **Smart Filters** - Category, price range, and search functionality
- **Zero Backend** - Runs entirely on GitHub Pages (free hosting)

## 🚀 Quick Start

### 1. Setup Google Sheets Integration

To receive orders in Google Sheets:

1. **Create a Google Form:**
   - Go to [Google Forms](https://forms.google.com)
   - Create a new form with these fields:
     - **Product Details** (Paragraph text)
     - **Customer Name** (Short answer)
     - **Mobile Number** (Short answer)
     - **Delivery Address** (Paragraph text)

2. **Link to Google Sheet:**
   - Click "Responses" tab
   - Click the Google Sheets icon to create a linked spreadsheet
   - This sheet will automatically receive all orders

3. **Get Form Configuration:**
   - Right-click on the form preview and select "Inspect"
   - For each field, find the `name` attribute (looks like `entry.123456789`)
   - Note down all entry IDs

4. **Update config.js:**
   ```javascript
   const CONFIG = {
       googleFormURL: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse',
       formFields: {
           productDetails: 'entry.123456789',  // Replace with your entry ID
           customerName: 'entry.987654321',     // Replace with your entry ID
           customerMobile: 'entry.111111111',   // Replace with your entry ID
           deliveryAddress: 'entry.222222222'   // Replace with your entry ID
       },
       enableGoogleSheets: true  // Set to true after configuration
   };
   ```

### 2. Update Product Catalog

**Monthly Workflow:**

1. **Prepare Excel File** with these exact column headers:
   - `product_id` - Unique ID (e.g., TOY001)
   - `sub_product_id` - Variant ID (e.g., TOY001-S-PINK)
   - `product_name` - Product name
   - `image_link` - Full image URL
   - `size` - Size (Small, Medium, Large)
   - `fabric_type` - Fabric description
   - `category_type` - Category name
   - `price` - Price (numbers only)
   - `color` - Color name

2. **Convert to JSON:**
   - Open `excel-to-json.html` in your browser
   - Drag and drop your Excel file
   - Click "Download products.json"

3. **Update Website:**
   - Replace the old `products.json` file with the new one
   - Commit and push to GitHub

### 3. Deploy to GitHub Pages

1. **Initialize Git Repository:**
   ```bash
   cd "/Users/vinay/Downloads/17 Century Soft toys"
   git init
   git add .
   git commit -m "Initial commit: Century17Toys website"
   ```

2. **Create GitHub Repository:**
   - Go to [GitHub](https://github.com/new)
   - Create a new repository named `century17toys`
   - Don't initialize with README

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/century17toys.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main → / (root)
   - Click Save

5. **Access Your Website:**
   - Your site will be live at: `https://YOUR_USERNAME.github.io/century17toys/`

## 📁 Project Structure

```
17 Century Soft toys/
├── index.html              # Main website
├── styles.css              # Styling
├── script.js               # JavaScript functionality
├── config.js               # Google Sheets configuration
├── products.json           # Product catalog (update monthly)
├── excel-to-json.html      # Conversion tool
└── README.md               # Documentation
```

## 🎨 Customization

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary: #d946ef;        /* Main brand color */
    --secondary: #ec4899;      /* Secondary accent */
    --accent: #f59e0b;         /* Highlight color */
}
```

### Update Logo

Edit the logo in `index.html`:

```html
<h1>🧸 YourStore<span class="logo-accent">Name</span></h1>
```

### Modify Categories

Categories are automatically populated from your `products.json` file.

## 📱 Testing Locally

Simply open `index.html` in your browser. For best results, use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve
```

Then visit `http://localhost:8000`

## 🔄 Monthly Update Process

1. Export updated catalog from Excel
2. Use `excel-to-json.html` to convert
3. Replace `products.json`
4. Push to GitHub:
   ```bash
   git add products.json
   git commit -m "Update catalog for [Month Year]"
   git push
   ```

## 🛠️ Troubleshooting

**Orders not appearing in Google Sheets?**
- Verify entry IDs in `config.js`
- Check that `enableGoogleSheets` is `true`
- Test the Google Form directly to ensure it's working

**Products not loading?**
- Open browser console (F12) for errors
- Verify `products.json` is valid JSON
- Check image URLs are accessible

**Images not showing?**
- Use direct image links (not Google Drive preview links)
- Consider using [Imgur](https://imgur.com) or [ImgBB](https://imgbb.com) for hosting
- Use placeholders: `https://via.placeholder.com/400x400/f0abfc/9333ea?text=Product+Name`

## 📞 Support

For technical issues or questions:
- Check browser console for detailed error messages
- Validate JSON at [JSONLint](https://jsonlint.com)
- Test Google Form submission manually

## 📄 License

Free to use for commercial purposes. No attribution required.

---

**Built with ❤️ for Century17Toys**
