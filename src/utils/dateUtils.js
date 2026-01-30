export const getDateRangeStart = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

export const getDateFromString = (dateString) => {
  return dateString.split('T')[0];
};
