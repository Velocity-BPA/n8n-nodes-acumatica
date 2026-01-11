/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, acumaticaApiAction, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS, ORDER_TYPE_OPTIONS, parseLineItems } from '../../utils';

export const invoiceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['invoice'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a sales invoice', action: 'Create an invoice' },
      { name: 'Delete', value: 'delete', description: 'Delete an invoice', action: 'Delete an invoice' },
      { name: 'Get', value: 'get', description: 'Get an invoice', action: 'Get an invoice' },
      { name: 'Get Many', value: 'getAll', description: 'Get many invoices', action: 'Get many invoices' },
      { name: 'Update', value: 'update', description: 'Update an invoice', action: 'Update an invoice' },
      { name: 'Add Line', value: 'addLine', description: 'Add invoice line', action: 'Add invoice line' },
      { name: 'Release', value: 'release', description: 'Release invoice for posting', action: 'Release invoice' },
      { name: 'Get Applications', value: 'getApplications', description: 'Get payment applications', action: 'Get invoice applications' },
      { name: 'Get Balance', value: 'getBalance', description: 'Get invoice balance', action: 'Get invoice balance' },
    ],
    default: 'getAll',
  },
];

export const invoiceFields: INodeProperties[] = [
  // Invoice Type
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    options: ORDER_TYPE_OPTIONS.invoice,
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['create', 'get', 'update', 'delete', 'addLine', 'release', 'getApplications', 'getBalance'],
      },
    },
    default: 'INV',
    description: 'The invoice type',
  },
  // Reference Number
  {
    displayName: 'Reference Number',
    name: 'referenceNbr',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['get', 'update', 'delete', 'addLine', 'release', 'getApplications', 'getBalance'],
      },
    },
    default: '',
    description: 'The invoice reference number',
  },
  // Customer ID for create
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['create'],
      },
    },
    default: '',
  },
  // Line items for create
  {
    displayName: 'Line Items',
    name: 'lineItems',
    type: 'json',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['create'],
      },
    },
    default: '[]',
    description: 'JSON array of line items with InventoryID, Quantity, UnitPrice',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      { displayName: 'Date', name: 'date', type: 'dateTime', default: '' },
      { displayName: 'Description', name: 'description', type: 'string', default: '' },
      { displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
      { displayName: 'External Reference', name: 'externalRef', type: 'string', default: '' },
      { displayName: 'Hold', name: 'hold', type: 'boolean', default: true },
      { displayName: 'Location ID', name: 'locationId', type: 'string', default: '' },
      { displayName: 'Terms', name: 'terms', type: 'string', default: '' },
    ],
  },
  // Update fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      { displayName: 'Description', name: 'description', type: 'string', default: '' },
      { displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
      { displayName: 'External Reference', name: 'externalRef', type: 'string', default: '' },
      { displayName: 'Hold', name: 'hold', type: 'boolean', default: false },
      { displayName: 'Terms', name: 'terms', type: 'string', default: '' },
    ],
  },
  // Add Line fields
  {
    displayName: 'Inventory ID',
    name: 'inventoryId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['addLine'],
      },
    },
    default: '',
    description: 'The item SKU (leave empty for non-stock line)',
  },
  {
    displayName: 'Transaction Description',
    name: 'transactionDescription',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['addLine'],
      },
    },
    default: '',
  },
  {
    displayName: 'Quantity',
    name: 'quantity',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['addLine'],
      },
    },
    default: 1,
  },
  {
    displayName: 'Unit Price',
    name: 'unitPrice',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['addLine'],
      },
    },
    default: 0,
  },
  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['getAll'],
      },
    },
    default: false,
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
    typeOptions: { minValue: 1, maxValue: 500 },
    default: 50,
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    displayOptions: {
      show: {
        resource: ['invoice'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      { displayName: 'Customer ID', name: 'CustomerID', type: 'string', default: '' },
      { displayName: 'Status', name: 'Status', type: 'options', options: STATUS_OPTIONS.invoice, default: '' },
      { displayName: 'Type', name: 'Type', type: 'options', options: ORDER_TYPE_OPTIONS.invoice, default: '' },
    ],
  },
  // Simplify
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['invoice'],
      },
    },
    default: true,
  },
];

