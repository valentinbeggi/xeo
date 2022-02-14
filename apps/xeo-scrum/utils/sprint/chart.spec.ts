import { BacklogStatus, NotionStatusLink, Sprint } from '@prisma/client';
import { SprintWithHistory } from 'pages/api/sprint';
import {
  getBusinessDaysArray,
  getCumulativeCapacityPerDay,
  getDataForSprintChart,
  getDaysArray,
  getSprintCapacityPerDay,
} from './chart';

describe('chart calculation', () => {
  it('should calculate getDaysArray correctly', () => {
    const startDate = new Date('2022-02-07');
    const endDate = new Date('2022-02-08');

    const days = getDaysArray(startDate, endDate);

    expect(days.length).toBe(2);

    expect(days).toStrictEqual([
      new Date('2022-02-07T00:00:00.000Z'),
      new Date('2022-02-08T00:00:00.000Z'),
    ]);
  });

  it('should calculate getDaysArray correctly', () => {
    const startDate = new Date('2022-02-07');
    const endDate = new Date('2022-02-14');

    const days = getDaysArray(startDate, endDate);

    expect(days.length).toBe(8);

    expect(days).toStrictEqual([
      new Date('2022-02-07T00:00:00.000Z'),
      new Date('2022-02-08T00:00:00.000Z'),
      new Date('2022-02-09T00:00:00.000Z'),
      new Date('2022-02-10T00:00:00.000Z'),
      new Date('2022-02-11T00:00:00.000Z'),
      new Date('2022-02-12T00:00:00.000Z'),
      new Date('2022-02-13T00:00:00.000Z'),
      new Date('2022-02-14T00:00:00.000Z'),
    ]);
  });

  it('should calculate getBusinessDaysArray correctly', () => {
    const startDate = new Date('2022-02-07');
    const endDate = new Date('2022-02-14');

    const days = getBusinessDaysArray(startDate, endDate);

    expect(days.length).toBe(6);

    expect(days).toStrictEqual([
      new Date('2022-02-07T00:00:00.000Z'),
      new Date('2022-02-08T00:00:00.000Z'),
      new Date('2022-02-09T00:00:00.000Z'),
      new Date('2022-02-10T00:00:00.000Z'),
      new Date('2022-02-11T00:00:00.000Z'),
      // new Date('2022-02-12T00:00:00.000Z'), // Sunday
      // new Date('2022-02-13T00:00:00.000Z'), // Saturday
      new Date('2022-02-14T00:00:00.000Z'),
    ]);
  });

  it('Should calculate capacity per day for a Sprint', () => {
    const sprint: Pick<
      Sprint,
      'startDate' | 'endDate' | 'teamSpeed' | 'sprintDevelopersAndCapacity'
    > = {
      startDate: new Date('2022-02-07T15:00:00.000Z'),
      endDate: new Date('2022-02-14T15:00:00.000Z'),
      sprintDevelopersAndCapacity: [
        { name: 'Olly', capacity: [0.1, 0.5, 0.5, 0.5, 0.5, 0.4] },
        { name: 'John', capacity: [0, 0, 0, 0, 0, 0] },
        { name: 'Jad', capacity: [0.1, 0.3, 0.3, 0.3, 0.3, 0.2] },
        { name: 'Andrew', capacity: [0.1, 1, 1, 1, 1, 0.8] },
        { name: 'Erwan', capacity: [0.1, 1, 1, 1, 1, 0.8] },
      ],
      teamSpeed: 4.5,
    };

    const capacityPerDay = getSprintCapacityPerDay(sprint);

    expect(capacityPerDay.length).toBe(6);
    expect(capacityPerDay).toStrictEqual([
      { day: new Date('2022-02-07T00:00:00.000Z'), capacity: 1.8 },
      { day: new Date('2022-02-08T00:00:00.000Z'), capacity: 12.6 },
      { day: new Date('2022-02-09T00:00:00.000Z'), capacity: 12.6 },
      { day: new Date('2022-02-10T00:00:00.000Z'), capacity: 12.6 },
      { day: new Date('2022-02-11T00:00:00.000Z'), capacity: 12.6 },
      { day: new Date('2022-02-14T00:00:00.000Z'), capacity: 9.9 },
    ]);
  });

  it('Should calculate capacity per day for a Sprint', () => {
    const sprint: Pick<
      Sprint,
      'startDate' | 'endDate' | 'teamSpeed' | 'sprintDevelopersAndCapacity'
    > = {
      startDate: new Date('2022-02-07T15:00:00.000Z'),
      endDate: new Date('2022-02-14T15:00:00.000Z'),
      sprintDevelopersAndCapacity: [
        { name: 'Olly', capacity: [0, 1, 1, 1, 1, 0] },
      ],
      teamSpeed: 1,
    };

    const capacityPerDay = getSprintCapacityPerDay(sprint);

    expect(capacityPerDay.length).toBe(6);
    expect(capacityPerDay).toStrictEqual([
      { day: new Date('2022-02-07T00:00:00.000Z'), capacity: 0 },
      { day: new Date('2022-02-08T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-09T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-10T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-11T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-14T00:00:00.000Z'), capacity: 0 },
    ]);
  });

  it('should calculate cumulativeCapacityPerDay', () => {
    const capacityPerDay = [
      { day: new Date('2022-02-07T00:00:00.000Z'), capacity: 0 },
      { day: new Date('2022-02-08T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-09T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-10T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-11T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-14T00:00:00.000Z'), capacity: 0 },
    ];

    const cumPerDay = getCumulativeCapacityPerDay(capacityPerDay);

    expect(cumPerDay.length).toBe(6);
    expect(cumPerDay).toStrictEqual([
      { day: new Date('2022-02-07T00:00:00.000Z'), capacity: 0 },
      { day: new Date('2022-02-08T00:00:00.000Z'), capacity: 1 },
      { day: new Date('2022-02-09T00:00:00.000Z'), capacity: 2 },
      { day: new Date('2022-02-10T00:00:00.000Z'), capacity: 3 },
      { day: new Date('2022-02-11T00:00:00.000Z'), capacity: 4 },
      { day: new Date('2022-02-14T00:00:00.000Z'), capacity: 4 },
    ]);
  });

  it('should get plotData for the chart', () => {
    const BACKLOG_ID = 'ckz8gev3u0247yskjdew53anp';

    const sprint: Sprint = {
      id: 'sprint-id',
      name: 'PeX - Sprint 4',
      startDate: new Date('2022-02-07 16:00:00.000'),
      endDate: new Date('2022-02-14 15:00:00.000'),
      notionSprintValue: 'PEX 07-02',
      userId: 'ckzg5t3v40010cskjpqi5kn69',
      backlogId: BACKLOG_ID,
      sprintGoal: 'AaU, I am inside a test',
      sprintDevelopersAndCapacity: [
        { name: 'Olly', capacity: [0.5, 1, 1, 1, 1, 0.5] },
      ],
      teamSpeed: 5,
      createdAt: new Date('2022-02-10 00:50:30.997'),
      updatedAt: new Date('2022-02-14 14:23:03.918'),
    };

    const notionStatusLinkIds: NotionStatusLink[] = [
      {
        id: 'link-done',
        backlogId: BACKLOG_ID,
        notionStatusName: 'DONE',
        notionStatusColor: 'green',
        status: BacklogStatus.DONE,
        createdAt: new Date('2022-02-04 13:39:20.442'),
        updatedAt: new Date('2022-02-04 13:39:20.442'),
      },
      {
        id: 'link-backlog',
        backlogId: BACKLOG_ID,
        notionStatusName: 'NOT DONE',
        notionStatusColor: 'red',
        status: BacklogStatus.TO_VALIDATE,
        createdAt: new Date('2022-02-04 13:39:20.442'),
        updatedAt: new Date('2022-02-04 13:39:20.442'),
      },
    ];
    const sprintHistory: SprintWithHistory['sprintHistory'] = [
      {
        id: 'sprint-history-1',
        sprintId: sprint.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        timestamp: new Date('2022-02-09T12:00:00.000Z'),
        sprintStatusHistory: [
          {
            id: '1',
            sprintHistoryId: 'sprint-history-1',
            pointsInStatus: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            notionStatusLinkId: 'link-backlog',
          },
          {
            id: '2',
            sprintHistoryId: 'sprint-history-1',
            pointsInStatus: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            notionStatusLinkId: 'link-done',
          },
        ],
      },
    ];

    const plotData = getDataForSprintChart(
      sprint,
      sprintHistory,
      notionStatusLinkIds
    );

    expect(plotData).toStrictEqual([
      {
        time: 1644191999999,
        sprintDay: -1,
        Expected: 25,
        Done: 25,
        'To Validate': 25,
      },
      { time: 1644278399999, sprintDay: 0, Expected: 22.5 },
      { time: 1644364799999, sprintDay: 1, Expected: 17.5 },
      {
        time: 1644451199999,
        sprintDay: 2,
        Expected: 12.5,
        Done: 24,
        'To Validate': 22,
      },
      { time: 1644537599999, sprintDay: 3, Expected: 7.5 },
      { time: 1644623999999, sprintDay: 4, Expected: 2.5 },
      { time: 1644883199999, sprintDay: 5, Expected: 0 },
    ]);

    const plotDataNoWorkDone = getDataForSprintChart(
      sprint,
      [],
      notionStatusLinkIds
    );

    expect(plotDataNoWorkDone).toStrictEqual([
      {
        time: 1644191999999,
        sprintDay: -1,
        Expected: 25,
        Done: 25,
        'To Validate': 25,
      },
      { time: 1644278399999, sprintDay: 0, Expected: 22.5 },
      { time: 1644364799999, sprintDay: 1, Expected: 17.5 },
      { time: 1644451199999, sprintDay: 2, Expected: 12.5 },
      { time: 1644537599999, sprintDay: 3, Expected: 7.5 },
      { time: 1644623999999, sprintDay: 4, Expected: 2.5 },
      { time: 1644883199999, sprintDay: 5, Expected: 0 },
    ]);
  });
});