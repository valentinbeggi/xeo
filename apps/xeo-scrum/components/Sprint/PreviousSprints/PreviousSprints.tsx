import { Table } from '@xeo/ui';
import classNames from 'classnames';
import { getSprintStats } from 'components/SprintInfo/SprintStats/getSprintStats';
import dayjs from 'dayjs';
import Link from 'next/link';
import { roundToOneDecimal } from 'utils/sprint/chart';
import { SprintWithPlotData } from 'utils/sprint/utils';

interface Props {
  sprints: SprintWithPlotData[];
}

export const PreviousSprints: React.FunctionComponent<Props> = ({
  sprints,
}) => {
  return (
    <div className="flex flex-row flex-wrap gap-4">
      <Table<SprintWithPlotData>
        columns={[
          {
            Header: 'Name',
            accessor: 'sprint',
            Cell: (row) => (
              <Link href={`/sprint/${row.value.id}`}>{row.value.name}</Link>
            ),
          },
          {
            Header: 'Dates',
            accessor: (row) =>
              `${dayjs(row.sprint.startDate).format('DD/MM/YY')} - ${dayjs(
                row.sprint.endDate
              ).format('DD/MM/YY')}`,
          },
          {
            Header: 'Success',
            accessor: 'plotData',
            Cell: (row) => {
              const stats = getSprintStats(row.value);

              if (!stats) {
                return <p>Unknown</p>;
              }

              const { deltaPoints } = stats;

              return (
                <p
                  className={classNames(
                    { 'text-red-400 dark:text-red-300': deltaPoints < 0 },
                    { 'text-green-400 dark:text-green-300': deltaPoints >= 0 }
                  )}
                >
                  {roundToOneDecimal(deltaPoints)}{' '}
                  {roundToOneDecimal(deltaPoints) < 0 ? 'Behind' : 'Ahead'}
                </p>
              );
            },
          },
        ]}
        data={sprints}
      />
    </div>
  );
};
