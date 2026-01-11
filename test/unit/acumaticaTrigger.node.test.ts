/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { AcumaticaTrigger } from '../../nodes/Acumatica/AcumaticaTrigger.node';

describe('AcumaticaTrigger Node', () => {
	let trigger: AcumaticaTrigger;

	beforeEach(() => {
		trigger = new AcumaticaTrigger();
	});

	describe('Node Description', () => {
		it('should have correct displayName', () => {
			expect(trigger.description.displayName).toBe('Acumatica Trigger');
		});

		it('should have correct name', () => {
			expect(trigger.description.name).toBe('acumaticaTrigger');
		});

		it('should have icon defined', () => {
			expect(trigger.description.icon).toBe('file:acumatica.svg');
		});

		it('should be in trigger group', () => {
			expect(trigger.description.group).toContain('trigger');
		});

		it('should have no inputs', () => {
			expect(trigger.description.inputs).toEqual([]);
		});

		it('should have version 1', () => {
			expect(trigger.description.version).toBe(1);
		});

		it('should require acumaticaOAuth2Api credentials', () => {
			const credentials = trigger.description.credentials;
			expect(credentials).toBeDefined();
			expect(credentials?.length).toBe(1);
			expect(credentials?.[0].name).toBe('acumaticaOAuth2Api');
		});
	});

	describe('Webhook Configuration', () => {
		it('should have webhook configured', () => {
			expect(trigger.description.webhooks).toBeDefined();
			expect(trigger.description.webhooks?.length).toBe(1);
			expect(trigger.description.webhooks?.[0].name).toBe('default');
			expect(trigger.description.webhooks?.[0].httpMethod).toBe('POST');
		});
	});

	describe('Events', () => {
		it('should have event property defined', () => {
			const eventProperty = trigger.description.properties.find(
				(p) => p.name === 'event'
			);
			expect(eventProperty).toBeDefined();
			expect(eventProperty?.type).toBe('options');
		});

		it('should have all expected events', () => {
			const eventProperty = trigger.description.properties.find(
				(p) => p.name === 'event'
			);
			const options = (eventProperty as any)?.options;
			const eventValues = options?.map((o: any) => o.value);

			expect(eventValues).toContain('customer.created');
			expect(eventValues).toContain('customer.updated');
			expect(eventValues).toContain('salesOrder.created');
			expect(eventValues).toContain('salesOrder.updated');
			expect(eventValues).toContain('salesOrder.shipped');
			expect(eventValues).toContain('invoice.created');
			expect(eventValues).toContain('invoice.released');
			expect(eventValues).toContain('payment.received');
			expect(eventValues).toContain('shipment.confirmed');
			expect(eventValues).toContain('item.updated');
			expect(eventValues).toContain('vendor.created');
			expect(eventValues).toContain('purchaseOrder.created');
			expect(eventValues).toContain('bill.created');
			expect(eventValues).toContain('all');
		});
	});

	describe('Webhook Methods', () => {
		it('should have webhookMethods defined', () => {
			expect(trigger.webhookMethods).toBeDefined();
			expect(trigger.webhookMethods.default).toBeDefined();
		});

		it('should have checkExists method', () => {
			expect(trigger.webhookMethods.default.checkExists).toBeDefined();
			expect(typeof trigger.webhookMethods.default.checkExists).toBe('function');
		});

		it('should have create method', () => {
			expect(trigger.webhookMethods.default.create).toBeDefined();
			expect(typeof trigger.webhookMethods.default.create).toBe('function');
		});

		it('should have delete method', () => {
			expect(trigger.webhookMethods.default.delete).toBeDefined();
			expect(typeof trigger.webhookMethods.default.delete).toBe('function');
		});
	});
});
