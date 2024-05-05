import * as path from 'path';
import * as core from '@actions/core';
import * as fs from 'fs';
import {getConfig} from './config';

const run = async (): Promise<void> => {
  const runnerDir: string = process.env['RUNNER_TEMP'] || '';
  const kubeconfPath: string = path.join(
      runnerDir,
      `conf_${Date.now()}`,
  );

  const kubeconfig: string = await getConfig();

  core.debug(`Writing kubeconfig to ${kubeconfPath}`);
  fs.writeFileSync(kubeconfPath, kubeconfig);
  fs.chmodSync(kubeconfPath, '600');
  core.exportVariable('KUBECONFIG', kubeconfPath);
};
run();
