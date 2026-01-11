/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import {
	acumaticaApiRequest,
	acumaticaApiRequestAllItems,
	buildODataFilter,
	buildRequestBody,
} from '../../transport';
import { prepareOutput, showLicenseNotice } from '../../utils/helpers';

export const businessAccountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['businessAccount'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new business account',
				action: 'Create a business account',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a business account',
				action: 'Delete a business account',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a business account by ID',
				action: 'Get a business account',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many business accounts',
				action: 'Get many business accounts',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a business account',
				action: 'Update a business account',
			},
			{
				name: 'Get Contacts',
				value: 'getContacts',
				description: 'Get contacts for a business account',
				action: 'Get contacts for a business account',
			},
			{
				name: 'Get Opportunities',
				value: 'getOpportunities',
				description: 'Get opportunities for a business account',
				action: 'Get opportunities for a business account',
			},
			{
				name: 'Get Cases',
				value: 'getCases',
				description: 'Get support cases for a business account',
				action: 'Get cases for a business account',
			},
			{
				name: 'Get Activities',
				value: 'getActivities',
				description: 'Get activities for a business account',
				action: 'Get activities for a business account',
			},
			{
				name: 'Convert',
				value: 'convert',
				description: 'Convert business account to customer or vendor',
				action: 'Convert a business account',
			},
		],
		default: 'get',
	},
];

export const businessAccountFields: INodeProperties[] = [
	// ----------------------------------
	//         businessAccount: create
	// ----------------------------------
	{
		displayName: 'Business Account ID',
		name: 'businessAccountId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['create'],
			},
		},
		description: 'The unique identifier for the business account',
	},
	{
		displayName: 'Account Name',
		name: 'accountName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['create'],
			},
		},
		description: 'The name of the business account',
	},
	{
		displayName: 'Account Type',
		name: 'accountType',
		type: 'options',
		required: true,
		default: 'Prospect',
		options: [
			{ name: 'Customer', value: 'Customer' },
			{ name: 'Vendor', value: 'Vendor' },
			{ name: 'Combined', value: 'Combined' },
			{ name: 'Prospect', value: 'Prospect' },
		],
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['create'],
			},
		},
		description: 'The type of business account',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Account Class',
				name: 'accountClass',
				type: 'string',
				default: '',
				description: 'The classification of the business account',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'Active' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Inactive', value: 'Inactive' },
				],
				default: 'Active',
				description: 'The status of the business account',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'Account owner employee ID',
			},
			{
				displayName: 'Parent Account',
				name: 'parentAccount',
				type: 'string',
				default: '',
				description: 'Parent business account ID',
			},
			{
				displayName: 'Primary Contact',
				name: 'primaryContact',
				type: 'string',
				default: '',
				description: 'Primary contact ID for the account',
			},
			{
				displayName: 'Phone 1',
				name: 'phone1',
				type: 'string',
				default: '',
				description: 'Primary phone number',
			},
			{
				displayName: 'Phone 2',
				name: 'phone2',
				type: 'string',
				default: '',
				description: 'Secondary phone number',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Email address',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
			},
			{
				displayName: 'Address Line 1',
				name: 'addressLine1',
				type: 'string',
				default: '',
				description: 'Address line 1',
			},
			{
				displayName: 'Address Line 2',
				name: 'addressLine2',
				type: 'string',
				default: '',
				description: 'Address line 2',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				description: 'City name',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				description: 'State or province',
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
				description: 'Postal or ZIP code',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country code',
			},
			{
				displayName: 'Source Campaign',
				name: 'sourceCampaign',
				type: 'string',
				default: '',
				description: 'Marketing campaign source',
			},
			{
				displayName: 'Workgroup',
				name: 'workgroup',
				type: 'string',
				default: '',
				description: 'Assigned workgroup',
			},
		],
	},

	// ----------------------------------
	//         businessAccount: get
	// ----------------------------------
	{
		displayName: 'Business Account ID',
		name: 'businessAccountId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['get', 'delete', 'getContacts', 'getOpportunities', 'getCases', 'getActivities', 'convert'],
			},
		},
		description: 'The unique identifier of the business account',
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['get', 'getAll', 'getContacts', 'getOpportunities', 'getCases', 'getActivities'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//         businessAccount: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Account Class',
				name: 'accountClass',
				type: 'string',
				default: '',
				description: 'Filter by account class',
			},
			{
				displayName: 'Account Type',
				name: 'accountType',
				type: 'options',
				options: [
					{ name: 'Customer', value: 'Customer' },
					{ name: 'Vendor', value: 'Vendor' },
					{ name: 'Combined', value: 'Combined' },
					{ name: 'Prospect', value: 'Prospect' },
				],
				default: 'Prospect',
				description: 'Filter by account type',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'Active' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Inactive', value: 'Inactive' },
				],
				default: 'Active',
				description: 'Filter by status',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'Filter by owner employee ID',
			},
		],
	},

	// ----------------------------------
	//         businessAccount: update
	// ----------------------------------
	{
		displayName: 'Business Account ID',
		name: 'businessAccountId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['update'],
			},
		},
		description: 'The unique identifier of the business account to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Account Name',
				name: 'accountName',
				type: 'string',
				default: '',
				description: 'The name of the business account',
			},
			{
				displayName: 'Account Type',
				name: 'accountType',
				type: 'options',
				options: [
					{ name: 'Customer', value: 'Customer' },
					{ name: 'Vendor', value: 'Vendor' },
					{ name: 'Combined', value: 'Combined' },
					{ name: 'Prospect', value: 'Prospect' },
				],
				default: 'Prospect',
				description: 'The type of business account',
			},
			{
				displayName: 'Account Class',
				name: 'accountClass',
				type: 'string',
				default: '',
				description: 'The classification of the business account',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'Active' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Inactive', value: 'Inactive' },
				],
				default: 'Active',
				description: 'The status of the business account',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'Account owner employee ID',
			},
			{
				displayName: 'Primary Contact',
				name: 'primaryContact',
				type: 'string',
				default: '',
				description: 'Primary contact ID for the account',
			},
			{
				displayName: 'Phone 1',
				name: 'phone1',
				type: 'string',
				default: '',
				description: 'Primary phone number',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Email address',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website URL',
			},
		],
	},

	// ----------------------------------
	//         businessAccount: convert
	// ----------------------------------
	{
		displayName: 'Convert To',
		name: 'convertTo',
		type: 'options',
		required: true,
		default: 'Customer',
		options: [
			{ name: 'Customer', value: 'Customer' },
			{ name: 'Vendor', value: 'Vendor' },
		],
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['convert'],
			},
		},
		description: 'What to convert the business account to',
	},
	{
		displayName: 'Conversion Options',
		name: 'conversionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['businessAccount'],
				operation: ['convert'],
			},
		},
		options: [
			{
				displayName: 'Customer Class',
				name: 'customerClass',
				type: 'string',
				default: '',
				description: 'Customer class for conversion to customer',
			},
			{
				displayName: 'Vendor Class',
				name: 'vendorClass',
				type: 'string',
				default: '',
				description: 'Vendor class for conversion to vendor',
			},
		],
	},
];

