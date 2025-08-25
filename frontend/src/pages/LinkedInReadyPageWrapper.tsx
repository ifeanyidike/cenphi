import { DashboardWrapper } from '@/components/dashboard-main/DashboardWrapper';
import LinkedInReadyPage from './LinkedInReadyPage';
import { observer } from 'mobx-react-lite';

const LinkedInReadyPageWrapper = observer(() => {
  return (
    <DashboardWrapper title="LinkedIn Ready Testimonials">
      <LinkedInReadyPage />
    </DashboardWrapper>
  );
});

export default LinkedInReadyPageWrapper;
