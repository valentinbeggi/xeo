import { SelectField } from '@xeo/ui/lib/Select/SelectField';
import { GetNotionDatabasesResponse } from 'pages/api/backlog/configure';
import { UseFormReturn } from 'react-hook-form';
import {
  DatabaseSelectionForm,
  DatabaseSelectionOption,
} from './useCreateNotionBacklog';

interface Props {
  form: UseFormReturn<DatabaseSelectionForm>;
  databaseQueryData: GetNotionDatabasesResponse | undefined;
  error: string | undefined;
}
export const SelectDatabase: React.FunctionComponent<Props> = ({
  form: { control },
  databaseQueryData,
  error,
}) => {
  const databaseOptions: DatabaseSelectionOption[] =
    databaseQueryData?.databases?.map((database) => ({
      label: database.title,
      value: database.id,
      properties: database.properties,
    })) ?? [];

  return (
    <SelectField
      label="Database"
      control={control}
      name="database"
      // error={errors.database}
      options={databaseOptions}
      rules={{ required: true }}
      isLoading={!databaseQueryData && !error}
      isClearable
    />
  );
};