export async function executeBusinessAccount(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	showLicenseNotice();

	let responseData: IDataObject | IDataObject[];
	const simplify = this.getNodeParameter('simplify', i, true) as boolean;

	if (operation === 'create') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const accountName = this.getNodeParameter('accountName', i) as string;
		const accountType = this.getNodeParameter('accountType', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const body: IDataObject = {
			BusinessAccountID: { value: businessAccountId },
			BusinessAccountName: { value: accountName },
			Type: { value: accountType },
		};

		if (additionalFields.accountClass) {
			body.ClassID = { value: additionalFields.accountClass };
		}
		if (additionalFields.status) {
			body.Status = { value: additionalFields.status };
		}
		if (additionalFields.owner) {
			body.Owner = { value: additionalFields.owner };
		}
		if (additionalFields.parentAccount) {
			body.ParentAccount = { value: additionalFields.parentAccount };
		}
		if (additionalFields.primaryContact) {
			body.PrimaryContact = { value: additionalFields.primaryContact };
		}
		if (additionalFields.phone1) {
			body.Phone1 = { value: additionalFields.phone1 };
		}
		if (additionalFields.phone2) {
			body.Phone2 = { value: additionalFields.phone2 };
		}
		if (additionalFields.email) {
			body.Email = { value: additionalFields.email };
		}
		if (additionalFields.website) {
			body.Web = { value: additionalFields.website };
		}

		// Handle address fields
		if (additionalFields.addressLine1 || additionalFields.city || additionalFields.state ||
			additionalFields.postalCode || additionalFields.country) {
			body.Address = {
				AddressLine1: additionalFields.addressLine1 ? { value: additionalFields.addressLine1 } : undefined,
				AddressLine2: additionalFields.addressLine2 ? { value: additionalFields.addressLine2 } : undefined,
				City: additionalFields.city ? { value: additionalFields.city } : undefined,
				State: additionalFields.state ? { value: additionalFields.state } : undefined,
				PostalCode: additionalFields.postalCode ? { value: additionalFields.postalCode } : undefined,
				Country: additionalFields.country ? { value: additionalFields.country } : undefined,
			};
		}

		if (additionalFields.sourceCampaign) {
			body.SourceCampaign = { value: additionalFields.sourceCampaign };
		}
		if (additionalFields.workgroup) {
			body.Workgroup = { value: additionalFields.workgroup };
		}

		responseData = await acumaticaApiRequest.call(this, 'PUT', '/BusinessAccount', body);
	} else if (operation === 'get') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const query: IDataObject = {
			$filter: `BusinessAccountID eq '${businessAccountId}'`,
			$expand: 'Contacts,Attributes',
		};

		const response = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		responseData = Array.isArray(response) && response.length > 0 ? response[0] : response;
	} else if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;

		const query: IDataObject = {};

		// Build filter string
		const filterParts: string[] = [];
		if (filters.accountClass) {
			filterParts.push(`ClassID eq '${filters.accountClass}'`);
		}
		if (filters.accountType) {
			filterParts.push(`Type eq '${filters.accountType}'`);
		}
		if (filters.status) {
			filterParts.push(`Status eq '${filters.status}'`);
		}
		if (filters.owner) {
			filterParts.push(`Owner eq '${filters.owner}'`);
		}

		if (filterParts.length > 0) {
			query.$filter = filterParts.join(' and ');
		}

		if (returnAll) {
			responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/BusinessAccount', {}, query);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			query.$top = limit;
			responseData = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		}
	} else if (operation === 'update') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

		const body: IDataObject = {
			BusinessAccountID: { value: businessAccountId },
		};

		if (updateFields.accountName) {
			body.BusinessAccountName = { value: updateFields.accountName };
		}
		if (updateFields.accountType) {
			body.Type = { value: updateFields.accountType };
		}
		if (updateFields.accountClass) {
			body.ClassID = { value: updateFields.accountClass };
		}
		if (updateFields.status) {
			body.Status = { value: updateFields.status };
		}
		if (updateFields.owner) {
			body.Owner = { value: updateFields.owner };
		}
		if (updateFields.primaryContact) {
			body.PrimaryContact = { value: updateFields.primaryContact };
		}
		if (updateFields.phone1) {
			body.Phone1 = { value: updateFields.phone1 };
		}
		if (updateFields.email) {
			body.Email = { value: updateFields.email };
		}
		if (updateFields.website) {
			body.Web = { value: updateFields.website };
		}

		responseData = await acumaticaApiRequest.call(this, 'PUT', '/BusinessAccount', body);
	} else if (operation === 'delete') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;

		// First get the record to obtain the internal ID
		const query: IDataObject = {
			$filter: `BusinessAccountID eq '${businessAccountId}'`,
		};
		const existing = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		const record = Array.isArray(existing) && existing.length > 0 ? existing[0] : existing as IDataObject;

		if (record && (record as IDataObject).id) {
			await acumaticaApiRequest.call(this, 'DELETE', `/BusinessAccount/${(record as IDataObject).id}`);
			responseData = { success: true, businessAccountId };
		} else {
			throw new Error(`Business account '${businessAccountId}' not found`);
		}
	} else if (operation === 'getContacts') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const query: IDataObject = {
			$filter: `BusinessAccountID eq '${businessAccountId}'`,
			$expand: 'Contacts',
		};

		const response = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		const record = (Array.isArray(response) && response.length > 0 ? response[0] : response) as IDataObject;
		responseData = (record?.Contacts as IDataObject[]) || [];
	} else if (operation === 'getOpportunities') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const query: IDataObject = {
			$filter: `BusinessAccount eq '${businessAccountId}'`,
		};

		responseData = await acumaticaApiRequest.call(this, 'GET', '/Opportunity', {}, query);
	} else if (operation === 'getCases') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const query: IDataObject = {
			$filter: `BusinessAccount eq '${businessAccountId}'`,
		};

		responseData = await acumaticaApiRequest.call(this, 'GET', '/Case', {}, query);
	} else if (operation === 'getActivities') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const query: IDataObject = {
			$filter: `BusinessAccountID eq '${businessAccountId}'`,
			$expand: 'Activities',
		};

		const response = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		const record = (Array.isArray(response) && response.length > 0 ? response[0] : response) as IDataObject;
		responseData = (record?.Activities as IDataObject[]) || [];
	} else if (operation === 'convert') {
		const businessAccountId = this.getNodeParameter('businessAccountId', i) as string;
		const convertTo = this.getNodeParameter('convertTo', i) as string;
		const conversionOptions = this.getNodeParameter('conversionOptions', i) as IDataObject;

		// Get existing business account
		const query: IDataObject = {
			$filter: `BusinessAccountID eq '${businessAccountId}'`,
		};
		const existing = await acumaticaApiRequest.call(this, 'GET', '/BusinessAccount', {}, query);
		const record = (Array.isArray(existing) && existing.length > 0 ? existing[0] : existing) as IDataObject;

		if (!record) {
			throw new Error(`Business account '${businessAccountId}' not found`);
		}

		if (convertTo === 'Customer') {
			// Create customer from business account
			const businessName = record.BusinessAccountName as IDataObject | undefined;
			const customerBody: IDataObject = {
				CustomerID: { value: businessAccountId },
				CustomerName: { value: businessName?.value || businessAccountId },
			};

			if (conversionOptions.customerClass) {
				customerBody.CustomerClass = { value: conversionOptions.customerClass };
			}

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Customer', customerBody);
		} else {
			// Create vendor from business account
			const businessName = record.BusinessAccountName as IDataObject | undefined;
			const vendorBody: IDataObject = {
				VendorID: { value: businessAccountId },
				VendorName: { value: businessName?.value || businessAccountId },
			};

			if (conversionOptions.vendorClass) {
				vendorBody.VendorClass = { value: conversionOptions.vendorClass };
			}

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Vendor', vendorBody);
		}
	} else {
		throw new Error(`Operation '${operation}' is not supported for BusinessAccount resource`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
