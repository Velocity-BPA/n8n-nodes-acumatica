/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { simplifyResponse } from '../transport';

/**
 * Log licensing notice (once per session)
 */
let licenseNoticeShown = false;

export function showLicenseNotice(): void {
  if (!licenseNoticeShown) {
    console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
    `.trim());
    licenseNoticeShown = true;
  }
}

/**
 * Prepare output data from Acumatica response
 */
export function prepareOutput(
  data: IDataObject | IDataObject[],
  simplify = true,
): INodeExecutionData[] {
  const items: INodeExecutionData[] = [];
  const dataArray = Array.isArray(data) ? data : [data];

  for (const item of dataArray) {
    items.push({
      json: simplify ? simplifyResponse(item) : item,
    });
  }

  return items;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Format date to Acumatica format (YYYY-MM-DD)
 */
export function formatAcumaticaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Build $select query parameter from field list
 */
export function buildSelectFields(fields: string[]): string {
  return fields.join(',');
}

/**
 * Build $expand query parameter for related entities
 */
export function buildExpandFields(expands: string[]): string {
  return expands.join(',');
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: IDataObject,
  requiredFields: string[],
): void {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Clean empty values from object (keeps 0 and false)
 */
export function cleanEmptyValues(obj: IDataObject): IDataObject {
  const cleaned: IDataObject = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Keep all values except undefined, null, and empty strings
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = cleanEmptyValues(value as IDataObject);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    } else if (value === 0 || value === false) {
      // Explicitly keep 0 and false
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Parse line items from JSON string or array
 */
export function parseLineItems(lineItems: string | object[]): IDataObject[] {
  if (!lineItems || lineItems === '') {
    return [];
  }
  if (typeof lineItems === 'string') {
    try {
      return JSON.parse(lineItems);
    } catch {
      return [];
    }
  }
  return lineItems as IDataObject[];
}

/**
 * Common status options for Acumatica entities
 */
export const STATUS_OPTIONS = {
  customer: [
    { name: 'Active', value: 'Active' },
    { name: 'Hold', value: 'Hold' },
    { name: 'Credit Hold', value: 'CreditHold' },
    { name: 'One-Time', value: 'OneTime' },
    { name: 'Inactive', value: 'Inactive' },
  ],
  salesOrder: [
    { name: 'Open', value: 'Open' },
    { name: 'Hold', value: 'Hold' },
    { name: 'Completed', value: 'Completed' },
    { name: 'Cancelled', value: 'Cancelled' },
    { name: 'Back Order', value: 'BackOrder' },
    { name: 'Shipping', value: 'Shipping' },
  ],
  invoice: [
    { name: 'Hold', value: 'Hold' },
    { name: 'Balanced', value: 'Balanced' },
    { name: 'Open', value: 'Open' },
    { name: 'Closed', value: 'Closed' },
    { name: 'Voided', value: 'Voided' },
  ],
  vendor: [
    { name: 'Active', value: 'Active' },
    { name: 'Hold', value: 'Hold' },
    { name: 'One-Time', value: 'OneTime' },
    { name: 'Inactive', value: 'Inactive' },
  ],
  purchaseOrder: [
    { name: 'Hold', value: 'Hold' },
    { name: 'Open', value: 'Open' },
    { name: 'Completed', value: 'Completed' },
    { name: 'Cancelled', value: 'Cancelled' },
  ],
  payment: [
    { name: 'Hold', value: 'Hold' },
    { name: 'Balanced', value: 'Balanced' },
    { name: 'Open', value: 'Open' },
    { name: 'Closed', value: 'Closed' },
    { name: 'Released', value: 'Released' },
    { name: 'Voided', value: 'Voided' },
  ],
  shipment: [
    { name: 'Hold', value: 'Hold' },
    { name: 'Open', value: 'Open' },
    { name: 'Confirmed', value: 'Confirmed' },
    { name: 'Completed', value: 'Completed' },
  ],
  item: [
    { name: 'Active', value: 'Active' },
    { name: 'Inactive', value: 'Inactive' },
    { name: 'No Sales', value: 'NoSales' },
    { name: 'No Purchases', value: 'NoPurchases' },
    { name: 'No Request', value: 'NoRequest' },
  ],
};

/**
 * Common order type options
 */
export const ORDER_TYPE_OPTIONS = {
  salesOrder: [
    { name: 'SO - Sales Order', value: 'SO' },
    { name: 'TR - Transfer', value: 'TR' },
    { name: 'IN - Invoice', value: 'IN' },
    { name: 'RC - Credit Memo', value: 'RC' },
    { name: 'RM - Return Order', value: 'RM' },
    { name: 'QT - Quote', value: 'QT' },
  ],
  purchaseOrder: [
    { name: 'Normal', value: 'Normal' },
    { name: 'Blanket', value: 'Blanket' },
    { name: 'Drop Ship', value: 'DropShip' },
    { name: 'Standard', value: 'Standard' },
  ],
  invoice: [
    { name: 'Invoice', value: 'INV' },
    { name: 'Debit Memo', value: 'DM' },
    { name: 'Credit Memo', value: 'CM' },
  ],
  payment: [
    { name: 'Payment', value: 'PMT' },
    { name: 'Prepayment', value: 'PPM' },
    { name: 'Refund', value: 'REF' },
    { name: 'Void Payment', value: 'VPM' },
    { name: 'Customer Refund', value: 'CRD' },
  ],
  bill: [
    { name: 'Bill', value: 'Bill' },
    { name: 'Debit Adjustment', value: 'DebitAdj' },
    { name: 'Credit Adjustment', value: 'CreditAdj' },
    { name: 'Prepayment', value: 'Prepayment' },
  ],
};
