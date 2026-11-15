export const generateInvoiceHTML = (ord: any) => {
  const dateStr = new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const itemsSubtotal = (ord.items || []).reduce((acc: number, item: any) => acc + (Number(item.product?.price) || Number(item.price) || 0) * item.quantity, 0);
  const itemsCount = (ord.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
  
  const appliedOffer = ord.applied_offer || 'none';
  const isBirthday = appliedOffer === 'birthday' || !!ord.birthday_benefit_requested;
  const isStudent = appliedOffer === 'student' || !!ord.student_discount_requested;
  const isBuyback = appliedOffer === 'buyback' || !!ord.buyback_requested;
  const isBoth = appliedOffer === 'both' || (isStudent && isBuyback);

  let discountLabel = '';
  let discountAmount = 0;
  let gstAmount = 0;

  if (isBirthday) {
    discountLabel = '🎂 Birthday Discount';
    discountAmount = 250;
    gstAmount = Math.round((itemsSubtotal - discountAmount) * 0.05);
  } else if (isBoth) {
    discountLabel = '🎓 Student & ♻️ Buyback Discount';
    discountAmount = Math.round(itemsSubtotal * 0.10) + 100;
    gstAmount = Math.round((itemsSubtotal - discountAmount) * 0.05);
  } else if (isStudent) {
    discountLabel = '🎓 Student Discount';
    discountAmount = 100;
    gstAmount = Math.round((itemsSubtotal - discountAmount) * 0.05);
  } else if (isBuyback) {
    discountLabel = '♻️ Buyback Discount';
    discountAmount = Math.round(itemsSubtotal * 0.10);
    gstAmount = Math.round((itemsSubtotal - discountAmount) * 0.05);
  } else {
    // If no specific offer is set but a discount exists:
    // In Checkout.tsx: orderTotal = (subtotal - discount) + GST + delivery
    // GST is 5% of (subtotal - discount)
    // ord.total = (subtotal - discount) * 1.05 + delivery
    // (ord.total - delivery) = (subtotal - discount) * 1.05
    const totalWithoutDelivery = ord.total - (ord.delivery_charge || 0);
    const taxableAmount = Math.round(totalWithoutDelivery / 1.05);
    gstAmount = totalWithoutDelivery - taxableAmount;
    discountAmount = itemsSubtotal - taxableAmount;
    
    if (discountAmount > 0) {
      discountLabel = '🎁 Applied Offer Discount';
    } else {
      discountAmount = 0;
    }
  }

  // Guarantee the printed breakdown math adds up perfectly:
  const expectedTotal = itemsSubtotal - discountAmount + gstAmount + (ord.delivery_charge || 0);
  const discrepancy = expectedTotal - ord.total;
  if (Math.abs(discrepancy) > 0) {
    discountAmount += discrepancy;
    if (discountAmount < 0) {
      discountAmount = 0;
    }
  }

  const itemsRows = (ord.items || []).map((item: any, idx: number) => `
    <tr class="item-row">
      <td style="text-align: center;">${idx + 1}</td>
      <td>
        <div style="font-weight: 600; color: #1f2937;">${item.product?.name || 'Handcrafted Footwear'}</div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
          ${item.selectedSize ? `Size: ${item.selectedSize}` : ''} 
          ${item.product?.category ? `| Category: ${item.product.category}` : ''}
        </div>
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${(Number(item.product?.price) || 0).toLocaleString('en-IN')}</td>
      <td style="text-align: right; font-weight: 600;">₹${((Number(item.product?.price) || 0) * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${ord.id}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f3f4f6;
          -webkit-print-color-adjust: exact;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 40px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 30px;
          margin-bottom: 30px;
        }
        .brand {
          font-size: 28px;
          font-weight: 800;
          color: #8B5A2B;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 11px;
          color: #9ca3af;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          text-align: right;
        }
        .invoice-meta {
          font-size: 13px;
          color: #4b5563;
          text-align: right;
          margin-top: 8px;
          line-height: 1.5;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .info-section h3 {
          font-size: 12px;
          font-weight: 700;
          color: #8B5A2B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 0;
          margin-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 6px;
        }
        .info-text {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.6;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .table th {
          background-color: #f9fafb;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        .table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-table {
          width: 300px;
          font-size: 13px;
          color: #4b5563;
          line-height: 2;
        }
        .totals-table td {
          padding: 4px 12px;
        }
        .totals-table tr.grand-total {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          background-color: #fcf8f2;
        }
        .totals-table tr.grand-total td {
          border-top: 2px solid #e5e7eb;
          padding: 10px 12px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 40px;
          border-top: 1px solid #f3f4f6;
          padding-top: 20px;
          line-height: 1.5;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .badge-success { background-color: #d1fae5; color: #065f46; }
        .badge-pending { background-color: #fef3c7; color: #92400e; }
        .badge-info { background-color: #dbeafe; color: #1e40af; }
        
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .invoice-box {
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .print-btn {
            display: none;
          }
        }
        
        .print-btn-container {
          max-width: 800px;
          margin: 0 auto 20px auto;
          display: flex;
          justify-content: flex-end;
        }
        .print-btn {
          background-color: #8B5A2B;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .print-btn:hover {
          background-color: #734a23;
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">Print Invoice</button>
      </div>
      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="brand">YY Leathers</div>
            <div class="brand-sub">HANDCRAFTED LUXURY FOOTWEAR</div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              <strong>Invoice No:</strong> INV-${ord.id}<br>
              <strong>Date:</strong> ${dateStr}<br>
              <span class="badge ${ord.status === 'Delivered' ? 'badge-success' : 'badge-pending'}">${ord.status === 'Confirmed' ? 'Processing' : ord.status === 'Dispatched' ? 'Shipped' : ord.status}</span>
            </div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Seller Information</h3>
            <div class="info-text">
              <strong>YY Leathers Atelier HQ</strong><br>
              No 56, Surapet Main road<br>
              chennai 99<br>
              Phone: +91 93441 78585
            </div>
          </div>
          <div class="info-section">
            <h3>Shipped To</h3>
            <div class="info-text">
              <strong>${ord.customer_name}</strong><br>
              ${ord.address}<br>
              Email: ${ord.customer_email || 'N/A'}<br>
              Phone: ${ord.phone}
            </div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Product Details</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 120px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Subtotal (${itemsCount} item${itemsCount > 1 ? 's' : ''})</td>
              <td style="text-align: right;">₹${itemsSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${discountAmount > 0 ? `
            <tr>
              <td style="color: #10b981; font-weight: 500;">${discountLabel}</td>
              <td style="text-align: right; color: #10b981; font-weight: 500;">-₹${discountAmount.toLocaleString('en-IN')}</td>
            </tr>
            ` : ''}
            ${gstAmount > 0 ? `
            <tr>
              <td style="color: #4b5563;">5% GST</td>
              <td style="text-align: right; color: #4b5563;">+₹${gstAmount.toLocaleString('en-IN')}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Delivery Charges</td>
              <td style="text-align: right;">₹${(ord.delivery_charge || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="grand-total">
              <td><strong>Grand Total</strong></td>
              <td style="text-align: right;"><strong>₹${ord.total.toLocaleString('en-IN')}</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          Thank you for shopping with YY Leathers!<br>
          For exchange policies, buybacks, or order support, please reach out to us on WhatsApp +91 93441 78585.
        </div>
      </div>
    </body>
    </html>
  `;
};
