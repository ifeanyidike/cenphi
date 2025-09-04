
import { DashboardWrapper } from '@/components/dashboard-main/DashboardWrapper';
import GoogleDrivePage from './GoogleDrivePage';
import { observer } from 'mobx-react-lite';

const GoogleDrivePageWrapper = observer(() => {
  return (
    <DashboardWrapper title="Google Drive">
      <GoogleDrivePage />
    </DashboardWrapper>
  );
});

export default GoogleDrivePageWrapper;
