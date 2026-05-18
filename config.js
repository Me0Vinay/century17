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
    enableGoogleSheets: true  // Set to true after configuring form
};