export async function executeInvoiceOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const type = this.getNodeParameter('type', index) as string;
    const customerId = this.getNodeParameter('customerId', index) as string;
    const lineItemsRaw = this.getNodeParameter('lineItems', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const lineItems = parseLineItems(lineItemsRaw);

    const body: IDataObject = {
      Type: type,
      CustomerID: customerId,
      Details: lineItems.map((item) => ({
        InventoryID: item.InventoryID || item.inventoryId,
        Qty: item.Quantity || item.quantity || item.Qty,
        UnitPrice: item.UnitPrice || item.unitPrice,
        TransactionDescr: item.TransactionDescr || item.description,
      })),
    };

    if (additionalFields.date) body.Date = additionalFields.date;
    if (additionalFields.description) body.Description = additionalFields.description;
    if (additionalFields.dueDate) body.DueDate = additionalFields.dueDate;
    if (additionalFields.externalRef) body.ExternalRef = additionalFields.externalRef;
    if (additionalFields.hold !== undefined) body.Hold = additionalFields.hold;
    if (additionalFields.locationId) body.LocationID = additionalFields.locationId;
    if (additionalFields.terms) body.Terms = additionalFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Invoice', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Invoice/${encodeURIComponent(type)}/${encodeURIComponent(referenceNbr)}`,
      undefined,
      { $expand: 'Details,ApplicationsCreditMemo,ApplicationsDefault,TaxDetails' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Invoice', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Invoice', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      Type: type,
      ReferenceNbr: referenceNbr,
    };

    if (updateFields.description) body.Description = updateFields.description;
    if (updateFields.dueDate) body.DueDate = updateFields.dueDate;
    if (updateFields.externalRef) body.ExternalRef = updateFields.externalRef;
    if (updateFields.hold !== undefined) body.Hold = updateFields.hold;
    if (updateFields.terms) body.Terms = updateFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Invoice', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

    await acumaticaApiRequest.call(
      this,
      'DELETE',
      `/Invoice/${encodeURIComponent(type)}/${encodeURIComponent(referenceNbr)}`,
    );
    responseData = { success: true, type, referenceNbr };
  } else if (operation === 'addLine') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
    const inventoryId = this.getNodeParameter('inventoryId', index, '') as string;
    const transactionDescription = this.getNodeParameter('transactionDescription', index) as string;
    const quantity = this.getNodeParameter('quantity', index) as number;
    const unitPrice = this.getNodeParameter('unitPrice', index) as number;

    const lineItem: IDataObject = {
      TransactionDescr: transactionDescription,
      Qty: quantity,
      UnitPrice: unitPrice,
    };

    if (inventoryId) {
      lineItem.InventoryID = inventoryId;
    }

    const body: IDataObject = {
      Type: type,
      ReferenceNbr: referenceNbr,
      Details: [lineItem],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Invoice', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'release') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

    const invoice = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Invoice/${encodeURIComponent(type)}/${encodeURIComponent(referenceNbr)}`,
    ) as IDataObject;

    responseData = await acumaticaApiAction.call(
      this,
      '/Invoice',
      invoice.id as string,
      'ReleaseInvoice',
    );
  } else if (operation === 'getApplications') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Invoice/${encodeURIComponent(type)}/${encodeURIComponent(referenceNbr)}`,
      undefined,
      { $expand: 'ApplicationsDefault' },
    ) as IDataObject;
    responseData = (responseData.ApplicationsDefault as IDataObject[]) || [];
  } else if (operation === 'getBalance') {
    const type = this.getNodeParameter('type', index) as string;
    const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Invoice/${encodeURIComponent(type)}/${encodeURIComponent(referenceNbr)}`,
      undefined,
      { $select: 'Type,ReferenceNbr,CustomerID,Amount,Balance,Status' },
    ) as IDataObject;
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
