/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems } from '../../transport';
import { prepareOutput } from '../../utils/helpers';

export const genericInquiryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['genericInquiry'],
			},
		},
		options: [
			{
				name: 'Execute',
				value: 'execute',
				description: 'Execute a generic inquiry',
				action: 'Execute a generic inquiry',
			},
			{
				name: 'Get Schema',
				value: 'getSchema',
				description: 'Get the schema/fields of a generic inquiry',
				action: 'Get generic inquiry schema',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List available generic inquiries',
				action: 'List generic inquiries',
			},
		],
		default: 'execute',
	},
];

export const genericInquiryFields: INodeProperties[] = [
	// ----------------------------------
	//         genericInquiry: execute
	// ----------------------------------
	{
		displayName: 'Inquiry Name',
		name: 'inquiryName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['genericInquiry'],
				operation: ['execute', 'getSchema'],
			},
		},
		default: '',
		description: 'Name of the generic inquiry to execute (e.g., "CustomerList", "ItemAvailability")',
	},
	{
		displayName: 'Parameters',
		name: 'parameters',
		type: 'fixedCollection',
		placeholder: 'Add Parameter',
		default: {},
		displayOptions: {
			show: {
				resource: ['genericInquiry'],
				operation: ['execute'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'parameter',
				displayName: 'Parameter',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Parameter name as defined in the inquiry',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Parameter value',
					},
				],
			},
		],
		description: 'Parameters to pass to the generic inquiry',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['genericInquiry'],
				operation: ['execute'],
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
				resource: ['genericInquiry'],
				operation: ['execute'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
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
				resource: ['genericInquiry'],
				operation: ['execute'],
			},
		},
		options: [
			{
				displayName: 'Filter Expression',
				name: 'filter',
				type: 'string',
				default: '',
				description: 'OData filter expression (e.g., "CustomerID eq \'ABCCORP\'")',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: '',
				description: 'Field to sort results by (e.g., "CustomerName asc")',
			},
			{
				displayName: 'Select Fields',
				name: 'select',
				type: 'string',
				default: '',
				description: 'Comma-separated list of fields to return',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['genericInquiry'],
				operation: ['execute', 'getSchema', 'list'],
			},
		},
		options: [
			{
				displayName: 'Simplify Response',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response',
			},
		],
	},
];

export async function executeGenericInquiryOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const options = this.getNodeParameter('options', index, {}) as {
		simplify?: boolean;
	};
	const simplify = options.simplify !== false;

	let responseData: IDataObject | IDataObject[] = {};

	switch (operation) {
		case 'execute': {
			const inquiryName = this.getNodeParameter('inquiryName', index) as string;
			const returnAll = this.getNodeParameter('returnAll', index) as boolean;
			const parametersData = this.getNodeParameter('parameters', index, {}) as {
				parameter?: Array<{ name: string; value: string }>;
			};
			const filters = this.getNodeParameter('filters', index, {}) as Record<string, string>;

			// Build the endpoint path for the generic inquiry
			const endpoint = `/${encodeURIComponent(inquiryName)}`;

			// Build query string
			const qs: IDataObject = {};

			// Add parameters as query string parameters
			if (parametersData.parameter && parametersData.parameter.length > 0) {
				for (const param of parametersData.parameter) {
					if (param.name && param.value !== undefined) {
						qs[param.name] = param.value;
					}
				}
			}

			// Add OData filters
			if (filters.filter) {
				qs['$filter'] = filters.filter;
			}
			if (filters.orderBy) {
				qs['$orderby'] = filters.orderBy;
			}
			if (filters.select) {
				qs['$select'] = filters.select;
			}

			if (returnAll) {
				responseData = await acumaticaApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index) as number;
				qs['$top'] = limit;
				responseData = await acumaticaApiRequest.call(this, 'GET', endpoint, {}, qs);
			}
			break;
		}

		case 'getSchema': {
			const inquiryName = this.getNodeParameter('inquiryName', index) as string;

			// Get the metadata/schema for the inquiry
			// Acumatica provides schema through $metadata endpoint or by querying with $top=0
			const endpoint = `/${encodeURIComponent(inquiryName)}`;
			const qs: IDataObject = {
				'$top': 0,
			};

			try {
				// First try to get a single record to understand the schema
				qs['$top'] = 1;
				const schemaResponse = await acumaticaApiRequest.call(this, 'GET', endpoint, {}, qs);

				if (Array.isArray(schemaResponse) && schemaResponse.length > 0) {
					const firstRecord = schemaResponse[0] as IDataObject;
					// Extract field names and types from the first record
					const schema = {
						inquiryName,
						fields: Object.keys(firstRecord).map(field => {
							const fieldVal = firstRecord[field] as IDataObject | undefined;
							return {
								name: field,
								type: typeof fieldVal === 'object' && fieldVal?.value !== undefined
									? typeof fieldVal.value
									: typeof fieldVal,
								hasValue: typeof fieldVal === 'object' && fieldVal?.value !== undefined,
							};
						}),
					};
					responseData = schema as IDataObject;
				} else {
					responseData = {
						inquiryName,
						fields: [],
						message: 'No data available to determine schema',
					};
				}
			} catch (error) {
				responseData = {
					inquiryName,
					error: 'Unable to retrieve schema',
					message: (error as Error).message,
				};
			}
			break;
		}

		case 'list': {
			// List available generic inquiries
			// This is typically done through the $metadata endpoint or a custom endpoint
			// For Acumatica, we'll try to access the root entity endpoint
			try {
				// Try to get the swagger/OData metadata
				const credentials = await this.getCredentials('acumaticaOAuth2Api');
				const instanceUrl = credentials.instanceUrl as string;
				const apiVersion = credentials.apiVersion as string;

				// The $metadata endpoint provides available entities
				responseData = {
					message: 'Generic inquiries are defined in Acumatica under System > Customization > Generic Inquiry',
					metadataUrl: `${instanceUrl}/entity/Default/${apiVersion}/$metadata`,
					swaggerUrl: `${instanceUrl}/entity/swagger.json`,
					commonInquiries: [
						'CustomerList',
						'VendorList',
						'ItemAvailability',
						'SalesOrderList',
						'PurchaseOrderList',
						'InvoiceList',
						'OpenARDocuments',
						'OpenAPDocuments',
						'InventoryAllocation',
						'GLTrialBalance',
					],
					note: 'The actual available inquiries depend on your Acumatica customization. Check your instance for the exact inquiry names.',
				};
			} catch (error) {
				responseData = {
					error: 'Unable to list inquiries',
					message: (error as Error).message,
				};
			}
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for GenericInquiry`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
