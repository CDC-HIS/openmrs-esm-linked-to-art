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

    const patients = data.results || [];

    return patients.map((detail: any) => ({
      id: detail.patientId,
      patientUUID: detail.patientUuid,
      name: `${detail.givenName} ${detail.middleName || ''} ${detail.familyName}`.trim(),
      linkedDate: detail.linkedDate,
      gender: detail.gender,
      birthDate: detail.birthDate,
      identifier: detail.identifier,
      mrn: '--',
    }));
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return [];
  }
}

export const fetchVisitTypes = async () => {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/visittype`);
    return response.data.results.map((item: { display: string; uuid: string }) => ({
      display: item.display,
      uuid: item.uuid,
    }));
  } catch (error) {
    console.error('Error fetching visit types:', error);
    throw error;
  }
};

export function savePatientLinkage(abortController: AbortController, payload: any) {
  // Construct the URL based on whether a UUID is provided
  const url = `${restBaseUrl}/bahmnilinkedpatient`;

  // Make the API request
  return openmrsFetch(url, {
    headers: {
      'Content-Type': 'application/json', // Set the appropriate Content-Type
    },
    method: 'POST', // Use PUT for updates and POST for creation
    body: JSON.stringify(payload), // Convert the payload to a JSON string
    signal: abortController.signal, // Handle abort signal
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to save VL Test Request Result: ${response.statusText}`);
      }
      return response.json();
    })
    .catch((err) => {
      console.error('Error saving VL Test Request Result:', err);
      throw err;
    });
}

export function fetchIdentifiers(patientUUID) {
  return openmrsFetch(`${restBaseUrl}/patient/${patientUUID}/identifier`).then(({ data }) => {
    return data.results;
  });
}

export function fetchPatientLinkage(patientUUID: string) {
  return openmrsFetch(`${restBaseUrl}/bahmnilinkedpatient/${patientUUID}`)
    .then(({ data }) => {
      return data; // Return the full array of records
    })
    .catch((error) => {
      console.error('Error fetching patient linkage:', error);
      throw error;
    });
}
