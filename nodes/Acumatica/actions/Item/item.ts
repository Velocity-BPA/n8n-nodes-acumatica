/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS } from '../../utils';

export const itemOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['item'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new stock item', action: 'Create an item' },
      { name: 'Delete', value: 'delete', description: 'Delete a stock item', action: 'Delete an item' },
      { name: 'Get', value: 'get', description: 'Get a stock item', action: 'Get an item' },
      { name: 'Get Many', value: 'getAll', description: 'Get many stock items', action: 'Get many items' },
      { name: 'Update', value: 'update', description: 'Update a stock item', action: 'Update an item' },
      { name: 'Get Availability', value: 'getAvailability', description: 'Get item availability by warehouse', action: 'Get item availability' },
      { name: 'Get Warehouses', value: 'getWarehouses', description: 'Get warehouse details for item', action: 'Get item warehouses' },
      { name: 'Get Vendor Details', value: 'getVendorDetails', description: 'Get vendor pricing info', action: 'Get item vendor details' },
    ],
    default: 'getAll',
  },
];

export const itemFields: INodeProperties[] = [
  // Inventory ID for get, update, delete
  {
    displayName: 'Inventory ID',
    name: 'inventoryId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['get', 'update', 'delete', 'getAvailability', 'getWarehouses', 'getVendorDetails'],
      },
    },
    default: '',
    description: 'The item SKU/identifier',
  },
  // Create fields
  {
    displayName: 'Inventory ID',
    name: 'newInventoryId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The unique item SKU/identifier to create',
  },
  {
    displayName: 'Description',
    name: 'description',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Item description',
  },
  {
    displayName: 'Item Class',
    name: 'itemClass',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Item classification category',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Base Unit',
        name: 'baseUnit',
        type: 'string',
        default: 'EA',
        description: 'Base unit of measure (e.g., EA, BOX, CASE)',
      },
      {
        displayName: 'Default Price',
        name: 'defaultPrice',
        type: 'number',
        default: 0,
        description: 'Default selling price',
      },
      {
        displayName: 'Default Warehouse',
        name: 'defaultWarehouse',
        type: 'string',
        default: '',
        description: 'Default warehouse ID',
      },
      {
        displayName: 'Item Status',
        name: 'itemStatus',
        type: 'options',
        options: STATUS_OPTIONS.item,
        default: 'Active',
      },
      {
        displayName: 'Item Type',
        name: 'itemType',
        type: 'options',
        options: [
          { name: 'Finished Good', value: 'FinishedGood' },
          { name: 'Component', value: 'Component' },
          { name: 'Sub Assembly', value: 'SubAssembly' },
          { name: 'Non-Stock', value: 'NonStock' },
        ],
        default: 'FinishedGood',
      },
      {
        displayName: 'Last Cost',
        name: 'lastCost',
        type: 'number',
        default: 0,
      },
      {
        displayName: 'Tax Category',
        name: 'taxCategory',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Weight',
        name: 'weight',
        type: 'number',
        default: 0,
      },
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
        resource: ['item'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Base Unit',
        name: 'baseUnit',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Default Price',
        name: 'defaultPrice',
        type: 'number',
        default: 0,
      },
      {
        displayName: 'Default Warehouse',
        name: 'defaultWarehouse',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Item Class',
        name: 'itemClass',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Item Status',
        name: 'itemStatus',
        type: 'options',
        options: STATUS_OPTIONS.item,
        default: 'Active',
      },
      {
        displayName: 'Tax Category',
        name: 'taxCategory',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Weight',
        name: 'weight',
        type: 'number',
        default: 0,
      },
    ],
  },
  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['getAll'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 500,
    },
    default: 50,
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      { displayName: 'Inventory ID', name: 'InventoryID', type: 'string', default: '' },
      { displayName: 'Item Class', name: 'ItemClass', type: 'string', default: '' },
      { displayName: 'Item Status', name: 'ItemStatus', type: 'options', options: STATUS_OPTIONS.item, default: '' },
    ],
  },
  // Warehouse ID for availability
  {
    displayName: 'Warehouse ID',
    name: 'warehouseId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['item'],
        operation: ['getAvailability'],
      },
    },
    default: '',
    description: 'Filter by specific warehouse (optional)',
  },
  // Simplify option
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['item'],
      },
    },
    default: true,
    description: 'Whether to return a simplified version of the response instead of the raw data',
  },
];

