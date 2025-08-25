
import { DashboardWrapper } from '@/components/dashboard-main/DashboardWrapper';
import SettingsPage from './SettingsPage';
import { observer } from 'mobx-react-lite';

const SettingsPageWrapper = observer(() => {
  return (
    <DashboardWrapper title="Settings">
      <SettingsPage />
    </DashboardWrapper>
  );
});

export default SettingsPageWrapper;
