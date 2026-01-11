/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS } from '../../utils';

export const customerOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['customer'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new customer', action: 'Create a customer' },
      { name: 'Delete', value: 'delete', description: 'Delete a customer', action: 'Delete a customer' },
      { name: 'Get', value: 'get', description: 'Get a customer', action: 'Get a customer' },
      { name: 'Get Many', value: 'getAll', description: 'Get many customers', action: 'Get many customers' },
      { name: 'Update', value: 'update', description: 'Update a customer', action: 'Update a customer' },
      { name: 'Get Contacts', value: 'getContacts', description: 'Get customer contacts', action: 'Get customer contacts' },
      { name: 'Add Contact', value: 'addContact', description: 'Add a contact to customer', action: 'Add contact to customer' },
      { name: 'Get Locations', value: 'getLocations', description: 'Get customer locations', action: 'Get customer locations' },
      { name: 'Add Location', value: 'addLocation', description: 'Add a location to customer', action: 'Add location to customer' },
      { name: 'Get Open Balances', value: 'getOpenBalances', description: 'Get customer open balances', action: 'Get customer open balances' },
    ],
    default: 'getAll',
  },
];

export const customerFields: INodeProperties[] = [
  // Customer ID for get, update, delete operations
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['get', 'update', 'delete', 'getContacts', 'addContact', 'getLocations', 'addLocation', 'getOpenBalances'],
      },
    },
    default: '',
    description: 'The unique identifier of the customer',
  },
  // Create fields
  {
    displayName: 'Customer Name',
    name: 'customerName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The display name of the customer',
  },
  {
    displayName: 'Customer Class',
    name: 'customerClass',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The classification category for the customer',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Account Reference',
        name: 'accountRef',
        type: 'string',
        default: '',
        description: 'External account reference',
      },
      {
        displayName: 'Billing Address - City',
        name: 'billingCity',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Billing Address - Country',
        name: 'billingCountry',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Billing Address - Line 1',
        name: 'billingAddressLine1',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Billing Address - Line 2',
        name: 'billingAddressLine2',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Billing Address - Postal Code',
        name: 'billingPostalCode',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Billing Address - State',
        name: 'billingState',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Credit Limit',
        name: 'creditLimit',
        type: 'number',
        default: 0,
        description: 'Customer credit limit',
      },
      {
        displayName: 'Currency ID',
        name: 'currencyId',
        type: 'string',
        default: '',
        description: 'Default currency for the customer',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Phone',
        name: 'phone1',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: STATUS_OPTIONS.customer,
        default: 'Active',
      },
      {
        displayName: 'Terms',
        name: 'terms',
        type: 'string',
        default: '',
        description: 'Payment terms ID',
      },
      {
        displayName: 'Tax Zone',
        name: 'taxZone',
        type: 'string',
        default: '',
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
        resource: ['customer'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Account Reference',
        name: 'accountRef',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Credit Limit',
        name: 'creditLimit',
        type: 'number',
        default: 0,
      },
      {
        displayName: 'Currency ID',
        name: 'currencyId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Customer Class',
        name: 'customerClass',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Customer Name',
        name: 'customerName',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Phone',
        name: 'phone1',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: STATUS_OPTIONS.customer,
        default: 'Active',
      },
      {
        displayName: 'Terms',
        name: 'terms',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Tax Zone',
        name: 'taxZone',
        type: 'string',
        default: '',
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
        resource: ['customer'],
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
        resource: ['customer'],
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
        resource: ['customer'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Customer Class',
        name: 'CustomerClass',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Customer ID',
        name: 'CustomerID',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Customer Name',
        name: 'CustomerName',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Status',
        name: 'Status',
        type: 'options',
        options: STATUS_OPTIONS.customer,
        default: '',
      },
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
        resource: ['customer'],
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
        resource: ['customer'],
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
        resource: ['customer'],
        operation: ['addContact'],
      },
    },
    default: {},
    options: [
      { displayName: 'Email', name: 'email', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone1', type: 'string', default: '' },
      { displayName: 'Title', name: 'title', type: 'string', default: '' },
      { displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '' },
    ],
  },
  // Add Location fields
  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['addLocation'],
      },
    },
    default: '',
    description: 'Unique identifier for the location',
  },
  {
    displayName: 'Location Name',
    name: 'locationName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['addLocation'],
      },
    },
    default: '',
  },
  {
    displayName: 'Location Additional Fields',
    name: 'locationAdditionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['addLocation'],
      },
    },
    default: {},
    options: [
      { displayName: 'Address Line 1', name: 'addressLine1', type: 'string', default: '' },
      { displayName: 'Address Line 2', name: 'addressLine2', type: 'string', default: '' },
      { displayName: 'City', name: 'city', type: 'string', default: '' },
      { displayName: 'State', name: 'state', type: 'string', default: '' },
      { displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
      { displayName: 'Country', name: 'country', type: 'string', default: '' },
    ],
  },
  // Simplify option
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['customer'],
      },
    },
    default: true,
    description: 'Whether to return a simplified version of the response instead of the raw data',
  },
];

