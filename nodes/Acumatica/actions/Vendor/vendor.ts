/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS } from '../../utils';

export const vendorOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new vendor', action: 'Create a vendor' },
      { name: 'Delete', value: 'delete', description: 'Delete a vendor', action: 'Delete a vendor' },
      { name: 'Get', value: 'get', description: 'Get a vendor', action: 'Get a vendor' },
      { name: 'Get Many', value: 'getAll', description: 'Get many vendors', action: 'Get many vendors' },
      { name: 'Update', value: 'update', description: 'Update a vendor', action: 'Update a vendor' },
      { name: 'Get Contacts', value: 'getContacts', description: 'Get vendor contacts', action: 'Get vendor contacts' },
      { name: 'Add Contact', value: 'addContact', description: 'Add vendor contact', action: 'Add vendor contact' },
      { name: 'Get Open Balance', value: 'getOpenBalance', description: 'Get vendor open balance', action: 'Get vendor open balance' },
    ],
    default: 'getAll',
  },
];

export const vendorFields: INodeProperties[] = [
  // Vendor ID
  {
    displayName: 'Vendor ID',
    name: 'vendorId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['get', 'update', 'delete', 'getContacts', 'addContact', 'getOpenBalance'],
      },
    },
    default: '',
  },
  // Create fields
  {
    displayName: 'Vendor Name',
    name: 'vendorName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['create'],
      },
    },
    default: '',
  },
  {
    displayName: 'Vendor Class',
    name: 'vendorClass',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['create'],
      },
    },
    default: '',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      { displayName: 'Account Reference', name: 'accountRef', type: 'string', default: '' },
      { displayName: 'Currency ID', name: 'currencyId', type: 'string', default: '' },
      { displayName: 'Email', name: 'email', type: 'string', default: '' },
      { displayName: 'Payment Method', name: 'paymentMethod', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone1', type: 'string', default: '' },
      { displayName: 'Status', name: 'status', type: 'options', options: STATUS_OPTIONS.vendor, default: 'Active' },
      { displayName: 'Tax Zone', name: 'taxZone', type: 'string', default: '' },
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
        resource: ['vendor'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      { displayName: 'Account Reference', name: 'accountRef', type: 'string', default: '' },
      { displayName: 'Currency ID', name: 'currencyId', type: 'string', default: '' },
      { displayName: 'Email', name: 'email', type: 'string', default: '' },
      { displayName: 'Payment Method', name: 'paymentMethod', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone1', type: 'string', default: '' },
      { displayName: 'Status', name: 'status', type: 'options', options: STATUS_OPTIONS.vendor, default: 'Active' },
      { displayName: 'Tax Zone', name: 'taxZone', type: 'string', default: '' },
      { displayName: 'Terms', name: 'terms', type: 'string', default: '' },
      { displayName: 'Vendor Class', name: 'vendorClass', type: 'string', default: '' },
      { displayName: 'Vendor Name', name: 'vendorName', type: 'string', default: '' },
    ],
  },
  // Add Contact fields
  {
    displayName: 'Contact First Name',
    name: 'contactFirstName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['addContact'],
      },
    },
    default: '',
  },
  {
    displayName: 'Contact Last Name',
    name: 'contactLastName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['addContact'],
      },
    },
    default: '',
  },
  {
    displayName: 'Contact Additional Fields',
    name: 'contactAdditionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['vendor'],
        operation: ['addContact'],
      },
    },
    default: {},
    options: [
      { displayName: 'Email', name: 'email', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone1', type: 'string', default: '' },
      { displayName: 'Title', name: 'title', type: 'string', default: '' },
    ],
  },
  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['vendor'],
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
        resource: ['vendor'],
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
        resource: ['vendor'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      { displayName: 'Status', name: 'Status', type: 'options', options: STATUS_OPTIONS.vendor, default: '' },
      { displayName: 'Vendor Class', name: 'VendorClass', type: 'string', default: '' },
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
        resource: ['vendor'],
      },
    },
    default: true,
  },
];

export async function executeVendorOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const vendorName = this.getNodeParameter('vendorName', index) as string;
    const vendorClass = this.getNodeParameter('vendorClass', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const body: IDataObject = {
      VendorName: vendorName,
      VendorClass: vendorClass,
    };

    if (additionalFields.accountRef) body.AccountRef = additionalFields.accountRef;
    if (additionalFields.currencyId) body.CurrencyID = additionalFields.currencyId;
    if (additionalFields.email) body.Email = additionalFields.email;
    if (additionalFields.paymentMethod) body.PaymentMethod = additionalFields.paymentMethod;
    if (additionalFields.phone1) body.Phone1 = additionalFields.phone1;
    if (additionalFields.status) body.Status = additionalFields.status;
    if (additionalFields.taxZone) body.TaxZone = additionalFields.taxZone;
    if (additionalFields.terms) body.Terms = additionalFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Vendor', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Vendor/${encodeURIComponent(vendorId)}`,
      undefined,
      { $expand: 'MainContact,Contacts,Locations' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Vendor', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Vendor', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      VendorID: vendorId,
    };

    if (updateFields.vendorName) body.VendorName = updateFields.vendorName;
    if (updateFields.vendorClass) body.VendorClass = updateFields.vendorClass;
    if (updateFields.accountRef) body.AccountRef = updateFields.accountRef;
    if (updateFields.currencyId) body.CurrencyID = updateFields.currencyId;
    if (updateFields.email) body.Email = updateFields.email;
    if (updateFields.paymentMethod) body.PaymentMethod = updateFields.paymentMethod;
    if (updateFields.phone1) body.Phone1 = updateFields.phone1;
    if (updateFields.status) body.Status = updateFields.status;
    if (updateFields.taxZone) body.TaxZone = updateFields.taxZone;
    if (updateFields.terms) body.Terms = updateFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Vendor', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    await acumaticaApiRequest.call(this, 'DELETE', `/Vendor/${encodeURIComponent(vendorId)}`);
    responseData = { success: true, vendorId };
  } else if (operation === 'getContacts') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Vendor/${encodeURIComponent(vendorId)}`,
      undefined,
      { $expand: 'Contacts' },
    ) as IDataObject;
    responseData = (responseData.Contacts as IDataObject[]) || [];
  } else if (operation === 'addContact') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    const firstName = this.getNodeParameter('contactFirstName', index) as string;
    const lastName = this.getNodeParameter('contactLastName', index) as string;
    const contactFields = this.getNodeParameter('contactAdditionalFields', index) as IDataObject;

    const body: IDataObject = {
      VendorID: vendorId,
      Contacts: [
        {
          FirstName: firstName,
          LastName: lastName,
          Email: contactFields.email,
          Phone1: contactFields.phone1,
          Title: contactFields.title,
        },
      ],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Vendor', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'getOpenBalance') {
    const vendorId = this.getNodeParameter('vendorId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Vendor/${encodeURIComponent(vendorId)}`,
      undefined,
      { $select: 'VendorID,VendorName,Balance,PrepaymentBalance' },
    ) as IDataObject;
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
