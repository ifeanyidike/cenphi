import { useEffect } from "react";
import { appService } from "./services/appService";

const App = () => {
  useEffect(() => {
    appService.startHealthCheck(4 * 60 * 60 * 1000);
    return () => {
      appService.stopHealthCheck();
    };
  }, []);
  return <></>;
};

export default App;
