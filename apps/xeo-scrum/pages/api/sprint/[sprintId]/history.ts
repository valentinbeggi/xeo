import { Sprint, SprintHistory, SprintStatusHistory } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { DataPlotType, getDataForSprintChart } from 'utils/sprint/chart';
import { prisma } from 'utils/db';
import { withSentry } from '@sentry/nextjs';

export type GetSprintHistoryRequest = {
  method: 'GET';
  responseBody: {
    sprint: Sprint;
    sprintHistoryPlotData: DataPlotType[];
  };
};

/**
 * ⚠️ Public Facing Route
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const sprintId = req.query.sprintId as string;

  const firstStartTime = new Date();

  const sprint = await prisma.sprint.findFirst({
    where: {
      id: sprintId,
    },
    include: {
      backlog: {
        include: {
          notionStatusLinks: true,
        },
      },
      sprintHistory: {
        include: {
          sprintStatusHistory: true,
        },
      },
    },
  });

  if (!sprint) {
    return res.status(404).json({ message: 'Sprint not found' });
  }

  const firstEndTime = new Date();

  console.log(
    `first query took ${firstEndTime.getTime() - firstStartTime.getTime()}ms`
  );

  type SprintStatusQueryRaw = SprintStatusHistory &
    Pick<SprintHistory, 'timestamp'>;

  const startTime = new Date();

  const sprint2 = await prisma.sprint.findUnique({
    where: {
      id: sprintId,
    },
    include: {
      backlog: {
        include: {
          notionStatusLinks: true,
        },
      },
    },
  });

  if (!sprint2) {
    return res.status(404).json({ message: 'Sprint not found' });
  }

  const raw = await prisma.$queryRaw<SprintStatusQueryRaw[]>`
  -- test query
  SELECT
	SprintHistory.timestamp,
	SprintStatusHistory.*
FROM
	SprintHistory
	JOIN SprintStatusHistory ON SprintStatusHistory.sprintHistoryId = SprintHistory.id
WHERE
	SprintHistory.sprintId = ${sprint2.id}
	AND SprintHistory.timestamp in(
		SELECT
			MAX(timestamp) AS lastHistoryOfDay FROM SprintHistory
		GROUP BY
			Date(timestamp));`;

  const endTime = new Date();

  console.log(`query took ${endTime.getTime() - startTime.getTime()}ms`);
  // console.table(raw);

  const sprintHistoryPlotData = getDataForSprintChart(
    sprint,
    sprint.sprintHistory,
    sprint.backlog.notionStatusLinks
  );

  // Remove backlog and sprintHistory from the response to avoid sending unnecessary data
  const { backlog, sprintHistory, ...restSprint } = sprint;

  const returnValue: GetSprintHistoryRequest['responseBody'] = {
    sprint: restSprint,
    sprintHistoryPlotData,
  };

  return res.status(200).json(returnValue);
};

export default withSentry(handler);
