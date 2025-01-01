import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';


export function fetchLocation() {
  return openmrsFetch(`${restBaseUrl}/location?q=&v=default`);
}

export async function getPatientInfo(patientUuid: string) {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/patient/${patientUuid}?v=full`);
    const data = await response.data;

    return data;
  } catch (error) {
    console.error('Error fetching patient emergency contact:', error);
    return null;
  }
}

export function getPatientEncounters(patientUUID, encounterUUID) {
  //This function fetches the first two encounters for a given patient. You can remove the limit and also the "v=full"
  return openmrsFetch(
    `${restBaseUrl}/encounter?encounterType=${encounterUUID}&patient=${patientUUID}&v=full&limit=5`,
  ).then(({ data }) => {
    return data.results;
  });
}

export async function fetchPatientData() {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/artlinkedpatients`);
    const data = await response.json(); // Correctly parse the JSON response
    console.log('Fetched data:', data); // Log the fetched data

    const patients = data.results || [];

    return patients.map((detail: any) => ({
      id: detail.patientId,
      patientUUID: detail.patientUuid,
      name: `${detail.givenName} ${detail.middleName || ''} ${detail.familyName}`.trim(),
      linkedDate: detail.linkedDate,
      gender: detail.gender,
      birthDate: detail.birthDate,
      identifier: detail.identifier,
      status: 'Active',
    }));
    
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return [];
  }
}
