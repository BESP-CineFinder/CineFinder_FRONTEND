export const normalizeMovieKey = (input) => {
  return input.toLowerCase()
    .replace(/[^가-힣a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .trim();
}; 