export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const formatPoints = (points: number | "-"): string => {
  return points === "-" ? "-" : `${points} pts`;
};

export const getStatusColor = (
  status: string
): "success" | "danger" | "warning" | "default" => {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "danger";
    case "vacation":
      return "warning";
    default:
      return "default";
  }
};
