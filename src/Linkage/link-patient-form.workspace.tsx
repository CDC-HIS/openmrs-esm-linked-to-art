import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSet, Form, Row } from '@carbon/react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { WarningFilled } from '@carbon/react/icons';
import { EmptyState, type DefaultPatientWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import {
  ExtensionSlot,
  useLayoutType,
  showSnackbar,
  ResponsiveWrapper,
  useConfig,
  OpenmrsDatePicker,
  OpenmrsResource,
  closeWorkspace,
} from '@openmrs/esm-framework';
import type { CloseWorkspaceOptions } from '@openmrs/esm-framework';
import styles from './link-patient-form.scss';
import { Dropdown } from '@carbon/react';
import { TextArea } from '@carbon/react';
import { ComboBox } from '@carbon/react';
import isEmpty from 'lodash/isEmpty';
import { fetchVisitTypes, savePatientLinkage } from '../api/api';
import dayjs from 'dayjs';
import { InlineNotification } from '@carbon/react';

type FormInputs = Record<'uuid' | 'display' | 'linkageDate' | 'note', string>;

const LinkPatientForm: React.FC<DefaultPatientWorkspaceProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const memoizedPatientUuid = useMemo(() => ({ patientUuid }), [patientUuid]);
  const today = new Date();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      linkageDate: today.toISOString().split('T')[0], // Set default date as today
      display: '',
      note: '',
    },
  });
  const [visitTypes, setVisitTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const getVisitTypes = async () => {
      try {
        const visitTypeData = await fetchVisitTypes();
        const filteredClinics = visitTypeData.filter((clinic) => !/ART/i.test(clinic.display));
        setVisitTypes(filteredClinics);
      } catch (error) {
        console.error('Failed to load visit types', error);
      }
    };

    getVisitTypes();
  }, []);

  type DateFieldKey = 'linkageDate';

  const onDateChange = (value: any, dateField: DateFieldKey) => {
    try {
      const jsDate = new Date(value);
      if (isNaN(jsDate.getTime())) {
        throw new Error('Invalid Date');
      }
      const formattedDate =
        dateField === 'linkageDate'
          ? dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss') // Include time for datetime field
          : dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss');
      setValue(dateField, formattedDate); // Dynamically set the value based on the field
      //setError(null);
    } catch (e) {
      //setError('Invalid date format');
    }
  };

  const closeWorkspaceHandler = (name: string) => {
    const options: CloseWorkspaceOptions = {
      ignoreChanges: false,
      onWorkspaceClose: () => {},
    };
    closeWorkspace(name, options);
  };

  const handleFormSubmit = async (fieldValues: FormInputs) => {
    const abortController = new AbortController();
    setErrorMessage(null);

    const linkPatientPayload = {
      patientUuid,
      visitType: fieldValues.display,
      dateLinked: fieldValues.linkageDate,
      note: `ART clinic: ${fieldValues.note}`,
    };

    const apiPayload = {
      ...linkPatientPayload,
    };

    try {
      await savePatientLinkage(abortController, apiPayload)
        .then((response) => {
          showSnackbar({
            isLowContrast: true,
            title: t('updatedEntry', 'Patient Linked'),
            kind: 'success',
            subtitle: t('viralLoadEncounterUpdatedSuccessfully', 'The patient was successfully linked.'),
          });

          closeWorkspaceHandler('link-patient-workspace-form');
        })
        .catch((error) => {
          console.error('Failed to save:', error);
          setErrorMessage(
            error.response?.status === 500
              ? 'This patient may already have the same referral record. Please verify the information and try again.'
              : 'An error occurred while saving the form. Please try again.',
          );
        });
      return true;
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  const onError = (errors) => console.error(errors);

  return (
    <Form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
      <div>
        {isTablet && (
          <Row className={styles.headerGridRow}>
            <ExtensionSlot className={styles.dataGridRow} name="visit-form-header-slot" state={memoizedPatientUuid} />
          </Row>
        )}
        <div className={styles.container}>
          {/* First Question */}
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <>{t('dateOfLinkage', 'Date of Linkage')}</>
            </div>
            <ResponsiveWrapper>
              <Controller
                name="linkageDate"
                control={control}
                rules={{
                  required: t('linkageDate', 'Linkage date is required'), // Ensure the field is required
                }}
                render={({ field: { onChange, value, ref }, fieldState }) => {
                  return (
                    <>
                      <OpenmrsDatePicker
                        id="linkageDate"
                        //labelText={t('dateOfSampleCollection', 'Date specimen collected')}
                        labelText={<>{t('dateOfLinkage', 'Date of Linkage')}</>}
                        value={value}
                        maxDate={today} // Max date is the sent date or today if not set
                        onChange={(date) => onDateChange(date, 'linkageDate')}
                        ref={ref}
                        invalid={!!fieldState.error}
                      />
                      {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                    </>
                  );
                }}
              />
            </ResponsiveWrapper>
          </section>

          {/* Second Question */}
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              {t('selectDestination', 'Destination')}
              <span className={styles.required}>*</span>
            </div>
            <div className={classNames(styles.selectContainer, styles.sectionField)}>
              <Controller
                name="display"
                control={control}
                defaultValue=""
                rules={{ required: t('required', 'This field is required') }}
                render={({ field }) => (
                  <ComboBox
                    id="display"
                    titleText={t('selectLocation', 'Select a destination clinic')}
                    placeholder={t('enterDestination', 'Select a destination')}
                    items={visitTypes}
                    itemToString={(item) => (item ? item.display : '')}
                    onChange={({ selectedItem }) => field.onChange(selectedItem)}
                    invalid={!!errors.display}
                  />
                )}
              />
            </div>
          </section>

          {/* Third Question */}
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>{t('priorityComment', 'Note')}</div>
            <Controller
              name="note"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextArea id="note" placeholder={t('enterCommentHere', 'Enter note here')} {...field} />
              )}
            />
          </section>

          {errorMessage && (
            <div style={{ marginTop: '1rem' }}>
              <InlineNotification kind="error" title="Error" subtitle={errorMessage} lowContrast />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <ButtonSet className={styles.buttonSet}>
        <Button
          onClick={() => closeWorkspaceHandler('link-patient-workspace-form')}
          style={{ maxWidth: 'none', width: '50%' }}
          className={styles.button}
          kind="secondary"
        >
          {t('discard', 'Discard')}
        </Button>
        <Button
          disabled={isSubmitting}
          style={{ maxWidth: 'none', width: '50%' }}
          className={styles.button}
          kind="primary"
          type="submit"
        >
          {t('saveAndClose', 'Save and close')}
        </Button>
      </ButtonSet>
    </Form>
  );
};

export default LinkPatientForm;
