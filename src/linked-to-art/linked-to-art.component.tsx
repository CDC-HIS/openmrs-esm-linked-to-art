import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
} from '@carbon/react';
import { DataTableSkeleton, InlineLoading } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { ConfigurableLink, formatDate, parseDate, useLayoutType, isDesktop } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import styles from './hiv-care-and-treatment.scss';
import { getObsFromEncounter } from '../utils/encounter-utils';
import { EncounterActionMenu } from '../utils/encounter-action-menu';
import { fetchPatientData, getPatientInfo } from '../api/api';

interface HivCareAndTreatmentProps {
  patientUuid: string;
}

const calculateAge = (birthDate: string): string => {
  if (!birthDate) return 'N/A';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} ዓመታት`;
};

const getMRN = async (patientUuid: string): Promise<string> => {
  const patientInfo = await getPatientInfo(patientUuid);
  const mrn = patientInfo?.identifiers?.find((e) => e.identifierType?.display === 'MRN')?.identifier;
  return mrn || '--';
};

const LinkedToART: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const headerTitle = 'Linked to ART';

  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const getPatientData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPatientData();
        const dataWithMRN = await Promise.all(
          data.map(async (patient) => ({
            ...patient,
            mrn: await getMRN(patient.patientUUID), // Fetch MRN for each patient
          })),
        );

        setPatientData(dataWithMRN);
        //setPatientData(data); // Transform data as per table structure
      } catch (error) {
        console.error('Error fetching patient emergency contact:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    };

    getPatientData();
  }, [patientUuid]);

  const tableHeaders = [
    { key: 'linkedDate', header: 'Date linked to ART' },
    { key: 'name', header: 'Patient Name' },
    { key: 'mrn', header: 'MRN' },
    { key: 'gender', header: 'Gender' },
    { key: 'age', header: 'Age' },
  ];

  const tableRows = useMemo(() => {
    if (!patientData || !Array.isArray(patientData)) {
      console.warn('Invalid or empty patientData:', patientData);
      return [];
    }

    return patientData.map((item, index) => ({
      id: item.id || index,
      linkedDate: item.linkedDate ? formatDate(parseDate(item.linkedDate), { mode: 'wide' }) : '--',
      name: item.name || '--',
      mrn: item.mrn || '--',
      gender: item.gender || '--',
      birthDate: item.birthDate ? formatDate(parseDate(item.birthDate), { mode: 'wide' }) : '--',
      age: item.birthDate ? calculateAge(item.birthDate) : '--',
    }));
  }, [patientData]);

  const pageSizes = useMemo(() => {
    const numberOfPages = Math.ceil(tableRows?.length / 100);
    return [...Array(numberOfPages).keys()].map((x) => {
      return (x + 1) * 100;
    });
  }, [tableRows]);

  // Pagination state
  const totalRows = tableRows.length;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = useMemo(
    () => tableRows.slice(indexOfFirstRow, indexOfLastRow),
    [indexOfFirstRow, indexOfLastRow, tableRows],
  );

  const handlePageSizeChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1); // Reset to the first page when the page size changes
  };

  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Error handling for loading and error states
  if (isLoading) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;

  return (
    <div className={styles.linkedToArtContainer}>
      {/* <CardHeader title={headerTitle}>
        <span></span>
        
      </CardHeader> */}
      <div className={styles.linkedToArtDetailHeaderContainer}>
        <div className={styles.desktopHeading}>
          <h4>{t('linkedtoart', 'Linked to ART')}</h4>
        </div>
        <div className={styles.backgroundDataFetchingIndicator}>
          <span></span>
        </div>
      </div>
      {currentRows.length > 0 ? (
        <>
          <DataTable rows={currentRows} headers={tableHeaders} useZebraStyles size={isTablet ? 'lg' : 'sm'}>
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <TableContainer className={styles.tableContainer}>
                <Table className={styles.linkedToArtTable} {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => {
                      // Find the corresponding patient data using the row ID
                      const currentPatient = patientData.find((patient) => patient.id === row.id);

                      if (!currentPatient) {
                        return null; // Skip rendering this row if no matching patient data is found
                      }

                      // Ensure the correct property name for UUID
                      const patientUuid = currentPatient.patientUUID; // Adjust if `uuid` is named differently in your data

                      // Construct the patient chart URL
                      const patientChartUrl = '${openmrsSpaBase}/patient/${patientUuid}/chart/Patient%20Summary';

                      //const patientChartUrl = `${openmrsSpaBase}/patient/${currentPatient.uuid}/chart/Patient%20Summary`;

                      return (
                        <React.Fragment key={`patient-row-${index}`}>
                          <TableRow
                            {...getTableProps({ row })}
                            data-testid={`patientRow${currentPatient.patientUUID || 'unknown'}`}
                          >
                            {row.cells.map((cell) => (
                              <TableCell key={`patient-row-${index}-cell-${cell.id}`} data-testid={cell.id}>
                                {cell.info.header === 'name' && currentPatient.patientUUID ? (
                                  <ConfigurableLink
                                    to={patientChartUrl}
                                    templateParams={{ patientUuid: currentPatient.patientUUID }}
                                  >
                                    {cell.value}
                                  </ConfigurableLink>
                                ) : (
                                  cell.value
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          <Pagination
            backwardText={t('previousPage', 'Previous page')}
            forwardText={t('nextPage', 'Next page')}
            itemsPerPageText={t('itemsPerPage', 'Items per page')}
            page={currentPage}
            pageSize={100}
            pageSizes={[10, 20, 30, 40, 50]}
            totalItems={totalRows}
            onChange={(event) => {
              if (event.pageSize !== rowsPerPage) {
                handlePageSizeChange(event.pageSize);
              }
              if (event.page !== currentPage) {
                handlePageChange(event.page);
              }
            }}
          />
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default LinkedToART;
