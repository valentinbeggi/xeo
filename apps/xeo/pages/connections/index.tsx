import {
  Loader,
  Table,
  Clickable,
  Modal,
  Button,
  ButtonVariation,
} from '@xeo/ui';
import {
  NotionBacklog,
  fetcher,
} from 'components/Connections/Notion/NotionBacklog/NotionBacklog';
import dayjs from 'dayjs';
import {
  BacklogWithNotionStatusLinksAndOwner,
  GetBacklogsRequest,
} from 'pages/api/backlog';
import {
  BacklogWithMembersRestricted,
  GetConnectionsRequest,
} from 'pages/api/connections';
import useSWR from 'swr';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { LogoutIcon } from '@heroicons/react/outline';
import { SecretText } from 'components/SecretText/SecretText';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { DeleteNotionConnection } from 'components/Connections/Notion/NotionConnection/DeleteNotionConnection';
import { NextSeo } from 'next-seo';
import { Content } from 'components/Content';
import Skeleton from 'react-loading-skeleton';
import { trackAction, UserAction } from 'utils/analytics';
import { NotionConnection } from 'components/Connections/Notion/NotionConnection/NotionConnection';

dayjs.extend(LocalizedFormat);

export function Index() {
  const { data: dataBacklogs, error: errorBacklogs } = useSWR<
    GetBacklogsRequest['responseBody'],
    string
  >('/api/backlog', fetcher);

  const { data: dataConnections, error: errorConnections } = useSWR<
    GetConnectionsRequest['response'],
    string
  >('/api/connections', fetcher);

  const session = useSession();

  const userId = session?.data?.id as string | undefined;

  return (
    <div className="bg-dark-50 dark:bg-dark-900 min-h-screen">
      <Content className="p-10">
        <NextSeo
          title={`Xeo Connections`}
          description={`View current Xeo Connections, and any backlogs shared with you`}
        />
        <div className="flex flex-row justify-between">
          <h1>Connections</h1>
          <div>
            <Modal
              mainText="Add Backlog"
              trigger={(setOpen) => (
                <Button
                  onClick={() => {
                    trackAction(UserAction.CLICK_ADD_NOTION_CONNECTION);
                    setOpen();
                  }}
                  variation={ButtonVariation.Primary}
                >
                  Connect to Notion
                </Button>
              )}
              content={(setClose) => <NotionConnection closeModal={setClose} />}
            />
          </div>
        </div>

        {errorConnections ? (
          <div>Error Loading Connections</div>
        ) : (
          <>
            <div className="mt-10 ">
              {(
                dataConnections?.connections ?? [
                  { connection: null, backlogs: [] },
                ]
              ).map(({ connection, backlogs }, index) => (
                <div
                  key={connection?.id ?? index}
                  className=" bg-white dark:bg-dark-950 mb-10 p-4 shadow-md rounded-md  transition-all hover:shadow-md"
                >
                  <div className="flex w-full flex-row items-center">
                    <div>
                      <h3 className="my-0 mr-4">
                        {connection?.connectionName ?? <Skeleton width={200} />}
                      </h3>
                      <div className="my-2">
                        <div>
                          <b>Connected:</b>{' '}
                          {connection ? (
                            dayjs(connection.createdAt).format('LLL')
                          ) : (
                            <Skeleton width={80} />
                          )}
                        </div>
                        <div>
                          <b>Secret:</b>{' '}
                          {connection ? (
                            <SecretText text={connection.secretKey} />
                          ) : (
                            <Skeleton width={120} />
                          )}
                        </div>
                      </div>
                    </div>
                    {connection ? (
                      <div className="ml-auto flex flex-row gap-2">
                        <Modal
                          mainText="Add Backlog"
                          trigger={(setOpen) => (
                            <Button
                              onClick={setOpen}
                              variation={ButtonVariation.Secondary}
                            >
                              Add Backlog
                            </Button>
                          )}
                          content={(setClose) => (
                            <NotionBacklog
                              notionConnectionId={connection.id}
                              closeModal={setClose}
                            />
                          )}
                        />
                        <DeleteNotionConnection connection={connection} />
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <Table<BacklogWithMembersRestricted>
                      columns={[
                        { Header: 'Name', accessor: 'databaseName' },
                        {
                          Header: 'Connected',
                          accessor: 'createdAt',
                          Cell: (cell) => dayjs(cell.value).format('LLL'),
                        },
                        {
                          Header: 'Users',
                          accessor: 'members',
                          Cell: (cell) => (
                            <div className="flex flex-row">
                              {cell.value.map((member) => {
                                return member.user.image ? (
                                  <Image
                                    className="rounded-full"
                                    key={member.userId}
                                    src={member.user.image}
                                    height={30}
                                    width={30}
                                    alt={member.user?.name ?? ''}
                                  />
                                ) : null;
                              })}
                            </div>
                          ),
                        },
                        {
                          Header: 'Actions',
                          accessor: 'id',
                          Cell: (cell) => (
                            <Button
                              href={`/connections/backlog/notion/${cell.value}`}
                              variation={ButtonVariation.Secondary}
                            >
                              Edit
                            </Button>
                          ),
                        },
                      ]}
                      data={backlogs}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <h2>Backlogs Shared With Me</h2>
        {errorBacklogs ? (
          <div>Error Loading Backlogs</div>
        ) : (
          <Table<BacklogWithNotionStatusLinksAndOwner>
            columns={[
              { Header: 'Name', accessor: 'databaseName' },
              {
                Header: 'Connected',
                accessor: 'createdAt',
                Cell: (cell) => dayjs(cell.value).format('LLL'),
              },
              {
                Header: 'Owner',
                accessor: 'notionConnection',
                Cell: (cell) => (
                  <div className="flex flex-row">
                    {cell.value?.createdByUser?.image ? (
                      <Image
                        className="rounded-full"
                        src={cell.value.createdByUser.image}
                        height={30}
                        width={30}
                        alt={cell.value.createdByUser?.name ?? ''}
                      />
                    ) : (
                      <p>{cell.value?.createdByUser?.name ?? ''}</p>
                    )}
                  </div>
                ),
              },
              {
                Header: 'Actions',
                Cell: () => (
                  <div className="flex flex-row">
                    <Clickable>
                      <LogoutIcon width={25} height={25} />
                    </Clickable>
                  </div>
                ),
              },
            ]}
            data={
              dataBacklogs?.backlogs.filter(
                (backlog) =>
                  backlog.notionConnection?.createdByUser.id !== userId
              ) ?? []
            }
          />
        )}
      </Content>
    </div>
  );
}

export default Index;