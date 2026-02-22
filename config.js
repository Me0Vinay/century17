// ===== CENTURY17TOYS CONFIGURATION =====
// Edit this file to configure your store settings

const CONFIG = {
    // ===== STORE INFO =====
    storeName: 'Century17Toys',
    storeTagline: 'Premium Wholesale Soft Toys',

    // ===== GOOGLE SHEETS CATALOG =====
    // HOW TO SET UP:
    // 1. Create a Google Sheet with columns matching your Excel (product_id, sub_product_id, product_name, etc.)
    // 2. Go to File → Share → Publish to web
    // 3. Select the sheet tab → Choose "Comma-separated values (.csv)" format
    // 4. Click "Publish" and copy the URL
    // 5. Paste the URL below and set useGoogleSheets to true
    //
    // After setup: Just edit your Google Sheet and refresh the website — products update instantly!
    useGoogleSheets: true,  // Set to true after pasting your sheet URL below
    googleSheetCSVUrl: 'https://docs.google.com/spreadsheets/d/17d5ZsULSFn9J-xxkMcVxwSseVdZ6q8ENE58S9wV-xKo/edit?usp=sharing',   // Auto-converted to published CSV format

    // ===== GOOGLE FORM (Order Submission) =====
    enableGoogleSheets: true,
    googleFormURL: 'https://docs.google.com/forms/d/e/1FAIpQLSfE7_v9ct2moxSkR4TsXpTSrTyGAFVw7OuT2GNiM927eWQ6Hg/formResponse',
    formFields: {
        productDetails: 'entry.268856346',
        customerName: 'entry.149289398',
        customerMobile: 'entry.1007281361',
        deliveryAddress: 'entry.1001311992'
    },

    // ===== WHATSAPP INTEGRATION =====
    // Your WhatsApp business number (with country code, no + or spaces)
    // Example: '919876543210' for Indian number +91 98765 43210
    whatsappNumber: '918130789654',
    whatsappMessage: 'Hi! I\'m interested in placing a wholesale order from Century17Toys.',

    // ===== DISPLAY SETTINGS =====
    currency: '₹',
    productsPerPage: 50,  // Set to 0 for no pagination (show all)
};
