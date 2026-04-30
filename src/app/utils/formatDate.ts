export const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]; // শুধু YYYY-MM-DD নেবে
};
