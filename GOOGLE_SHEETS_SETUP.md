# Google Sheets Templates for Century17Toys

## 📋 Order Tracking Sheet Template

When you create your Google Form and link it to a Google Sheet, the sheet will automatically have these columns based on your form fields:

### Recommended Sheet Structure

| Column | Description | Auto-filled by Form |
|--------|-------------|---------------------|
| Timestamp | Date & time of order | ✅ Yes |
| Product Details | All items ordered | ✅ Yes |
| Customer Name | Full name | ✅ Yes |
| Mobile Number | Contact number | ✅ Yes |
| Delivery Address | Full address | ✅ Yes |

### Additional Columns You Can Add

Add these columns manually to track order processing:

| Column | Purpose | Example Values |
|--------|---------|----------------|
| Order Status | Track fulfillment | Pending, Confirmed, Shipped, Delivered |
| Order ID | Unique identifier | ORD001, ORD002, etc. |
| Total Amount | Order value | ₹1,299 |
| Payment Status | Payment tracking | Pending, Paid, COD |
| Tracking Number | Courier tracking | ABC123456789 |
| Notes | Internal notes | Customer requested gift wrap |
| Assigned To | Staff handling order | Vinay, Team Member 1 |

---

## 🎯 Google Form Setup Guide

### Step 1: Create Form

Go to [Google Forms](https://forms.google.com) and create a new form with these questions:

1. **Product Details** (Paragraph)
   - Description: "Order summary will appear here"
   
2. **Customer Name** (Short answer)
   - Required: Yes
   
3. **Mobile Number** (Short answer)
   - Required: Yes
   - Validation: Number, 10 digits
   
4. **Delivery Address** (Paragraph)
   - Required: Yes

### Step 2: Link to Sheet

1. In form, click **Responses** tab
2. Click green Sheets icon
3. Choose "Create a new spreadsheet"
4. Name it: "Century17Toys Orders"

### Step 3: Get Entry IDs

1. Click the preview  button (eye icon) in form
2. Right-click on the page → Inspect (or press F12)
3. For each field, find the `name` attribute
4. Copy the entry IDs (e.g., `entry.123456789`)

Example HTML you'll see:
```html
<textarea name="entry.123456789" ...></textarea>
<input name="entry.987654321" ...>
```

### Step 4: Update config.js

Open [config.js](file:///Users/vinay/Downloads/17%20Century%20Soft%20toys/config.js) and update:

```javascript
const CONFIG = {
    googleFormURL: 'https://forms.gle/g2ticV4iQ3u1dTyv9',
    formFields: {
        productDetails: 'entry.268856346',  // Replace with actual
        customerName: 'entry.149289398',     // Replace with actual
        customerMobile: 'entry.1007281361',   // Replace with actual
        deliveryAddress: 'entry.1001311992'   // Replace with actual
    },
    enableGoogleSheets: true  // Change to true
};
```

---

## 📊 Sample Order Sheet

Here's what your Google Sheet will look like after receiving orders:

| Timestamp | Product Details | Customer Name | Mobile Number | Delivery Address | Order Status |
|-----------|----------------|---------------|---------------|------------------|--------------|
| 2026-02-14 14:30:25 | Fluffy Teddy Bear (Medium, Brown) × 1 = ₹899.00<br>Cute Elephant Plush (Medium, Blue) × 2 = ₹1,498.00<br><br>Total: ₹2,397.00 | Vinay Kumar | 9876543210 | 123 MG Road, Bangalore, Karnataka, 560001 | Pending |
| 2026-02-14 15:45:12 | Giant Bunny Rabbit (Large, Pink) × 1 = ₹1,599.00<br><br>Total: ₹1,599.00 | Priya Sharma | 9123456789 | 45 Park Street, Mumbai, Maharashtra, 400001 | Confirmed |
| 2026-02-14 16:20:33 | Unicorn Fantasy (Large, White) × 1 = ₹1,499.00<br>Happy Duckling (Small, Yellow) × 3 = ₹1,197.00<br><br>Total: ₹2,696.00 | Rahul Patel | 9988776655 | 78 Anna Nagar, Chennai, Tamil Nadu, 600040 | Shipped |

---

## 🔧 Advanced Sheet Features

### Auto-Calculate Total Amount

Add this formula in the "Total Amount" column (assuming Product Details is in column B):

```
=REGEXEXTRACT(B2, "Total: ₹([0-9,]+\.[0-9]{2})")
```

### Auto-Generate Order ID

Add this formula in "Order ID" column (A2 is timestamp):

```
="ORD"&TEXT(ROW()-1,"000")
```

### Conditional Formatting

Set up color-coding for order status:
- **Pending**: Yellow background
- **Confirmed**: Blue background
- **Shipped**: Orange background
- **Delivered**: Green background

### Send Confirmation Emails

Use Google Apps Script to auto-send confirmation emails when orders arrive. Sample script:

```javascript
function sendOrderConfirmation() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var email = sheet.getRange(lastRow, 4).getValue(); // Mobile column
  var name = sheet.getRange(lastRow, 3).getValue(); // Name column
  
  // You can set up email notifications here
}
```

---

## ✅ Testing Your Setup

1. Open your website
2. Add products to cart
3. Click checkout
4. Fill in test details:
   - Name: Test User
   - Mobile: 9999999999
   - Address: Test Address
5. Submit order
6. Check your Google Sheet - order should appear within seconds!

---

**Need Help?**
- [Google Forms Help](https://support.google.com/forms)
- [Google Sheets Help](https://support.google.com/sheets)