export async function executeCustomerOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const customerName = this.getNodeParameter('customerName', index) as string;
    const customerClass = this.getNodeParameter('customerClass', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const body: IDataObject = {
      CustomerName: customerName,
      CustomerClass: customerClass,
    };

    // Map additional fields
    if (additionalFields.status) body.Status = additionalFields.status;
    if (additionalFields.terms) body.Terms = additionalFields.terms;
    if (additionalFields.creditLimit) body.CreditLimit = additionalFields.creditLimit;
    if (additionalFields.currencyId) body.CurrencyID = additionalFields.currencyId;
    if (additionalFields.email) body.Email = additionalFields.email;
    if (additionalFields.phone1) body.Phone1 = additionalFields.phone1;
    if (additionalFields.taxZone) body.TaxZone = additionalFields.taxZone;
    if (additionalFields.accountRef) body.AccountRef = additionalFields.accountRef;

    // Billing address
    if (additionalFields.billingAddressLine1 || additionalFields.billingCity) {
      body.MainContact = {
        Address: {
          AddressLine1: additionalFields.billingAddressLine1,
          AddressLine2: additionalFields.billingAddressLine2,
          City: additionalFields.billingCity,
          State: additionalFields.billingState,
          PostalCode: additionalFields.billingPostalCode,
          Country: additionalFields.billingCountry,
        },
      };
    }

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Customer', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Customer/${encodeURIComponent(customerId)}`,
      undefined,
      { $expand: 'MainContact,BillingContact,ShippingContact' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Customer', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Customer', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      CustomerID: customerId,
    };

    if (updateFields.customerName) body.CustomerName = updateFields.customerName;
    if (updateFields.customerClass) body.CustomerClass = updateFields.customerClass;
    if (updateFields.status) body.Status = updateFields.status;
    if (updateFields.terms) body.Terms = updateFields.terms;
    if (updateFields.creditLimit) body.CreditLimit = updateFields.creditLimit;
    if (updateFields.currencyId) body.CurrencyID = updateFields.currencyId;
    if (updateFields.email) body.Email = updateFields.email;
    if (updateFields.phone1) body.Phone1 = updateFields.phone1;
    if (updateFields.taxZone) body.TaxZone = updateFields.taxZone;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Customer', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    await acumaticaApiRequest.call(this, 'DELETE', `/Customer/${encodeURIComponent(customerId)}`);
    responseData = { success: true, customerId };
  } else if (operation === 'getContacts') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Customer/${encodeURIComponent(customerId)}`,
      undefined,
      { $expand: 'Contacts' },
    ) as IDataObject;
    responseData = (responseData.Contacts as IDataObject[]) || [];
  } else if (operation === 'addContact') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    const firstName = this.getNodeParameter('contactFirstName', index) as string;
    const lastName = this.getNodeParameter('contactLastName', index) as string;
    const contactFields = this.getNodeParameter('contactAdditionalFields', index) as IDataObject;

    const body: IDataObject = {
      CustomerID: customerId,
      Contacts: [
        {
          FirstName: firstName,
          LastName: lastName,
          Email: contactFields.email,
          Phone1: contactFields.phone1,
          Title: contactFields.title,
          JobTitle: contactFields.jobTitle,
        },
      ],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Customer', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'getLocations') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Customer/${encodeURIComponent(customerId)}`,
      undefined,
      { $expand: 'Locations' },
    ) as IDataObject;
    responseData = (responseData.Locations as IDataObject[]) || [];
  } else if (operation === 'addLocation') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    const locationId = this.getNodeParameter('locationId', index) as string;
    const locationName = this.getNodeParameter('locationName', index) as string;
    const locationFields = this.getNodeParameter('locationAdditionalFields', index) as IDataObject;

    const body: IDataObject = {
      CustomerID: customerId,
      Locations: [
        {
          LocationID: locationId,
          LocationName: locationName,
          Address: {
            AddressLine1: locationFields.addressLine1,
            AddressLine2: locationFields.addressLine2,
            City: locationFields.city,
            State: locationFields.state,
            PostalCode: locationFields.postalCode,
            Country: locationFields.country,
          },
        },
      ],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/Customer', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'getOpenBalances') {
    const customerId = this.getNodeParameter('customerId', index) as string;
    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/Customer/${encodeURIComponent(customerId)}`,
      undefined,
      { $select: 'CustomerID,CustomerName,Balance,ConsolidatedBalance,PrepaymentBalance' },
    ) as IDataObject;
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
