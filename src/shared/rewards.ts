export function rewardEligibilityText(reward: {
  minimumAttendance: number | null;
  minimumLevel: number | null;
  requiredXP: number | null;
}) {
  const requirements = [
    reward.minimumAttendance ? `${reward.minimumAttendance} حضور` : null,
    reward.minimumLevel ? `سطح ${reward.minimumLevel}` : null,
    reward.requiredXP ? `${reward.requiredXP.toLocaleString("fa-IR")} گام` : null
  ].filter(Boolean);

  return requirements.length
    ? `شرط دریافت: ${requirements.join("، ")}`
    : "قابل دریافت برای همه اعضا";
}

export function isRewardEligible(
  reward: {
    minimumAttendance: number | null;
    minimumLevel: number | null;
    requiredXP: number | null;
  },
  user: { attendanceCount: number; userLevel: number; userXP: number }
) {
  return (
    (!reward.minimumAttendance ||
      user.attendanceCount >= reward.minimumAttendance) &&
    (!reward.minimumLevel || user.userLevel >= reward.minimumLevel) &&
    (!reward.requiredXP || user.userXP >= reward.requiredXP)
  );
}
