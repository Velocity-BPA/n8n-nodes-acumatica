/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, acumaticaApiAction, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS, ORDER_TYPE_OPTIONS, parseLineItems } from '../../utils';

export const purchaseOrderOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a purchase order', action: 'Create a purchase order' },
      { name: 'Delete', value: 'delete', description: 'Delete a purchase order', action: 'Delete a purchase order' },
      { name: 'Get', value: 'get', description: 'Get a purchase order', action: 'Get a purchase order' },
      { name: 'Get Many', value: 'getAll', description: 'Get many purchase orders', action: 'Get many purchase orders' },
      { name: 'Update', value: 'update', description: 'Update a purchase order', action: 'Update a purchase order' },
      { name: 'Add Line', value: 'addLine', description: 'Add a line item', action: 'Add line to purchase order' },
      { name: 'Email to Vendor', value: 'emailToVendor', description: 'Email PO to vendor', action: 'Email purchase order' },
      { name: 'Get Receipts', value: 'getReceipts', description: 'Get related receipts', action: 'Get purchase order receipts' },
    ],
    default: 'getAll',
  },
];

export const purchaseOrderFields: INodeProperties[] = [
  // Order Type
  {
    displayName: 'Order Type',
    name: 'orderType',
    type: 'options',
    options: ORDER_TYPE_OPTIONS.purchaseOrder,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['create', 'get', 'update', 'delete', 'addLine', 'emailToVendor', 'getReceipts'],
      },
    },
    default: 'Normal',
  },
  // Order Number
  {
    displayName: 'Order Number',
    name: 'orderNbr',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['get', 'update', 'delete', 'addLine', 'emailToVendor', 'getReceipts'],
      },
    },
    default: '',
  },
  // Vendor ID for create
  {
    displayName: 'Vendor ID',
    name: 'vendorId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
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
        resource: ['purchaseOrder'],
        operation: ['create'],
      },
    },
    default: '[]',
    description: 'JSON array with InventoryID, OrderQty, UnitCost',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      { displayName: 'Date', name: 'date', type: 'dateTime', default: '' },
      { displayName: 'Description', name: 'description', type: 'string', default: '' },
      { displayName: 'Hold', name: 'hold', type: 'boolean', default: true },
      { displayName: 'Location ID', name: 'locationId', type: 'string', default: '' },
      { displayName: 'Promised On', name: 'promisedOn', type: 'dateTime', default: '' },
      { displayName: 'Vendor Reference', name: 'vendorRef', type: 'string', default: '' },
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
        resource: ['purchaseOrder'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      { displayName: 'Description', name: 'description', type: 'string', default: '' },
      { displayName: 'Hold', name: 'hold', type: 'boolean', default: false },
      { displayName: 'Promised On', name: 'promisedOn', type: 'dateTime', default: '' },
      { displayName: 'Vendor Reference', name: 'vendorRef', type: 'string', default: '' },
    ],
  },
  // Add Line fields
  {
    displayName: 'Inventory ID',
    name: 'inventoryId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['addLine'],
      },
    },
    default: '',
  },
  {
    displayName: 'Order Quantity',
    name: 'orderQty',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['addLine'],
      },
    },
    default: 1,
  },
  {
    displayName: 'Line Additional Fields',
    name: 'lineAdditionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
        operation: ['addLine'],
      },
    },
    default: {},
    options: [
      { displayName: 'Unit Cost', name: 'unitCost', type: 'number', default: 0 },
      { displayName: 'UOM', name: 'uom', type: 'string', default: '' },
      { displayName: 'Warehouse ID', name: 'warehouseId', type: 'string', default: '' },
    ],
  },
  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
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
        resource: ['purchaseOrder'],
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
        resource: ['purchaseOrder'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      { displayName: 'Status', name: 'Status', type: 'options', options: STATUS_OPTIONS.purchaseOrder, default: '' },
      { displayName: 'Vendor ID', name: 'VendorID', type: 'string', default: '' },
    ],
  },
  // Simplify
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['purchaseOrder'],
      },
    },
    default: true,
  },
];

export async function executePurchaseOrderOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    const lineItemsRaw = this.getNodeParameter('lineItems', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const lineItems = parseLineItems(lineItemsRaw);

    const body: IDataObject = {
      OrderType: orderType,
      VendorID: vendorId,
      Details: lineItems.map((item) => ({
        InventoryID: item.InventoryID || item.inventoryId,
        OrderQty: item.OrderQty || item.orderQty || item.quantity,
        UnitCost: item.UnitCost || item.unitCost,
        WarehouseID: item.WarehouseID || item.warehouseId,
        UOM: item.UOM || item.uom,
      })),
    };

    if (additionalFields.date) body.Date = additionalFields.date;
    if (additionalFields.description) body.Description = additionalFields.description;
    if (additionalFields.hold !== undefined) body.Hold = additionalFields.hold;
    if (additionalFields.locationId) body.LocationID = additionalFields.locationId;
    if (additionalFields.promisedOn) body.PromisedOn = additionalFields.promisedOn;
    if (additionalFields.vendorRef) body.VendorRef = additionalFields.vendorRef;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/PurchaseOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/PurchaseOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
      undefined,
      { $expand: 'Details,ShippingInstructions' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/PurchaseOrder', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/PurchaseOrder', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
    };

    if (updateFields.description) body.Description = updateFields.description;
    if (updateFields.hold !== undefined) body.Hold = updateFields.hold;
    if (updateFields.promisedOn) body.PromisedOn = updateFields.promisedOn;
    if (updateFields.vendorRef) body.VendorRef = updateFields.vendorRef;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/PurchaseOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    await acumaticaApiRequest.call(
      this,
      'DELETE',
      `/PurchaseOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
    );
    responseData = { success: true, orderType, orderNbr };
  } else if (operation === 'addLine') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    const orderQty = this.getNodeParameter('orderQty', index) as number;
    const lineFields = this.getNodeParameter('lineAdditionalFields', index) as IDataObject;

    const lineItem: IDataObject = {
      InventoryID: inventoryId,
      OrderQty: orderQty,
    };

    if (lineFields.unitCost) lineItem.UnitCost = lineFields.unitCost;
    if (lineFields.uom) lineItem.UOM = lineFields.uom;
    if (lineFields.warehouseId) lineItem.WarehouseID = lineFields.warehouseId;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Details: [lineItem],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/PurchaseOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'emailToVendor') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    const po = await acumaticaApiRequest.call(
      this,
      'GET',
      `/PurchaseOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
    ) as IDataObject;

    responseData = await acumaticaApiAction.call(
      this,
      '/PurchaseOrder',
      po.id as string,
      'EmailPurchaseOrder',
    );
  } else if (operation === 'getReceipts') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/PurchaseOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
      undefined,
      { $expand: 'PurchaseReceipts' },
    ) as IDataObject;
    responseData = (responseData.PurchaseReceipts as IDataObject[]) || [];
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
