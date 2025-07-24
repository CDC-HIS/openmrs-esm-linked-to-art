import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { fetchIdentifiers } from '../api/api';
import { launchWorkspace } from '@openmrs/esm-framework';

const LinkPatient = ({ patientUuid }) => {
  const { t } = useTranslation();
  const [hasMRN, setHasMRN] = useState(false);
  const [hasUAN, setHasUAN] = useState(false);

  useEffect(() => {
    const checkIdentifiers = async () => {
      const identifiers = await fetchIdentifiers(patientUuid);

      if (identifiers) {
        setHasMRN(identifiers.some((e) => e.identifierType.display === 'MRN'));
        setHasUAN(identifiers.some((e) => e.identifierType.display === 'UAN'));
      }
    };

    checkIdentifiers();
  }, [patientUuid]); // Dependency array ensures this effect runs only when `patientUuid` changes

  const handleLaunchModal = useCallback(() => launchWorkspace('link-patient-workspace-form'), []);

  return (
    <OverflowMenuItem
      itemText={t('linkPatient', 'Link patient')}
      onClick={handleLaunchModal}
      disabled={!hasUAN} // Disable if UAN is not present
    />
  );
};

export default LinkPatient;
