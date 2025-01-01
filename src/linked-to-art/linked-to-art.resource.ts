import { openmrsFetch, restBaseUrl } from "@openmrs/esm-framework";
import { type OpenmrsEncounter } from "../types";
import useSWR from 'swr';

type UseEncounters = {
    encounters: Array<OpenmrsEncounter>;
    isError: Error | null;
    isLoading: boolean;
    isValidating: boolean;
    mutate: () => void;
  };


export function useEncounters(patientUuid: string, encounterType): UseEncounters {
    
  
    const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: { results: Array<OpenmrsEncounter> } }, Error>(
      patientUuid ? null : null,
      openmrsFetch,
    );
  
  
    return {
      encounters: data? data?.data.results: [],
      isError: error,
      isLoading,
      isValidating,
      mutate,
    };
  }