export async function executeItemOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const inventoryId = this.getNodeParameter('newInventoryId', index) as string;
    const description = this.getNodeParameter('description', index) as string;
    const itemClass = this.getNodeParameter('itemClass', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const body: IDataObject = {
      InventoryID: inventoryId,
      Description: description,
      ItemClass: itemClass,
    };

    if (additionalFields.baseUnit) body.BaseUnit = additionalFields.baseUnit;
    if (additionalFields.defaultPrice) body.DefaultPrice = additionalFields.defaultPrice;
    if (additionalFields.defaultWarehouse) body.DefaultWarehouse = additionalFields.defaultWarehouse;
    if (additionalFields.itemStatus) body.ItemStatus = additionalFields.itemStatus;
    if (additionalFields.itemType) body.ItemType = additionalFields.itemType;
    if (additionalFields.lastCost) body.LastCost = additionalFields.lastCost;
    if (additionalFields.taxCategory) body.TaxCategory = additionalFields.taxCategory;
    if (additionalFields.weight) body.Weight = additionalFields.weight;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/StockItem', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/StockItem/${encodeURIComponent(inventoryId)}`,
      undefined,
      { $expand: 'WarehouseDetails,VendorDetails,CrossReferences' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/StockItem', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/StockItem', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      InventoryID: inventoryId,
    };

    if (updateFields.description) body.Description = updateFields.description;
    if (updateFields.itemClass) body.ItemClass = updateFields.itemClass;
    if (updateFields.baseUnit) body.BaseUnit = updateFields.baseUnit;
    if (updateFields.defaultPrice) body.DefaultPrice = updateFields.defaultPrice;
    if (updateFields.defaultWarehouse) body.DefaultWarehouse = updateFields.defaultWarehouse;
    if (updateFields.itemStatus) body.ItemStatus = updateFields.itemStatus;
    if (updateFields.taxCategory) body.TaxCategory = updateFields.taxCategory;
    if (updateFields.weight) body.Weight = updateFields.weight;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/StockItem', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    await acumaticaApiRequest.call(this, 'DELETE', `/StockItem/${encodeURIComponent(inventoryId)}`);
    responseData = { success: true, inventoryId };
  } else if (operation === 'getAvailability') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    const warehouseId = this.getNodeParameter('warehouseId', index, '') as string;

    const query: IDataObject = {
      $expand: 'WarehouseDetails',
    };

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/StockItem/${encodeURIComponent(inventoryId)}`,
      undefined,
      query,
    ) as IDataObject;

    // Filter by warehouse if specified
    if (warehouseId && responseData.WarehouseDetails) {
      const warehouses = responseData.WarehouseDetails as IDataObject[];
      responseData.WarehouseDetails = warehouses.filter(
        (w) => w.WarehouseID === warehouseId || (w.WarehouseID as IDataObject)?.value === warehouseId,
      );
    }
  } else if (operation === 'getWarehouses') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/StockItem/${encodeURIComponent(inventoryId)}`,
      undefined,
      { $expand: 'WarehouseDetails' },
    ) as IDataObject;
    responseData = (responseData.WarehouseDetails as IDataObject[]) || [];
  } else if (operation === 'getVendorDetails') {
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/StockItem/${encodeURIComponent(inventoryId)}`,
      undefined,
      { $expand: 'VendorDetails' },
    ) as IDataObject;
    responseData = (responseData.VendorDetails as IDataObject[]) || [];
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
