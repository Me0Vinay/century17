# Increment By Feature Documentation

## Overview

The `increment_by` feature allows you to control how many units of a product get added to the cart each time a customer clicks "Add to Cart" or uses the +/- buttons in the cart.

## How It Works

### In Your Excel/CSV
Add a new column called `increment_by` with a number representing how many items to add per click.

**Example:**
| product_id | product_name | size | increment_by |
|------------|--------------|------|--------------|
| TOY001 | Fluffy Teddy | Small | 1 |
| TOY001 | Fluffy Teddy | Medium | 2 |
| TOY023 | Big Bear Hug | Extra Large | 5 |

### Behavior

- **increment_by = 1**: Standard behavior (1 item per click)
- **increment_by = 2**: Adds 2 items per click
- **increment_by = 5**: Adds 5 items per click (bulk items)
- **If not specified**: Defaults to 1

### Use Cases

1. **Single items** (increment_by: 1)
   - Premium, expensive toys
   - Large items
   - Collectibles

2. **Pairs** (increment_by: 2)
   - Items sold in pairs
   - Medium-sized toys
   - Common products

3. **Bulk packs** (increment_by: 5 or more)
   - Small accessories
   - Party pack toys
   - Wholesale items
   - Mini figures sold in sets

## Sample Catalog Configuration

The sample catalog has been configured with:

- **Small products**: increment_by = 1
- **Medium/Large products**: increment_by = 2  
- **Extra Large products**: increment_by = 5

## Testing Results

✅ **Test 1: Small Product (Fluffy Teddy Bear)**
- Set to `increment_by: 1`
- Clicking "Add to Cart": Added 1 item
- Clicking "+" in cart: Increased by 1
- Clicking "-" in cart: Decreased by 1

✅ **Test 2: Large Product (Big Bear Hug - Large)**
- Set to `increment_by: 2`
- Clicking "Add to Cart": Added 2 items
- Clicking "+" in cart: Increased by 2  
- Clicking "-" in cart: Decreased by 2

✅ **Test 3: Extra Large Product (Big Bear Hug - XL)**
- Set to `increment_by: 5`
- Clicking "Add to Cart": Added 5 items
- Clicking "+" in cart: Increased by 5
- Clicking "-" in cart: Decreased by 5

## Cart Screenshot

![Cart showing different increment values](/Users/vinay/.gemini/antigravity/brain/e556cb9f-2971-421c-a286-ae2a80de9e38/.system_generated/click_feedback/click_feedback_1771065460432.png)

As shown in the screenshot:
- **Big Bear Hug (Large)**: Quantity 4 (increments by 2)
- **Fluffy Teddy Bear (Small)**: Quantity 2 (increments by 1)
- **Big Bear Hug (Extra Large)**: Quantity 10 (increments by 5)

## How to Update Your Catalog

### Option 1: Add to Existing CSV

1. Open your `sample-catalog.csv`
2. Add a new column header: `increment_by`
3. Fill in values (1, 2, 5, etc.) for each product
4. Save the file

### Option 2: Excel Converter

The Excel-to-JSON converter now automatically supports `increment_by`:

1. Include the `increment_by` column in your Excel
2. If omitted, it defaults to 1
3. Convert using `excel-to-json.html`
4. The JSON will include the increment values

## Technical Implementation

The feature works at three levels:

1. **Product Data**: `increment_by` stored in products.json
2. **Add to Cart**: Uses increment value when adding items
3. **Cart Controls**: +/- buttons respect the increment value

This ensures a consistent experience across all cart operations.
