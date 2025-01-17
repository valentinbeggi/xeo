import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { theme } from '../../../../../tailwind-workspace-preset';
import {
  DataPlotLine,
  DataPlotType,
  roundToOneDecimal,
} from 'utils/sprint/chart';
import classNames from 'classnames';
import { useTheme } from 'next-themes';
import utc from 'dayjs/plugin/utc';
import { Sprint } from '@prisma/client';
import { useViewport } from '@xeo/ui/hooks/useViewport';

dayjs.extend(utc);

export interface SprintGraphProps {
  plotData: DataPlotType[] | undefined;
  showPointsNotStarted?: boolean;
  smallGraph?: boolean;
  sprint: Sprint | undefined;
}

export const SprintGraph: React.FunctionComponent<SprintGraphProps> = ({
  plotData,
  showPointsNotStarted,
  smallGraph,
  sprint,
}) => {
  const { width } = useViewport();

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active: boolean;
    payload: { dataKey: DataPlotLine; value: number; color: string }[];
    label: number;
  }) => {
    if (active && payload && payload.length) {
      const pointsNotDone = payload.find(
        ({ dataKey }) => dataKey === DataPlotLine.POINTS_LEFT
      );
      const pointsValidateOrDone = payload.find(
        ({ dataKey }) => dataKey === DataPlotLine.POINTS_DONE_INC_VALIDATE
      );
      const pointsExpectedNotDone = payload.find(
        ({ dataKey }) => dataKey === DataPlotLine.EXPECTED_POINTS
      );

      const deltaDoneExpected =
        pointsNotDone && pointsExpectedNotDone
          ? pointsExpectedNotDone.value - pointsNotDone.value
          : undefined;

      const deltaDoneValidate =
        pointsValidateOrDone && pointsExpectedNotDone
          ? pointsExpectedNotDone.value - pointsValidateOrDone.value
          : undefined;

      return (
        <div className="bg-dark-100 dark:bg-dark-800 dark:border-l-dark-600 ml-4 border-l-4  bg-opacity-80 p-2 dark:bg-opacity-60 divide-y divide-gray-300">
          <div>
            <p className="label">{dayjs(label).format('dddd HH:mm')}</p>
            {deltaDoneExpected && pointsNotDone ? (
              <p className="label" style={{ color: pointsNotDone.color }}>
                {`Done: ${roundToOneDecimal(
                  pointsNotDone.value
                )} (${roundToOneDecimal(deltaDoneExpected)})`}
              </p>
            ) : null}
            {deltaDoneValidate && pointsValidateOrDone ? (
              <p
                className="label"
                style={{ color: pointsValidateOrDone.color }}
              >
                {`Validate: ${roundToOneDecimal(
                  pointsValidateOrDone.value
                )} (${roundToOneDecimal(deltaDoneValidate)})`}
              </p>
            ) : null}
          </div>
          <div>
            {pointsExpectedNotDone && (
              <p
                className="label"
                style={{ color: pointsExpectedNotDone.color }}
              >
                Expected: {pointsExpectedNotDone.value}
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const sm = theme.extend.screens.sm;
  const smWidth = Number(sm.substring(0, sm.length - 2));

  const isSmallWindow = width <= smWidth;

  const HEIGHT = smallGraph ? 200 : isSmallWindow ? 300 : 350;
  const WIDTH = 1000;

  const nextTheme = useTheme();

  const isDark = nextTheme.theme === 'dark';

  const lowestValueInPlot = plotData
    ? Math.min(
        ...plotData.map((plot) =>
          Math.min(
            plot[DataPlotLine.CAPACITY] ?? 0,
            plot[DataPlotLine.POINTS_LEFT] ?? 0,
            plot[DataPlotLine.POINTS_DONE_INC_VALIDATE] ?? 0,
            plot[DataPlotLine.EXPECTED_POINTS] ?? 0
          )
        )
      )
    : 0;

  const highestValueInPlot = plotData
    ? Math.max(
        ...plotData.map((plot) =>
          Math.max(
            plot[DataPlotLine.CAPACITY] ?? 0,
            plot[DataPlotLine.POINTS_LEFT] ?? 0,
            plot[DataPlotLine.POINTS_DONE_INC_VALIDATE] ?? 0,
            plot[DataPlotLine.EXPECTED_POINTS] ?? 0
          )
        )
      )
    : 100;

  const getAllFactorsOf10BetweenValues = (
    lowestValue: number,
    highestValue: number,
    factor: number
  ): number[] => {
    const lowestFactor = Math.floor(lowestValue / factor) * factor;
    const highestFactor = Math.ceil(highestValue / factor) * factor;

    const factors = [];

    for (let i = lowestFactor; i <= highestFactor; i += factor) {
      factors.push(i);
    }

    return factors;
  };

  const axisFactor = highestValueInPlot - lowestValueInPlot < 80 ? 10 : 20;

  const yAxisTicks = getAllFactorsOf10BetweenValues(
    lowestValueInPlot,
    highestValueInPlot,
    axisFactor
  );

  const xAxisTicks = smallGraph
    ? [
        dayjs(sprint?.startDate).toISOString(),
        dayjs(sprint?.endDate).toISOString(),
      ]
    : undefined;

  return (
    <div
      key={plotData ? 'sprint-graph' : 'sprint-graph-loading'}
      className={classNames('relative -ml-6 mt-4', {
        'text-sm': smallGraph || isSmallWindow,
      })}
      style={{ height: HEIGHT }}
    >
      <ResponsiveContainer
        width={'99%'}
        height={HEIGHT}
        className="h-full w-full select-none"
      >
        <LineChart
          width={WIDTH}
          height={HEIGHT}
          data={plotData ?? []}
          style={{ position: 'absolute' }}
        >
          <CartesianGrid
            stroke={
              isDark
                ? theme.extend.colors.dark[700]
                : theme.extend.colors.dark[200]
            }
            strokeDasharray="5 5"
          />
          <XAxis
            dy={10}
            dataKey="time"
            name="Time"
            tickFormatter={(time, index) =>
              smallGraph
                ? dayjs(time).format('ddd DD/MM')
                : index === 0
                ? 'Start'
                : index === (plotData ? plotData.length - 1 : -1)
                ? 'End'
                : dayjs(time).format('ddd DD/MM')
            }
            type="category"
            ticks={xAxisTicks}
            stroke={
              isDark
                ? theme.extend.colors.dark[500]
                : theme.extend.colors.dark[800]
            }
          />
          <YAxis
            type="number"
            dataKey={DataPlotLine.EXPECTED_POINTS}
            ticks={yAxisTicks}
            domain={['dataMin', 'dataMax']}
            stroke={
              isDark
                ? theme.extend.colors.dark[500]
                : theme.extend.colors.dark[800]
            }
          />
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <Tooltip content={CustomTooltip} />
          <Line
            stroke={theme.extend.colors.dark[400]}
            name={DataPlotLine.EXPECTED_POINTS}
            dataKey={DataPlotLine.EXPECTED_POINTS}
            type="linear"
            strokeDasharray={'3 3'}
            strokeWidth={2}
            connectNulls
            dot={false}
          />
          <Line
            hide={!showPointsNotStarted}
            stroke={theme.extend.colors.primary[400]}
            name={DataPlotLine.POINTS_DONE_INC_VALIDATE}
            dataKey={DataPlotLine.POINTS_DONE_INC_VALIDATE}
            type="linear"
            strokeWidth={2}
            connectNulls
            dot={false}
          />
          <Line
            stroke={theme.extend.colors.secondary[400]}
            name={DataPlotLine.POINTS_LEFT}
            dataKey={DataPlotLine.POINTS_LEFT}
            type="linear"
            connectNulls
            strokeWidth={2}
            dot={false}
          />
          {/* Pending Lines */}
          <Line
            stroke={theme.extend.colors.secondary[400]}
            name={DataPlotLine.PENDING_POINTS_LEFT}
            dataKey={DataPlotLine.PENDING_POINTS_LEFT}
            strokeDasharray={'3 3'}
            type="linear"
            connectNulls
            strokeWidth={2}
            strokeOpacity={0.3}
            dot={false}
          />
          <Line
            stroke={theme.extend.colors.primary[400]}
            hide={!showPointsNotStarted}
            name={DataPlotLine.PENDING_POINTS_DONE_INC_VALIDATE}
            dataKey={DataPlotLine.PENDING_POINTS_DONE_INC_VALIDATE}
            strokeDasharray={'3 3'}
            type="linear"
            strokeWidth={2}
            strokeOpacity={0.3}
            connectNulls
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
