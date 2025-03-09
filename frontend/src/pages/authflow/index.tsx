import { useSearchParams } from "react-router-dom";
import EmailVerificationPage from "./EmailVerification";

const AuthFlow = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  switch (mode) {
    case "verifyEmail":
      return <EmailVerificationPage oobCode={oobCode} mode={mode} />;
    case "resetPassword":
      return <></>;
    case "changeEmail":
      return <></>;
    case "mfaEnrollment":
      return <></>;
    default:
      return <></>;
  }
};

export default AuthFlow;
