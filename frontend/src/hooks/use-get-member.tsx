import { auth } from "@/config/firebase";
import { workspaceRepo } from "@/repositories/WorkspaceRepo";
import { MemberDataParams } from "@/types/member";
import { useEffect, useState } from "react";

const useGetMember = (authLoading: boolean) => {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberDataParams | null>(null);

  useEffect(() => {
    (async () => {
      if (authLoading) {
        return;
      }

      let member = workspaceRepo.membersManager.member;
      if (member) {
        setMember(member);
        return;
      }

      setLoading(true);
      const uid = auth.currentUser?.uid;

      if (uid && !member) {
        member = await workspaceRepo.membersManager.getUser(uid);
        setMember(member);
      }
      setLoading(false);
    })();
  }, [authLoading]);

  return { member, loading };
};

export default useGetMember;
