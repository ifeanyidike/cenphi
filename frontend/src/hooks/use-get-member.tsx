import { auth } from "@/config/firebase";
import { workspaceHub } from "@/repo/workspace_hub";
import { MemberDataParams } from "@/types/member";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const useGetMember = (authLoading: boolean) => {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberDataParams | null>(null);
  const location = useLocation();

  // Check if we're coming from onboarding to force a refresh
  const isFromOnboarding = location.state?.from === "onboarding";

  useEffect(() => {
    let isMounted = true;

    const fetchMember = async () => {
      if (authLoading) {
        return;
      }

      try {
        setLoading(true);
        const uid = auth.currentUser?.uid;

        if (!uid) {
          if (isMounted) {
            setMember(null);
            setLoading(false);
          }
          return;
        }

        // Force a fresh fetch if coming from onboarding
        const shouldRefresh = isFromOnboarding;
        let member = shouldRefresh ? null : workspaceHub.memberManager.member;

        if (member && isMounted) {
          setMember(member);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        member = await workspaceHub.memberManager.getUser(uid);

        if (isMounted) {
          setMember(member);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in useGetMember:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMember();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isFromOnboarding]);

  return { member, loading };
};

export default useGetMember;
