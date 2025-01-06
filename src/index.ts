import { getAsyncLifecycle, defineConfigSchema, getSyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
//import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { createDashboardLink } from './createDashboardLink.component';
import { dashboardMeta } from './dashboard.meta';
import LinkedToART from './linked-to-art/linked-to-art.component';

const moduleName = '@openmrs/esm-linked-to-art-app';

const options = {
  featureName: 'linked-to-art',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}
const pathArray = location.pathname.split('/home');
const lastElement = pathArray[pathArray.length - 1];

export const linkedToArtDashboardLink = getSyncLifecycle(
  createDashboardLink({
    ...dashboardMeta,
  }),
  options,
);

export const root = getAsyncLifecycle(() => import('./linked-to-art/linked-to-art.component'), options);
export const linkedtoart = getSyncLifecycle(LinkedToART, options);

export const encounterDeleteConfirmationDialog = getAsyncLifecycle(() => import('./utils/Delete-Encounter.modal'), {
  featureName: 'encounters',
  moduleName: '@openmrs/esm-patient-encounters-app',
});
