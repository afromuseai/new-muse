import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import type { Plan } from "@/context/PlanContext";

const VALID_PLANS: Plan[] = ["Free", "Pro", "Gold"];

export function PlanSync() {
  const { user } = useAuth();
  const { syncPlanFromServer } = usePlan();

  useEffect(() => {
    const serverPlan = user?.plan ?? "Free";
    if (VALID_PLANS.includes(serverPlan as Plan)) {
      syncPlanFromServer(serverPlan as Plan);
    } else {
      syncPlanFromServer("Free");
    }
  }, [user?.plan, syncPlanFromServer]);

  return null;
}
