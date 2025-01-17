import { Alert } from '@xeo/ui/lib/Alert/Alert';
import { CentredLoader } from '@xeo/ui/lib/Animate/CentredLoader/CentredLoader';
import Button, { ButtonVariation } from '@xeo/ui/lib/Button/Button';
import classNames from 'classnames';
import { fetcher } from 'components/Connections/Notion/NotionBacklog/NotionBacklog';
import { Content } from 'components/Content';
import { SprintCreate } from 'components/Sprint/SprintCreate/SprintCreate';
import { NextSeo } from 'next-seo';
import { GetBacklogsRequest } from 'pages/api/backlog';
import { toast } from 'react-toastify';
import useSWR from 'swr';

function Create() {
  const { data: dataBacklogs, error: errorBacklogs } = useSWR<
    GetBacklogsRequest['response'],
    string
  >('/api/backlog', fetcher);

  if (!dataBacklogs && !errorBacklogs) {
    return (
      <div>
        <CentredLoader />
      </div>
    );
  }

  if (errorBacklogs || !dataBacklogs) {
    toast.error('Unable to fetch your Backlogs');
    return <div>Error Loading Backlogs</div>;
  }

  return (
    <div className="min-h-screen">
      <Content className="my-10">
        <NextSeo
          title="Create Sprint"
          description="Create a new Sprint in Xeo"
        />
        <div className="flex flex-row justify-between">
          <h1>Create Sprint</h1>
          <div>
            <Button href="/" variation={ButtonVariation.Secondary}>
              Back
            </Button>
          </div>
        </div>
        {dataBacklogs.backlogs.length === 0 && (
          <Alert variation="warning">
            You currently have no Backlogs. Please join or create one before
            creating a sprint!
          </Alert>
        )}
        <div
          className={classNames({
            'opacity-30': dataBacklogs.backlogs.length === 0,
          })}
        >
          <SprintCreate backlogs={dataBacklogs.backlogs} />
        </div>
      </Content>
    </div>
  );
}

export default Create;
