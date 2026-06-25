// Configuration for Google Sheets Integration
// SETUP INSTRUCTIONS:
// 1. Create a Google Form with the following fields:
//    - Product Details (Paragraph)
//    - Customer Name (Short answer)
//    - Mobile Number (Short answer)
//    - Delivery Address (Paragraph)
// 2. Link the form to a Google Sheet
// 3. Get the pre-filled form URL by clicking "Get pre-filled link"
// 4. Replace the values below with your form's entry IDs

const CONFIG = {
    // Replace this with your Google Form URL
    googleFormURL: 'https://docs.google.com/forms/d/e/1FAIpQLSfE7_v9ct2moxSkR4TsXpTSrTyGAFVw7OuT2GNiM927eWQ6Hg/formResponse',

    // Replace these with your form's field entry IDs
    // To find these: Right-click on each field in the form preview and "Inspect"
    // Look for "entry.XXXXXXXX" in the name attribute
    formFields: {
        productDetails: 'entry.268856346',  // Replace with actual entry ID
        customerName: 'entry.149289398',     // Replace with actual entry ID
        customerMobile: 'entry.1007281361',   // Replace with actual entry ID
        deliveryAddress: 'entry.1001311992'   // Replace with actual entry ID
    },

    // Store name (for order details)
    storeName: 'Century17Toys',

    // Enable/disable Google Sheets integration (set to false for testing)
    enableGoogleSheets: true,  // Set to true after configuring form

    // ===== ADMIN PANEL =====
    // Type the admin command (default "update_value") in the search box to open
    // the admin panel. It is gated by this password.
    // NOTE: this is a static site (GitHub Pages, no backend), so this password
    // lives in client-side code. It deters casual customers but is NOT truly
    // secret — anyone can read the page source. Change it to a value only you
    // know, and don't reuse an important password here.
    adminPassword: 'change-this-password',

    // Word typed in the search box to open the admin panel.
    adminCommand: 'update_value',

    // The tab (sheet) NAME inside your Google Sheet that holds store settings
    // (minimum billing + discount tiers). See README for the exact row format.
    // If the tab is missing or unreachable, the defaults below are used so the
    // store keeps working.
    settingsSheetName: 'Settings',

    // ===== STORE SETTINGS (defaults / offline fallback) =====
    // The LIVE values come from the Settings tab in your Google Sheet; these are
    // only used when that tab can't be read. Amounts are in INR (₹).
    defaultStoreSettings: {
        enabled: true,        // master switch for minimum-billing + discounts
        minBilling: 15000,    // ₹ minimum cart value required to check out
        // Order-value discount ladder: at or above each threshold (₹), the
        // matching percent is taken off the order total. Highest matching
        // threshold wins. Keep thresholds in ascending order.
        discountTiers: [
            { threshold: 50000,  percent: 2 },
            { threshold: 100000, percent: 3.5 },
            { threshold: 300000, percent: 5 }
        ]
    }
};
