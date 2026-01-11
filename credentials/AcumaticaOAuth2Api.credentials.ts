/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class AcumaticaOAuth2Api implements ICredentialType {
  name = 'acumaticaOAuth2Api';
  displayName = 'Acumatica OAuth2 API';
  documentationUrl = 'https://help.acumatica.com/Help?ScreenId=ShowWiki&pageid=4f88abb1-0320-4faf-a3ea-d21da6f1abc4';
  icon = 'file:acumatica.svg' as const;
  
  properties: INodeProperties[] = [
    {
      displayName: 'Instance URL',
      name: 'instanceUrl',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'https://mycompany.acumatica.com',
      description: 'The full URL of your Acumatica instance (without trailing slash)',
    },
    {
      displayName: 'API Version',
      name: 'apiVersion',
      type: 'options',
      default: '24.200.001',
      required: true,
      options: [
        { name: '24.200.001 (Latest)', value: '24.200.001' },
        { name: '23.200.001', value: '23.200.001' },
        { name: '22.200.001', value: '22.200.001' },
        { name: '20.200.001', value: '20.200.001' },
      ],
      description: 'The Acumatica API version to use',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
      description: 'OAuth Client ID from Connected Applications (SM303010) in Acumatica',
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'OAuth Client Secret from Connected Applications',
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
      description: 'The username for the Acumatica API user',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'The password for the Acumatica API user',
    },
    {
      displayName: 'Company Name',
      name: 'companyName',
      type: 'string',
      default: '',
      description: 'Company/Tenant name for multi-tenant instances (leave empty for single-tenant)',
    },
    {
      displayName: 'Branch ID',
      name: 'branchId',
      type: 'string',
      default: '',
      description: 'Branch ID for multi-branch operations (optional)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.instanceUrl}}/entity/Default/{{$credentials.apiVersion}}',
      url: '/Customer',
      method: 'GET',
      qs: {
        $top: 1,
      },
    },
  };
}
