/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { Acumatica } from '../../nodes/Acumatica/Acumatica.node';

describe('Acumatica Node', () => {
	let acumatica: Acumatica;

	beforeEach(() => {
		acumatica = new Acumatica();
	});

	describe('Node Description', () => {
		it('should have correct displayName', () => {
			expect(acumatica.description.displayName).toBe('Acumatica');
		});

		it('should have correct name', () => {
			expect(acumatica.description.name).toBe('acumatica');
		});

		it('should have icon defined', () => {
			expect(acumatica.description.icon).toBe('file:acumatica.svg');
		});

		it('should have version 1', () => {
			expect(acumatica.description.version).toBe(1);
		});

		it('should require acumaticaOAuth2Api credentials', () => {
			const credentials = acumatica.description.credentials;
			expect(credentials).toBeDefined();
			expect(credentials?.length).toBe(1);
			expect(credentials?.[0].name).toBe('acumaticaOAuth2Api');
			expect(credentials?.[0].required).toBe(true);
		});
	});

	describe('Resources', () => {
		it('should have all 12 resources defined', () => {
			const resourceProperty = acumatica.description.properties.find(
				(p) => p.name === 'resource'
			);
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');
			
			const options = (resourceProperty as any)?.options;
			expect(options?.length).toBe(12);

			const resourceNames = options?.map((o: any) => o.value);
			expect(resourceNames).toContain('customer');
			expect(resourceNames).toContain('salesOrder');
			expect(resourceNames).toContain('item');
			expect(resourceNames).toContain('invoice');
			expect(resourceNames).toContain('vendor');
			expect(resourceNames).toContain('purchaseOrder');
			expect(resourceNames).toContain('payment');
			expect(resourceNames).toContain('bill');
			expect(resourceNames).toContain('journalTransaction');
			expect(resourceNames).toContain('shipment');
			expect(resourceNames).toContain('genericInquiry');
			expect(resourceNames).toContain('businessAccount');
		});
	});

	describe('Customer Operations', () => {
		it('should have customer operations defined', () => {
			const operations = acumatica.description.properties.filter(
				(p) => p.displayOptions?.show?.resource?.includes('customer') && p.name === 'operation'
			);
			expect(operations.length).toBeGreaterThan(0);
		});
	});

	describe('Sales Order Operations', () => {
		it('should have sales order operations defined', () => {
			const operations = acumatica.description.properties.filter(
				(p) => p.displayOptions?.show?.resource?.includes('salesOrder') && p.name === 'operation'
			);
			expect(operations.length).toBeGreaterThan(0);
		});
	});

	describe('Item Operations', () => {
		it('should have item operations defined', () => {
			const operations = acumatica.description.properties.filter(
				(p) => p.displayOptions?.show?.resource?.includes('item') && p.name === 'operation'
			);
			expect(operations.length).toBeGreaterThan(0);
		});
	});

	describe('Invoice Operations', () => {
		it('should have invoice operations defined', () => {
			const operations = acumatica.description.properties.filter(
				(p) => p.displayOptions?.show?.resource?.includes('invoice') && p.name === 'operation'
			);
			expect(operations.length).toBeGreaterThan(0);
		});
	});
});
