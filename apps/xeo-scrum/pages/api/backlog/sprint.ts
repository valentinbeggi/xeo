import {
  Backlog,
  NotionStatusLink,
  Sprint,
  SprintHistory,
  SprintStatusHistory,
} from '@prisma/client';
import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from 'utils/db';
import {
  getProductBacklogForSprint,
  ProductBacklog,
} from 'utils/notion/backlog';
import { saveSprintHistoryForBacklog } from 'utils/sprint/sprint-history';

export type GetBacklogSprintRequest = {
  method: 'GET';
  query: {
    sprintId: string;
    setDefault?: boolean;
  };
  responseBody: {
    backlog: ProductBacklog;
    notionBacklog: Backlog & {
      notionStatusLinks: NotionStatusLink[];
      sprints: Sprint[];
    };
    sprintHistory: (SprintHistory & {
      sprintStatusHistory: SprintStatusHistory[];
    })[];
  };
};

const schema = Joi.object<GetBacklogSprintRequest['query']>({
  sprintId: Joi.string().required(),
  setDefault: Joi.boolean(),
});

export default async function getBacklog(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { sprintId, setDefault } = value;

  const notionBacklog = await prisma.backlog.findFirst({
    where: {
      userId: session.id as string,
    },
    include: {
      notionStatusLinks: true,
      sprints: true,
    },
  });

  if (!notionBacklog) {
    return res
      .status(404)
      .json({ message: 'Backlog not found for your account' });
  }

  const sprint = notionBacklog.sprints.find((sprint) => sprint.id === sprintId);

  if (!sprint) {
    return res.status(404).json({ message: 'Sprint not found' });
  }

  if (setDefault) {
    await prisma.backlog.update({
      where: { id: notionBacklog.id },
      data: { currentSprintId: sprint.id },
    });
  }

  const productBacklog = await getProductBacklogForSprint({
    notionBacklog,
    sprintColumnName: notionBacklog.sprintColumnName,
    notionSprintValue: sprint.notionSprintValue,
  });

  // await saveSprintHistoryForBacklog(productBacklog, sprint);

  const sprintHistory = await prisma.sprintHistory.findMany({
    where: {
      sprintId,
    },
    include: {
      sprintStatusHistory: true,
    },
  });

  const returnValue: GetBacklogSprintRequest['responseBody'] = {
    notionBacklog,
    backlog: productBacklog,
    sprintHistory,
  };

  return res.status(200).json(returnValue);
}
