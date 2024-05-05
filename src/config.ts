import * as core from '@actions/core';
import * as jsyaml from 'js-yaml';
import {KubeConfig} from '@kubernetes/client-node';

export const getConfig = async (): Promise<string> => {
  const method = core.getInput('method', {required: true});
  const clusterURL = core.getInput('k8s-url', {required: true});

  if (method === 'service-account') {
    const secretStr: string = core.getInput('k8s-secret', {required: true});
    const parsedSecret: secret = parseSecret(jsyaml.load(secretStr));

    const ca: string = parsedSecret.data['ca.crt'];
    const token: string = Buffer.from(
        parsedSecret.data.token,
        'base64',
    ).toString();
    return createConfig(ca, token, clusterURL);
  } else if (method === 'oidc') {
    const audience: string = core.getInput('audience', {required: false});
    const idtoken = await core.getIDToken(audience);

    let caFile = core.getInput('k8s-ca-file', {required: false});
    if (caFile !== '') {
      if (!caFile.startsWith('/')) {
        caFile = process.env['GITHUB_WORKSPACE'] + '/' + caFile;
      }
      return createConfigFile(caFile, idtoken, clusterURL);
    }
    const caData = core.getInput('k8s-ca', {required: true});
    return createConfig(caData, idtoken, clusterURL);
  }
  throw new Error(`Invalid method: ${method}`);
};

export interface secret {
    data: {
       token: string
       'ca.crt': string
    }
 }

/**
* Parses Kubernetes service account secret
* @param {secret} secret base64 encoded kubernetes service account secret
* @return {secret}
*/
export function parseSecret(secret: any): secret { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!secret) throw Error('missing secret');
  if (!secret.data) throw Error('secret missing data');
  if (!secret.data.token) throw Error('secret missing token');
  if (!secret.data['ca.crt']) throw Error('secret missing ca.crt');

  return secret;
}

/**
* Creates kubeconfig file using ca file and token
* @param {string} caFile path to ca file
* @param {string} token JWT token
* @param {string} clusterURL cluster url
* @return {string} kubeconfig
*/
export function createConfigFile(caFile: string, token: string, clusterURL: string): string {
  const config = new KubeConfig();
  config.loadFromClusterAndUser(
      {
        name: 'default',
        server: clusterURL,
        caFile,
        skipTLSVerify: false,
      },
      {
        name: 'default-user',
        token,
      },
  );
  return config.exportConfig();
}

/**
* Creates kubeconfig file using ca data and token
* @param {string} ca ca data
* @param {string} token JWT token
* @param {string} clusterURL cluster url
* @return {string} kubeconfig
*/
export function createConfig(ca: string, token: string, clusterURL: string): string {
  const config = new KubeConfig();
  config.loadFromClusterAndUser(
      {
        name: 'default',
        server: clusterURL,
        caData: ca,
        skipTLSVerify: false,
      },
      {
        name: 'default-user',
        token,
      },
  );
  return config.exportConfig();
}
